import { NextResponse } from "next/server";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
} from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function GET() {
  const codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();
  const authUrl = buildAuthorizationUrl(codeChallenge, state);

  // Store verifier + state in session cookie for validation on callback
  const session = await getSession();
  (session as any).pkceVerifier = codeVerifier;
  (session as any).oauthState = state;
  await session.save();

  return NextResponse.redirect(authUrl);
}
