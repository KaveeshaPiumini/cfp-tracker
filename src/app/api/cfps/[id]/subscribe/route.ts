import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// GET /api/cfps/[id]/subscribe — check subscription status for current user
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ subscribed: false, notify_days: [] });
  }

  const { data } = await supabase
    .from("cfp_subscriptions")
    .select("notify_days")
    .eq("cfp_id", id)
    .eq("user_id", user.sub)
    .maybeSingle();

  return NextResponse.json({
    subscribed: !!data,
    notify_days: data?.notify_days ?? [],
  });
}

// POST /api/cfps/[id]/subscribe — create or update subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json(
      { error: "No email address on your account. Please update your profile." },
      { status: 422 }
    );
  }

  let body: { notify_days: number[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const notify_days = body.notify_days;
  if (
    !Array.isArray(notify_days) ||
    notify_days.length === 0 ||
    !notify_days.every((d) => Number.isInteger(d) && d >= 0)
  ) {
    return NextResponse.json(
      { error: "notify_days must be a non-empty array of positive integers" },
      { status: 400 }
    );
  }

  // Upsert (one subscription per user per CFP)
  const { data, error } = await supabase
    .from("cfp_subscriptions")
    .upsert(
      {
        cfp_id: id,
        user_id: user.sub,
        user_email: email,
        notify_days,
      },
      { onConflict: "cfp_id,user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/cfps/[id]/subscribe — remove subscription
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("cfp_subscriptions")
    .delete()
    .eq("cfp_id", id)
    .eq("user_id", user.sub);

  if (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
