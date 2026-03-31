import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";
import type { CFPFormData } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const deadlineFilter = searchParams.get("deadline"); // "upcoming" | "this_month" | "next_3_months"
  const search = searchParams.get("search");
  const isVirtual = searchParams.get("is_virtual"); // "true" | "false"

  let query = supabase.from("cfps").select("*").order("deadline", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  if (isVirtual === "true") {
    query = query.eq("is_virtual", true);
  } else if (isVirtual === "false") {
    query = query.eq("is_virtual", false);
  }

  const now = new Date();
  if (deadlineFilter === "upcoming") {
    query = query.gte("deadline", now.toISOString().split("T")[0]);
  } else if (deadlineFilter === "this_month") {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    query = query
      .gte("deadline", now.toISOString().split("T")[0])
      .lte("deadline", endOfMonth.toISOString().split("T")[0]);
  } else if (deadlineFilter === "next_3_months") {
    const in3Months = new Date(now);
    in3Months.setMonth(in3Months.getMonth() + 3);
    query = query
      .gte("deadline", now.toISOString().split("T")[0])
      .lte("deadline", in3Months.toISOString().split("T")[0]);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,conference_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("DB error:", error);
    return NextResponse.json({ error: "Failed to fetch CFPs" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CFPFormData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validation
  if (!body.title || !body.conference_name || !body.deadline || !body.category) {
    return NextResponse.json(
      { error: "Missing required fields: title, conference_name, deadline, category" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("cfps")
    .insert([
      {
        title: body.title,
        conference_name: body.conference_name,
        description: body.description ?? null,
        deadline: body.deadline,
        location: body.location ?? null,
        is_virtual: body.is_virtual ?? false,
        url: body.url ?? null,
        category: body.category,
        tags: body.tags ?? [],
        submitted_by: user.sub,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    return NextResponse.json({ error: "Failed to create CFP" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
