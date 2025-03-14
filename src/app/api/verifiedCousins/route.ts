import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { IUser, User } from "@/models/User";

interface VerifiedCousinsResponse {
  verifiedCousins: string[];
  error?: string;
  status: number;
}

export async function GET(): Promise<NextResponse<VerifiedCousinsResponse>> {
  try {
    await connectDB();

    const verifiedCousins = await User.find({ xUsername: { $exists: true } });
    console.log(verifiedCousins);
    const verifiedCousinsArray = verifiedCousins.map(
      (cousin: IUser) => cousin.xUsername!,
    );
    console.log(verifiedCousinsArray);
    return NextResponse.json({
      verifiedCousins: verifiedCousinsArray,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching verified cousins:", error);
    return NextResponse.json({
      verifiedCousins: [],
      error: "Internal server error",
      status: 500,
    });
  }
}
