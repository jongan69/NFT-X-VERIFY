import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import authOptions from "@/lib/auth";

const handler = NextAuth(authOptions) as (request: NextRequest) => Promise<Response>;

export const GET = handler as (request: NextRequest) => Promise<Response>;
export const POST = handler as (request: NextRequest) => Promise<Response>;
