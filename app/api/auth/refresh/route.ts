import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = 'edge';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function POST() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return NextResponse.json({ error: "Missing Google Client ID or Secret" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("google_tasks_refresh_token");

    if (!refreshToken) {
        return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: refreshToken.value,
                grant_type: "refresh_token",
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error("Token refresh error:", tokens);
            return NextResponse.json({ error: tokens.error_description || tokens.error }, { status: 401 });
        }

        const { access_token, expires_in } = tokens;

        return NextResponse.json({ access_token, expires_in });
    } catch (error) {
        console.error("Refresh failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
