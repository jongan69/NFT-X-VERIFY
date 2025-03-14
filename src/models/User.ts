import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  walletAddress: string;
  xUsername?: string;
  nftVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  tempToken?: string;
  tempTokenExpiry?: Date;
  xLinked?: boolean;
  xHandle?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Only define the schema if it hasn't been defined before
const userSchema =
  mongoose.models.User?.schema ||
  new mongoose.Schema<IUser>(
    {
      walletAddress: {
        type: String,
        required: true,
        unique: true,
      },
      xUsername: {
        type: String,
      },
      xHandle: {
        type: String,
      },
      profilePicture: {
        type: String,
      },
      nftVerified: {
        type: Boolean,
        default: false,
      },
      verificationToken: {
        type: String,
        index: {
          sparse: true,
        },
      },
      verificationTokenExpiry: {
        type: Date,
        index: {
          expireAfterSeconds: 0,
        },
      },
      tempToken: {
        type: String,
        index: {
          sparse: true,
        },
      },
      tempTokenExpiry: {
        type: Date,
        index: {
          expireAfterSeconds: 0,
        },
      },
    },
    {
      timestamps: true,
    },
  );

// Only create the model if it hasn't been created before
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
