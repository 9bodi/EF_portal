import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

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

  const { data: learner } = await admin
    .from("users")
    .select("email, first_name")
    .eq("id", learnerId)
    .single();

  if (!learner) return NextResponse.json({ error: "Apprenant introuvable" }, { status: 404 });

  // Générer un nouveau mot de passe temporaire
  const tempPassword = "EluForm_" + Math.random().toString(36).slice(2, 8);

  // Mettre à jour le mot de passe dans Auth
  const { error: authError } = await admin.auth.admin.updateUserById(learnerId, {
    password: tempPassword,
  });

  if (authError) {
    console.error("[RESEND] Erreur update password:", authError);
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Remettre must_change_password à true
  await admin.from("users").update({ must_change_password: true }).eq("id", learnerId);

  // Envoyer le mail
  const sent = await sendWelcomeEmail(learner.email, learner.first_name, tempPassword);

  if (!sent) return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });

  return NextResponse.json({ success: true });
}
