import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { IUser, User } from "@/models/User";
import connectDB from "@/lib/mongodb";
import nacl from "tweetnacl";
import bs58 from "bs58";
import rateLimit from "@/lib/rateLimit";

interface VerifyHandleRequest {
  walletAddress: string;
  xHandle: string;
  signature: string;
  message: string;
}

const rateLimitMiddleware = rateLimit();

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(req);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }

    const body = (await req.json()) as VerifyHandleRequest;
    const { walletAddress, xHandle, signature, message } = body;

    if (!walletAddress || !xHandle || !signature || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
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
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    await connectDB();

    // Find the user and verify they have a verified NFT
    const user: IUser | null = await User.findOne({
      walletAddress,
      nftVerified: true,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found or NFT not verified" },
        { status: 404 },
      );
    }

    // Update user with X handle
    const updatedUser: IUser | null = await User.findOneAndUpdate(
      { walletAddress },
      {
        $set: {
          xHandle: xHandle.replace("@", ""), // Remove @ if present
          xLinked: true,
        },
        $unset: {
          verificationToken: "",
          verificationTokenExpiry: "",
          tempToken: "",
          tempTokenExpiry: "",
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying X handle:", error);
    return NextResponse.json(
      { error: "Failed to verify X handle" },
      { status: 500 },
    );
  }
}
