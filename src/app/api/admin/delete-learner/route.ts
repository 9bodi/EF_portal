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
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = getAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { learnerId } = await request.json();
  if (!learnerId) return NextResponse.json({ error: "learnerId requis" }, { status: 400 });

  // Supprimer scorm_progress
  await admin.from("scorm_progress").delete().eq("user_id", learnerId);

  // Supprimer profil users
  await admin.from("users").delete().eq("id", learnerId);

  // Supprimer compte Auth
  const { error } = await admin.auth.admin.deleteUser(learnerId);
  if (error) {
    console.error("[DELETE] Erreur suppression auth:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
