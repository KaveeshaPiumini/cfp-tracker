import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, verifyIdToken, fetchUserInfo } from "@/lib/auth";
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
    const idTokenUser = await verifyIdToken(tokens.id_token);

    // Fetch userinfo to get name/email claims that may not be in the ID token
    const userInfoClaims = await fetchUserInfo(tokens.access_token);

    // Merge: userinfo claims fill in gaps left by the ID token
    const user = {
      ...idTokenUser,
      email: idTokenUser.email ?? userInfoClaims.email,
      name: idTokenUser.name ?? userInfoClaims.name,
      given_name: idTokenUser.given_name ?? userInfoClaims.given_name,
      family_name: idTokenUser.family_name ?? userInfoClaims.family_name,
      picture: idTokenUser.picture ?? userInfoClaims.picture,
    };

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
