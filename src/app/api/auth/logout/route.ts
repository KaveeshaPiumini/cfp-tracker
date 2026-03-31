import { NextResponse } from "next/server";
import { buildLogoutUrl } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await getSession();
  session.destroy();

  const logoutUrl = buildLogoutUrl(appUrl);
  return NextResponse.redirect(logoutUrl);
}
