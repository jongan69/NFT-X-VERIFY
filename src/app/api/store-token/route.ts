import { NextResponse } from "next/server";
import { IUser, User } from "@/models/User";
import connectDB from "@/lib/mongodb";
import { Types } from "mongoose";

interface RequestBody {
  token: string;
}

// interface UserDocument {
//   _id: Types.ObjectId;
//   walletAddress: string;
//   tempToken: string;
//   tempTokenExpiry: Date;
// }

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Find user with valid verification token
    const user: IUser | null = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
      nftVerified: true,
      xLinked: { $ne: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 },
      );
    }

    // Generate a temporary token for the OAuth flow
    const tempToken = Math.random().toString(36).substring(2);
    const tempTokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update user with temporary token
    const updatedUser: IUser | null = await User.findByIdAndUpdate(
      user._id as Types.ObjectId,
      {
        tempToken,
        tempTokenExpiry,
      },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
    }

    return NextResponse.json({ tempKey: tempToken });
  } catch (error) {
    console.error("Error storing token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
