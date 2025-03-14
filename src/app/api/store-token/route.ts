import { IUser, User } from "@/models/User";
import connectDB from "@/lib/mongodb";
import { Types } from "mongoose";

interface RequestBody {
  token: string;
}

export async function POST(request: Request) {
  try {
    console.log("[store-token] Starting token storage process");
    const body = (await request.json()) as RequestBody;
    const { token } = body;

    if (!token) {
      console.log("[store-token] Error: No token provided");
      return Response.json(
        { error: "Verification token is required" },
        { status: 400 },
      );
    }

    console.log("[store-token] Connecting to database");
    await connectDB();

    // Find user with valid verification token
    console.log("[store-token] Searching for user with token:", token);
    const user: IUser | null = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
      nftVerified: true,
      xLinked: { $ne: true },
    });

    if (!user) {
      console.log("[store-token] Error: Invalid or expired token");
      return Response.json(
        { error: "Invalid or expired verification token" },
        { status: 400 },
      );
    }

    console.log("[store-token] Found valid user:", user._id);

    // Generate a temporary token for the OAuth flow
    const tempToken = Math.random().toString(36).substring(2);
    const tempTokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    console.log("[store-token] Generated temp token, updating user");
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
      console.log("[store-token] Error: Failed to update user");
      return Response.json({ error: "Failed to update user" }, { status: 500 });
    }

    console.log("[store-token] Successfully updated user with temp token");
    return Response.json({ tempKey: tempToken });
  } catch (error) {
    console.error("[store-token] Error in token storage process:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
