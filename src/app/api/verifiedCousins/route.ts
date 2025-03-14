import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { IUser, User } from "@/models/User";

interface VerifiedCousin {
  xUsername: string | undefined;
  xHandle: string | undefined;
  profilePicture: string | undefined;
}

interface VerifiedCousinsResponse {
  verifiedCousins: VerifiedCousin[];
  error?: string;
  status: number;
}

export async function GET(): Promise<NextResponse<VerifiedCousinsResponse>> {
  try {
    await connectDB();

    const verifiedCousins = await User.find(
      {},
      { xUsername: 1, xHandle: 1, profilePicture: 1, _id: 0 },
    );

    const verifiedCousinsArray = verifiedCousins.map((cousin: IUser): VerifiedCousin => {
      const plainCousin = cousin.toObject() as IUser;
      return {
        xUsername: plainCousin.xUsername,
        xHandle: plainCousin.xHandle,
        profilePicture: plainCousin.profilePicture,
      };
    });
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
