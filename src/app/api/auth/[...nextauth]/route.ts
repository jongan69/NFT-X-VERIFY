import NextAuth, { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { User as DBUser, IUser } from "@/models/User";
import connectDB from "@/lib/mongodb";
import { User, Account } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { NextRequest, NextResponse } from "next/server";

interface TwitterApiResponse {
  data: {
    username: string;
  };
}

interface handlerProps {
  user: User;
  account: Account | null;
}

const fetchXHandle = async (
  userId: string,
  accessToken: string,
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/${userId}?user.fields=username`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonResponse = (await response.json()) as TwitterApiResponse;

    // Type guard to validate the response structure
    if (
      typeof jsonResponse === "object" &&
      jsonResponse !== null &&
      "data" in jsonResponse &&
      typeof jsonResponse.data === "object" &&
      jsonResponse.data !== null &&
      "username" in jsonResponse.data &&
      typeof jsonResponse.data.username === "string"
    ) {
      return jsonResponse.data.username;
    }

    console.error("Invalid response structure from Twitter API:", jsonResponse);
    return null;
  } catch (error) {
    console.error("Error fetching X handle:", error);
    return null;
  }
};

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }) as Provider,
  ],
  callbacks: {
    async signIn({ user, account }: handlerProps) {
      // Detailed logging of the OAuth data
      console.log("Full Twitter OAuth data:", {
        user: JSON.stringify(user, null, 2),
        account: JSON.stringify(account, null, 2),
      });

      if (account?.provider === "twitter") {
        try {
          await connectDB();

          // Find user with valid temporary token
          const pendingUser: IUser | null = await DBUser.findOne({
            tempToken: { $exists: true },
            tempTokenExpiry: { $gt: new Date() },
            nftVerified: true,
            xLinked: { $ne: true },
          });

          console.log(
            "Found pending user:",
            pendingUser
              ? {
                  id: pendingUser._id,
                  wallet: pendingUser.walletAddress,
                  tempToken: pendingUser.tempToken,
                }
              : null,
          );

          if (!pendingUser) {
            console.error("No valid temporary token found");
            return false;
          }

          if (!account.access_token) {
            console.error("No access token available");
            return false;
          }

          // Fetch the X handle using the access token from OAuth
          const xHandle = await fetchXHandle(user.id, account.access_token);
          if (!xHandle) {
            console.error("Failed to fetch X handle");
          }

          // Update the user record with Twitter username and clear tokens
          const updatedUser: IUser | null = await DBUser.findByIdAndUpdate(
            pendingUser._id,
            {
              xUsername: user.name,
              xHandle: xHandle ?? null,
              xLinked: true,
              $unset: {
                verificationToken: "",
                verificationTokenExpiry: "",
                tempToken: "",
                tempTokenExpiry: "",
              },
            },
            { new: true },
          );

          console.log("Updated user record:", updatedUser);

          if (!updatedUser) {
            console.error("Failed to update user record");
            return false;
          }

          return true;
        } catch (error) {
          console.error("Error in Twitter OAuth flow:", error);
          return false;
        }
      }
      return true;
    },
    redirect({ url, baseUrl }): string {
      console.log("Redirect callback:", { url, baseUrl });
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
    error: "/", // Redirect to home page on error
  },
};

type NextAuthHandler = (req: NextRequest) => Promise<NextResponse>;

const handler = NextAuth(authOptions) as NextAuthHandler;

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handler(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handler(request);
}
