/**
 * GET /api/notify/run
 *
 * Triggered daily by an external cron service.
 * Protected by: Authorization: Bearer <CRON_SECRET>
 *
 * Checks all active subscriptions, finds ones where today matches
 * a notify_days offset before the CFP deadline, and sends reminder emails.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendDeadlineReminderEmail } from "@/lib/email";
import type { CFP } from "@/lib/types";

export const runtime = "nodejs";

function daysUntil(deadline: string): number {
  const d = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  // Auth check
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all subscriptions joined with CFPs that have upcoming deadlines
  const today = new Date().toISOString().split("T")[0];
  const { data: subscriptions, error } = await supabase
    .from("cfp_subscriptions")
    .select(`
      id,
      user_email,
      notify_days,
      cfps (
        id,
        title,
        conference_name,
        description,
        deadline,
        location,
        is_virtual,
        url,
        categories,
        tags,
        submitted_by,
        created_at
      )
    `)
    .gte("cfps.deadline", today); // only future/today CFPs

  if (error) {
    console.error("[notify/run] DB error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const sub of subscriptions ?? []) {
    const cfp = sub.cfps as unknown as CFP | null;
    if (!cfp) continue;

    const daysLeft = daysUntil(cfp.deadline);

    // Check if any of the user's chosen offsets match today
    const shouldNotify = (sub.notify_days as number[]).includes(daysLeft);
    if (!shouldNotify) continue;

    try {
      await sendDeadlineReminderEmail(sub.user_email, cfp, daysLeft);
      sent++;
      console.log(
        `[notify/run] Sent reminder to ${sub.user_email} for "${cfp.title}" (${daysLeft} days left)`
      );
    } catch (err) {
      const msg = `Failed to email ${sub.user_email} for CFP ${cfp.id}: ${err}`;
      console.error(`[notify/run] ${msg}`);
      errors.push(msg);
    }
  }

  return NextResponse.json({
    sent,
    errors: errors.length > 0 ? errors : undefined,
    checked: subscriptions?.length ?? 0,
  });
}
