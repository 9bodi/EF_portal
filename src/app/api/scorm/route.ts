import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  const chapterId = request.nextUrl.searchParams.get("chapterId");
  if (!chapterId) return NextResponse.json({ error: "chapterId requis" }, { status: 400 });
  const { data } = await supabase.from("scorm_progress").select("cmi_data").eq("user_id", user.id).eq("chapter_id", chapterId).single();
  return NextResponse.json({ cmiData: data?.cmi_data || null });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  const body = await request.json();
  const { chapterId, cmiData, status, sessionTime, score } = body;
  if (!chapterId) return NextResponse.json({ error: "chapterId requis" }, { status: 400 });

  const normalizedStatus = ["completed", "passed"].includes(status) ? status : ["failed"].includes(status) ? "failed" : status === "not attempted" ? "not_started" : "incomplete";
  const isCompleted = ["completed", "passed"].includes(normalizedStatus);

  const { data: existing } = await supabase.from("scorm_progress").select("id, total_time").eq("user_id", user.id).eq("chapter_id", chapterId).single();

  if (existing) {
    const updateData: any = { cmi_data: cmiData, status: normalizedStatus, score, is_completed: isCompleted, last_accessed_at: new Date().toISOString() };
    if (isCompleted && !existing.total_time) updateData.completed_at = new Date().toISOString();
    if (sessionTime && sessionTime !== "00:00:00") {
      await supabase.rpc("add_session_time", { p_progress_id: existing.id, p_session_time: sessionTime });
    }
    await supabase.from("scorm_progress").update(updateData).eq("id", existing.id);
  } else {
    await supabase.from("scorm_progress").insert({
      user_id: user.id, chapter_id: chapterId, cmi_data: cmiData, status: normalizedStatus, score, total_time: sessionTime || "00:00:00", is_completed: isCompleted, started_at: new Date().toISOString(), last_accessed_at: new Date().toISOString(), completed_at: isCompleted ? new Date().toISOString() : null,
    });
  }
  return NextResponse.json({ success: true });
}
