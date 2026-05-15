import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("cfps")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "CFP not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch the existing CFP to check ownership
  const { data: existing, error: fetchError } = await supabase
    .from("cfps")
    .select("submitted_by")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "CFP not found" }, { status: 404 });
  }

  if (existing.submitted_by !== user.sub) {
    return NextResponse.json(
      { error: "Forbidden: You are not the owner of this CFP" },
      { status: 403 }
    );
  }

  // 2. Perform the update
  const body = await request.json();
  const { data: updated, error: updateError } = await supabase
    .from("cfps")
    .update({
      title: body.title,
      conference_name: body.conference_name,
      description: body.description,
      deadline: body.deadline,
      location: body.location,
      is_virtual: body.is_virtual,
      url: body.url,
      categories: body.categories,
      tags: body.tags,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
