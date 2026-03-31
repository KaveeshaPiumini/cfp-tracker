import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, verifyIdToken } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}/?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?error=missing_code`);
  }

  const session = await getSession();
  const storedVerifier = (session as any).pkceVerifier as string | undefined;
  const storedState = (session as any).oauthState as string | undefined;

  if (!storedVerifier || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code, storedVerifier);
    const user = await verifyIdToken(tokens.id_token);

    // Clear PKCE state, set user session
    (session as any).pkceVerifier = undefined;
    (session as any).oauthState = undefined;
    session.user = user;
    session.accessToken = tokens.access_token;
    await session.save();

    return NextResponse.redirect(`${appUrl}/`);
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`);
  }
}
