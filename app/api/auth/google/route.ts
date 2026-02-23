import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function POST(req: Request) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Missing Google Client ID or Secret" },
      { status: 500 },
    );
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 },
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("Google token error:", tokens);
      return NextResponse.json(
        { error: tokens.error_description || tokens.error },
        { status: 400 },
      );
    }

    const { access_token, refresh_token, expires_in } = tokens;

    if (refresh_token) {
      const cookieStore = await cookies();
      cookieStore.set("google_tasks_refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return NextResponse.json({ access_token, expires_in });
  } catch (error) {
    console.error("Token exchange failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
