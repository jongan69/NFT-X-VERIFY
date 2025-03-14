"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import ClientWalletButton from "../Wallet/ClientWalletButton";
import { useEffect, useState, useCallback } from "react";
import {
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Spinner,
  TextField,
  Dialog,
} from "@radix-ui/themes";
import { PersonIcon } from "@radix-ui/react-icons";

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
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [xHandle, setXHandle] = useState<string>("");
  const [isSubmittingHandle, setIsSubmittingHandle] = useState<boolean>(false);

  const checkNFTOwnership = useCallback(
    async (walletAddress: string) => {
      try {
        setIsVerifying(true);

        // Create a message to sign
        const message = `Verify Cousin NFT ownership for ${walletAddress} at ${Date.now()}`;
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

  const handleManualXHandle = async () => {
    if (!publicKey || !signMessage) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setIsSubmittingHandle(true);

      // Create a message to sign
      const message = `Link X handle @${xHandle} to wallet ${publicKey.toString()} at ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      // Request signature from wallet
      let signature: Uint8Array;
      try {
        signature = await signMessage(messageBytes);
      } catch (error) {
        console.error("Error signing message:", error);
        toast.error("Please sign the message to verify wallet ownership");
        return;
      }

      const response = await fetch("/api/verify-handle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          xHandle: xHandle,
          signature: bs58.encode(signature),
          message,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        status?: number;
      };

      if (!data.success) {
        throw new Error(data.error ?? "Failed to verify X handle");
      }

      toast.success("X handle verified successfully!");
      setShowManualInput(false);
    } catch (error) {
      console.error("Error verifying X handle:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to verify X handle",
      );
    } finally {
      setIsSubmittingHandle(false);
    }
  };

  return (
    <Container size="2">
      <Flex
        direction="column"
        gap="6"
        align="center"
        justify="center"
        style={{ minHeight: "30vh" }}
      >
        <Card size="3" style={{ width: "100%", maxWidth: "500px" }}>
          <Flex direction="column" gap="4" align="center">
            <Heading size="6" align="center">
              Cousin NFT Verification & X Link
            </Heading>
            <Text size="3" color="gray" align="center">
              Follow these steps to join our exclusive community
            </Text>

            {!connected && (
              <Flex direction="column" gap="3" align="center">
                <Text size="4" align="center" color="gray">
                  Step 1: Connect your wallet to begin verification
                </Text>
                <ClientWalletButton />
                <Text size="2" color="gray" align="center">
                  Make sure your wallet contains your cousin
                </Text>
              </Flex>
            )}

            {connected && !hasNFT && (
              <Flex direction="column" gap="3" align="center">
                <Text size="4" align="center">
                  Step 2: Verifying NFT ownership
                </Text>
                {isVerifying ? (
                  <Flex direction="column" gap="3" align="center">
                    <Spinner size="3" />
                    <Text>Checking your wallet...</Text>
                    <Text size="2" color="gray">
                      Please sign the message when prompted
                    </Text>
                  </Flex>
                ) : (
                  <Flex direction="column" gap="2" align="center">
                    <Text color="red" size="3">
                      Required NFT not found in wallet
                    </Text>
                    <Text size="2" color="gray">
                      Please make sure you have your cousin NFT in your wallet
                    </Text>
                  </Flex>
                )}
              </Flex>
            )}

            {connected && hasNFT && (
              <Flex direction="column" gap="3" align="center">
                <Text size="4" align="center" color="green">
                  NFT Verified! 🎉
                </Text>
                <Text size="3" align="center" color="gray">
                  Step 3: Link your X account
                </Text>
                <Text size="2" color="gray" align="center">
                  Connect your X account to join the community
                </Text>
                <Flex
                  direction="column"
                  gap="2"
                  align="center"
                  style={{ width: "100%" }}
                >
                  <Button
                    size="3"
                    onClick={() => {
                      void handleXLink();
                    }}
                    disabled={isXLinking}
                    style={{ minWidth: "200px" }}
                  >
                    {isXLinking ? (
                      <Flex gap="2" align="center">
                        <Spinner size="2" />
                        <Text>Connecting...</Text>
                      </Flex>
                    ) : (
                      "Link X Account"
                    )}
                  </Button>
                  <Text size="2" color="gray" align="center">
                    or
                  </Text>
                  <Button
                    size="3"
                    variant="outline"
                    onClick={() => setShowManualInput(true)}
                    style={{ minWidth: "200px" }}
                  >
                    Enter X Handle Manually
                  </Button>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Card>

        <Dialog.Root open={showManualInput} onOpenChange={setShowManualInput}>
          <Dialog.Content style={{ maxWidth: 450 }}>
            <Dialog.Title>Enter Your X Handle</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Please enter your X handle (with or without @)
            </Dialog.Description>

            <Flex direction="column" gap="3">
              <TextField.Root
                placeholder="@username"
                value={xHandle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setXHandle(e.target.value)
                }
              >
                <TextField.Slot>
                  <PersonIcon height="16" width="16" />
                </TextField.Slot>
              </TextField.Root>
              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={() => void handleManualXHandle()}
                  disabled={!xHandle.trim() || isSubmittingHandle}
                >
                  {isSubmittingHandle ? (
                    <Flex gap="2" align="center">
                      <Spinner size="2" />
                      <Text>Verifying...</Text>
                    </Flex>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </Container>
  );
};
