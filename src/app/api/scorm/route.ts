import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function timeToSeconds(t: string): number {
  if (!t || t === "00:00:00") return 0;
  const clean = t.split(".")[0];
  const parts = clean.split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function secondsToTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const chapterId = request.nextUrl.searchParams.get("chapterId");
  if (!chapterId) return NextResponse.json({ error: "chapterId requis" }, { status: 400 });

  const admin = getAdminClient();
  const { data: progress } = await admin
    .from("scorm_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .single();

  return NextResponse.json({ progress: progress || null });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await request.json();
    const { chapterId, cmiData, status, score } = body;
    if (!chapterId) return NextResponse.json({ error: "chapterId requis" }, { status: 400 });

    // Lire session_time directement depuis cmiData — mis à jour à chaque commit SCORM
    const sessionTime: string = cmiData?.["cmi.core.session_time"] || "00:00:00";

    const admin = getAdminClient();
    const { data: existing } = await admin
      .from("scorm_progress")
      .select("id, completed_at, total_time, session_count")
      .eq("user_id", user.id)
      .eq("chapter_id", chapterId)
      .maybeSingle();

    const now = new Date().toISOString();

    let normalizedStatus = "incomplete";
    const s = (status || "").toLowerCase();
    if (s === "complete" || s === "completed") normalizedStatus = "completed";
    else if (s === "passed") normalizedStatus = "passed";
    else if (s === "failed") normalizedStatus = "failed";
    else if (s === "not attempted" || s === "not_started") normalizedStatus = "not_started";

    const isCompleted = normalizedStatus === "completed" || normalizedStatus === "passed";

    // session_time SCORM = durée depuis LMSInitialize (session courante)
    // On prend le max entre l'existant et le nouveau pour éviter les régressions
    const sessionSecs = timeToSeconds(sessionTime);
    const existingSecs = timeToSeconds(existing?.total_time || "00:00:00");
    const newTotalTime = secondsToTime(Math.max(existingSecs, sessionSecs));

    if (existing) {
      const updateData: Record<string, unknown> = {
        cmi_data: cmiData,
        status: normalizedStatus,
        last_accessed_at: now,
        total_time: newTotalTime,
      };
      if (score !== undefined && score !== null) updateData.score = score;
      if (isCompleted && !existing.completed_at) updateData.completed_at = now;

      const { error } = await admin
        .from("scorm_progress")
        .update(updateData)
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId);

      if (error) {
        console.error("[SCORM] Erreur update:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await admin.from("scorm_progress").insert({
        user_id: user.id,
        chapter_id: chapterId,
        cmi_data: cmiData,
        status: normalizedStatus,
        score: score ?? null,
        total_time: secondsToTime(sessionSecs),
        session_count: 1,
        first_accessed_at: now,
        last_accessed_at: now,
        completed_at: isCompleted ? now : null,
      });

      if (error) {
        console.error("[SCORM] Erreur insert:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    console.log(`[SCORM] ✓ chapter=${chapterId} status=${normalizedStatus} total_time=${newTotalTime}`);
    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[SCORM] Exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
