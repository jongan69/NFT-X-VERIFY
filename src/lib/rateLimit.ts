import { NextResponse } from "next/server";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const defaultConfig: RateLimitConfig = {
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
};

const store = new Map<string, { count: number; resetTime: number }>();

export default function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const { limit, windowMs } = { ...defaultConfig, ...config };

  return function rateLimitMiddleware(request: Request) {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const now = Date.now();

    const record = store.get(ip);
    if (!record) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      return NextResponse.next();
    }

    if (now > record.resetTime) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      return NextResponse.next();
    }

    if (record.count >= limit) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    record.count += 1;
    return NextResponse.next();
  };
}
