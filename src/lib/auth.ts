import NextAuth, { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { User as DBUser, IUser } from "@/models/User";
import connectDB from "@/lib/mongodb";
import { User, Account } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { Types } from "mongoose";
import { NextRequest } from "next/server";

interface handlerProps {
  user: User;
  account: Account | null;
}

interface XHandleResponse {
  handle: string;
}

const fetchXHandle = async (userId: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://soltrendio.com/api/premium/twitter-handle`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      },
    );
    const data = (await response.json()) as XHandleResponse;
    return data.handle;
  } catch (error) {
    console.error("Error in fetchXHandle:", error);
    return null;
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }) as Provider,
  ],
  callbacks: {
    async signIn({ user, account }: handlerProps) {
      if (account?.provider === "twitter") {
        try {
          await connectDB();
          console.log("user", user);
          const pendingUser: IUser | null = await DBUser.findOne({
            tempToken: { $exists: true },
            tempTokenExpiry: { $gt: new Date() },
            nftVerified: true,
            xLinked: { $ne: true },
          });

          if (!pendingUser?._id) {
            console.error("No valid temporary token found");
            return false;
          }

          const xHandle = await fetchXHandle(user.id);
          if (!xHandle) {
            console.error("Failed to fetch X handle");
            return false;
          }
          try {
            // Get the MongoDB collection directly
            const collection = DBUser.collection;

            // Prepare the update
            const updateDoc = {
              $set: {
                profilePicture: user.image,
                xUsername: user.name,
                xHandle: xHandle,
                xLinked: true,
              },
              $unset: {
                verificationToken: "",
                verificationTokenExpiry: "",
                tempToken: "",
                tempTokenExpiry: "",
              },
            };

            const userId =
              pendingUser._id instanceof Types.ObjectId
                ? pendingUser._id
                : new Types.ObjectId(String(pendingUser._id));

            // Perform the update
            await collection.updateOne(
              {
                _id: userId,
              },
              updateDoc,
            );

            // Fetch the updated document
            const finalUser = await collection.findOne<IUser>({
              _id: userId,
            });

            if (!finalUser) {
              console.error("Failed to update user record");
              return false;
            }

            return true;
          } catch (error) {
            console.error("Error during database update:", error);
            return false;
          }
        } catch (error) {
          console.error("Error in Twitter OAuth flow:", error);
          return false;
        }
      }
      return true;
    },
    redirect({ baseUrl }: { url: string; baseUrl: string }): string {
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions);

type RouteHandler = (req: NextRequest, context: { params: { nextauth: string[] } }) => Promise<Response>;

export const GET: RouteHandler = async (req, context) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const response = await handler(req, context);
  return Response.json(response);
};

export const POST: RouteHandler = async (req, context) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const response = await handler(req, context);
  return Response.json(response);
};
