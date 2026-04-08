import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const admin = getAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const { learnerId, chapterId } = await request.json();
  if (!learnerId || !chapterId) return NextResponse.json({ error: "learnerId et chapterId requis" }, { status: 400 });

  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("scorm_progress")
    .select("id")
    .eq("user_id", learnerId)
    .eq("chapter_id", chapterId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("scorm_progress")
      .update({ status: "completed", completed_at: now, last_accessed_at: now })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin.from("scorm_progress").insert({
      user_id: learnerId,
      chapter_id: chapterId,
      status: "completed",
      cmi_data: {},
      total_time: "00:00:00",
      score: null,
      session_count: 0,
      first_accessed_at: now,
      last_accessed_at: now,
      completed_at: now,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
