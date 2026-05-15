import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { sendDeadlineReminderEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch CFP details
    const { data: cfp, error: cfpError } = await supabase
      .from("cfps")
      .select("*")
      .eq("id", id)
      .single();

    if (cfpError || !cfp) {
      return NextResponse.json({ error: "CFP not found" }, { status: 404 });
    }

    // Calculate days left for the template
    const deadlineDate = new Date(cfp.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Send email
    await sendDeadlineReminderEmail(session.user.email, cfp, daysLeft);

    return NextResponse.json({ success: true, message: "Email sent!" });
  } catch (error: any) {
    console.error("[notify-me-now] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
