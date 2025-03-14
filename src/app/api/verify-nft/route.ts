import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { User, IUser } from "@/models/User";
import connectDB from "@/lib/mongodb";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchAllDigitalAssetByOwner } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import crypto from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import rateLimit from "@/lib/rateLimit";
import mongoose from "mongoose";

interface VerifyRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

const NFT_TO_CHECK = process.env.NFT_ADDRESS;
const RPC_ENDPOINT =
  process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

const rateLimitMiddleware = rateLimit();

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(req);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }

    const body = (await req.json()) as VerifyRequest;
    const { walletAddress, signature, message } = body;
    console.log("Received verification request for wallet:", walletAddress);

    if (!walletAddress || !signature || !message) {
      console.log("Error: Missing required parameters");
      return NextResponse.json(
        { error: "Wallet address, signature, and message are required" },
        { status: 400 },
      );
    }

    // Verify wallet ownership
    try {
      const publicKey = new PublicKey(walletAddress);
      const signatureBytes = bs58.decode(signature);
      const messageBytes = new TextEncoder().encode(message);

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes(),
      );

      if (!isValid) {
        console.error("Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("Using RPC endpoint:", RPC_ENDPOINT);

    if (!NFT_TO_CHECK) {
      throw new Error("NFT_ADDRESS environment variable is not set");
    }

    const nftCollectionPubKey = publicKey(NFT_TO_CHECK);
    console.log("NFT Collection Public Key:", nftCollectionPubKey.toString());

    // Use Solana's PublicKey for the wallet address
    const walletPubKey = publicKey(walletAddress);
    console.log("Wallet Public Key:", walletPubKey.toString());

    // Create Umi instance
    const umi = createUmi(RPC_ENDPOINT).use(mplTokenMetadata());
    console.log("Created Umi instance");

    // Fetch all NFTs owned by the wallet
    console.log("Fetching NFTs owned by wallet...");
    const assets = await fetchAllDigitalAssetByOwner(umi, walletPubKey);
    console.log("Found NFTs:", assets.length);

    // Check if any of the NFTs belong to our collection
    let hasNFT = false;
    for (const asset of assets) {
      console.log("Checking NFT:", {
        mint: asset.mint.publicKey.toString(),
        collection:
          asset.metadata.collection?.__option === "Some"
            ? asset.metadata.collection.value?.key?.toString()
            : undefined,
      });

      if (
        asset.metadata.collection.__option === "Some" &&
        asset.metadata.collection.value?.key?.toString() ===
          nftCollectionPubKey.toString()
      ) {
        hasNFT = true;
        console.log("Found matching NFT from collection!");
        break;
      }
    }

    console.log("NFT ownership check result:", hasNFT);

    let verificationToken: string | null = null;

    if (hasNFT) {
      console.log("NFT verified, connecting to MongoDB...");
      await connectDB();

      console.log("Generating verification token...");
      verificationToken = crypto.randomBytes(32).toString("hex");
      console.log("Generated verification token:", verificationToken);

      const updatedUser = await User.findOneAndUpdate<IUser>(
        { walletAddress },
        {
          $set: {
            walletAddress,
            nftVerified: true,
            verificationToken,
            verificationTokenExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          },
        },
        { upsert: true, new: true },
      );

      // Log the complete user record
      console.log("User record updated:", {
        id:
          updatedUser._id instanceof mongoose.Types.ObjectId
            ? updatedUser._id.toString()
            : String(updatedUser._id),
        walletAddress: updatedUser.walletAddress,
        verificationToken: updatedUser.verificationToken,
        expiry: updatedUser.verificationTokenExpiry,
      });
    }

    const response = {
      hasNFT,
      ...(verificationToken ? { verificationToken } : {}),
    };
    console.log("Sending response:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error verifying NFT:", error);
    return NextResponse.json(
      { error: "Failed to verify NFT ownership" },
      { status: 500 },
    );
  }
}
