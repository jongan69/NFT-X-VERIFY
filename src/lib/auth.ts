import { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { User as DBUser, IUser } from "@/models/User";
import connectDB from "@/lib/mongodb";
import { User, Account } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { Types } from "mongoose";

interface handlerProps {
  user: User;
  account: Account | null;
}

interface XHandleResponse {
  handle: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchXHandle = async (
  userId: string,
  retries = 3,
): Promise<string | null> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(
        `[fetchXHandle] Attempt ${attempt + 1}/${retries} for userId:`,
        userId,
      );
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

      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get("retry-after") ?? String(Math.pow(2, attempt)),
        );
        console.log(
          `[fetchXHandle] Rate limited. Waiting ${retryAfter} seconds...`,
        );
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as XHandleResponse;
      console.log("[fetchXHandle] Successfully fetched handle:", data.handle);
      return data.handle;
    } catch (error) {
      console.error(`[fetchXHandle] Error on attempt ${attempt + 1}:`, error);
      if (attempt === retries - 1) {
        console.error("[fetchXHandle] All retry attempts failed");
        return null;
      }
      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  return null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        params: {
          "tweet.read": "offline.access",
          "users.read": "offline.access",
        },
      },
    }) as Provider,
  ],
  callbacks: {
    async signIn({ user, account }: handlerProps) {
      console.log("[signIn] Starting callback with user:", {
        id: user.id,
        name: user.name,
      });
      console.log("[signIn] Account details:", {
        provider: account?.provider,
        type: account?.type,
      });

      if (account?.provider === "twitter") {
        try {
          console.log("[signIn] Connecting to database...");
          await connectDB();

          console.log("[signIn] Finding pending user with temp token...");
          const pendingUser: IUser | null = await DBUser.findOne({
            tempToken: { $exists: true },
            tempTokenExpiry: { $gt: new Date() },
            nftVerified: true,
            xLinked: { $ne: true },
          });

          if (!pendingUser?._id) {
            console.error(
              "[signIn] No valid temporary token found. Query result:",
              pendingUser,
            );
            return false;
          }

          // console.log("[signIn] Found pending user:", {
          //   id: pendingUser._id,
          //   tempTokenExpiry: pendingUser.tempTokenExpiry,
          //   nftVerified: pendingUser.nftVerified,
          // });

          console.log("[signIn] Fetching X handle for user:", user.id);
          const xHandle = await fetchXHandle(user.id);
          if (!xHandle) {
            console.error("[signIn] Failed to fetch X handle after retries");
            return false;
          }

          try {
            console.log("[signIn] Updating user document...");
            const collection = DBUser.collection;
            const updateDoc = {
              $set: {
                profilePicture: user.image,
                xUsername: user.name ?? "",
                xUserId: user.id,
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

            console.log("[signIn] Update document:", updateDoc);

            const userId =
              pendingUser._id instanceof Types.ObjectId
                ? pendingUser._id
                : new Types.ObjectId(String(pendingUser._id));

            await collection.updateOne({ _id: userId }, updateDoc);

            console.log("[signIn] Verifying update...");
            const finalUser = await collection.findOne<IUser>({
              _id: userId,
            });

            if (!finalUser) {
              console.error("[signIn] Failed to verify user update");
              return false;
            }

            console.log("[signIn] Successfully updated user:", {
              id: finalUser._id,
              xLinked: finalUser.xLinked,
              xHandle: finalUser.xHandle,
            });
            return true;
          } catch (error) {
            console.error("[signIn] Database update error:", error);
            return false;
          }
        } catch (error) {
          console.error("[signIn] OAuth flow error:", error);
          return false;
        }
      }
      return true;
    },
    redirect({ url, baseUrl }: { url: string; baseUrl: string }): string {
      console.log("[redirect] Incoming redirect request:", { url, baseUrl });
      console.log("[redirect] Redirecting to:", baseUrl);
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};

export default authOptions; 