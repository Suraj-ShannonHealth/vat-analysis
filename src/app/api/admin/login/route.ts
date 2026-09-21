import { NextRequest, NextResponse } from "next/server";
import { getAdminCredentials, ADMIN_SESSION_COOKIE, SESSION_VALUE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;
    const creds = getAdminCredentials();

    if (username === creds.username && password === creds.password) {
      const res = NextResponse.json({ success: true });
      res.cookies.set(ADMIN_SESSION_COOKIE, SESSION_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return res;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
