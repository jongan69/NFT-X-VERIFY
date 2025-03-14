"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState, useCallback } from "react";
import {
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Spinner,
} from "@radix-ui/themes";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import bs58 from "bs58";
// import { MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";

interface VerifyNFTResponse {
  hasNFT: boolean;
  verificationToken?: string;
}

interface StoreTokenResponse {
  tempKey: string;
}

export const VerificationFlow = () => {
  const { connected, publicKey, signMessage } = useWallet();
  const [hasNFT, setHasNFT] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [isXLinking, setIsXLinking] = useState<boolean>(false);

  const checkNFTOwnership = useCallback(
    async (walletAddress: string) => {
      try {
        setIsVerifying(true);

        // Create a message to sign
        const message = `Verify NFT ownership for ${walletAddress} at ${Date.now()}`;
        const messageBytes = new TextEncoder().encode(message);

        // Request signature from wallet
        let signature: Uint8Array | undefined;
        try {
          if (!signMessage) {
            throw new Error("Wallet does not support message signing");
          }
          // Use a more specific type for the signMessage function
          const signMessageFn = signMessage as (
            message: Uint8Array,
          ) => Promise<Uint8Array>;
          signature = await signMessageFn(messageBytes);
        } catch (error) {
          console.error("Error signing message:", error);
          toast.error("Please sign the message to verify wallet ownership");
          return;
        }

        const response = await fetch("/api/verify-nft", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress,
            signature: bs58.encode(signature),
            message,
          }),
        });

        const data = (await response.json()) as VerifyNFTResponse;
        console.log("NFT verification response:", data);

        setHasNFT(data.hasNFT);
        if (data.hasNFT) {
          if (!data.verificationToken) {
            console.error("No verification token in response:", data);
            toast.error("Verification error, please try again");
            return;
          }
          setVerificationToken(data.verificationToken);
          toast.success("NFT verification successful!");
        } else {
          toast.error("Required NFT not found in wallet");
        }
      } catch (error) {
        console.error("Error verifying NFT:", error);
        toast.error("Failed to verify NFT ownership");
      } finally {
        setIsVerifying(false);
      }
    },
    [signMessage],
  );

  useEffect(() => {
    if (connected && publicKey) {
      void checkNFTOwnership(publicKey.toString());
    }
  }, [connected, publicKey, checkNFTOwnership]);

  const handleXLink = async () => {
    if (!publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    if (!verificationToken) {
      console.error("No verification token available:", {
        hasNFT,
        verificationToken,
      });
      toast.error("Please verify your NFT ownership first");
      return;
    }

    try {
      setIsXLinking(true);
      console.log("Starting Twitter OAuth with token:", verificationToken);
      // Store token before OAuth
      const response = await fetch("/api/store-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to store verification token");
      }

      const data = (await response.json()) as StoreTokenResponse;
      const { tempKey } = data;
      console.log("Received temporary key:", tempKey);

      // Store tempKey in sessionStorage
      sessionStorage.setItem("verification_temp_key", tempKey);

      // Start the Twitter OAuth flow
      await signIn("twitter", {
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Error initiating Twitter login:", error);
      toast.error("Failed to start Twitter login");
    } finally {
      setIsXLinking(false);
    }
  };

  return (
    <Container size="2">
      <Flex
        direction="column"
        gap="6"
        align="center"
        justify="center"
        style={{ minHeight: "80vh" }}
      >
        <Card size="3" style={{ width: "100%", maxWidth: "500px" }}>
          <Flex direction="column" gap="4" align="center">
            <Heading size="6" align="center">
              NFT Verification & X Link
            </Heading>

            {!connected && (
              <Flex direction="column" gap="3" align="center">
                <Text size="4" align="center" color="gray">
                  Connect your wallet to begin verification
                </Text>
                <WalletMultiButton />
              </Flex>
            )}

            {connected && !hasNFT && (
              <Flex direction="column" gap="3" align="center">
                <Text size="4" align="center">
                  Verifying NFT ownership
                </Text>
                {isVerifying ? (
                  <Flex gap="2" align="center">
                    <Spinner size="2" />
                    <Text>Checking your wallet...</Text>
                  </Flex>
                ) : (
                  <Text color="red" size="3">
                    Required NFT not found in wallet
                  </Text>
                )}
              </Flex>
            )}

            {connected && hasNFT && (
              <Flex direction="column" gap="3" align="center">
                <Text size="4" align="center" color="green">
                  NFT Verified! 🎉
                </Text>
                <Text size="3" align="center" color="gray">
                  Now, let&apos;s link your X account
                </Text>
                <Button
                  size="3"
                  onClick={() => {
                    void handleXLink();
                  }}
                  disabled={isXLinking}
                >
                  Link X Account
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
};
