import { jwtVerify, createRemoteJWKSet } from "jose";
import type { SessionUser } from "./types";

const THUNDER_BASE_URL = process.env.THUNDER_BASE_URL!;
const CLIENT_ID = process.env.THUNDER_CLIENT_ID!;
const REDIRECT_URI = process.env.THUNDER_REDIRECT_URI!;

// Remote JWK Set fetched from Thunder's JWKS endpoint
// Thunder uses self-signed cert in dev; in prod it's behind Nginx with Let's Encrypt
const getJWKS = () => {
  const jwksUrl = new URL(`${THUNDER_BASE_URL}/oauth2/jwks`);
  return createRemoteJWKSet(jwksUrl);
};

// ─── PKCE Helpers ────────────────────────────────────────────────────────────

function base64URLEncode(buffer: ArrayBuffer): string {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64URLEncode(digest);
}

export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

// ─── Authorization URL ────────────────────────────────────────────────────────

export function buildAuthorizationUrl(
  codeChallenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return `${THUNDER_BASE_URL}/oauth2/authorize?${params.toString()}`;
}

// ─── Token Exchange ───────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${THUNDER_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json() as Promise<TokenResponse>;
}

// ─── JWT Verification ─────────────────────────────────────────────────────────

export async function verifyIdToken(idToken: string): Promise<SessionUser> {
  const JWKS = getJWKS();

  const { payload } = await jwtVerify(idToken, JWKS, {
    audience: CLIENT_ID,
    issuer: THUNDER_BASE_URL,
  });

  // Debug: log payload to see available claims in development
  if (process.env.NODE_ENV === "development") {
    console.log("ID Token Payload:", payload);
  }

  return {
    sub: payload.sub as string,
    email: (payload.email ?? payload.preferred_username) as string | undefined,
    name: payload.name as string | undefined,
    given_name: (payload.given_name ?? payload.first_name ?? payload.firstName) as string | undefined,
    family_name: (payload.family_name ?? payload.last_name ?? payload.lastName) as string | undefined,
    picture: payload.picture as string | undefined,
  };
}

// ─── Logout URL ───────────────────────────────────────────────────────────────

export function buildLogoutUrl(postLogoutRedirectUri: string): string {
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
    client_id: CLIENT_ID,
  });
  return `${THUNDER_BASE_URL}/oidc/logout?${params.toString()}`;
}
