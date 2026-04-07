import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const admin = getAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("id, first_name, must_change_password")
    .eq("email", email)
    .single();

  if (!profile) {
    return NextResponse.json({ success: true });
  }

  if (profile.must_change_password) {
    const newTempPassword = "EluForm_" + Math.random().toString(36).slice(2, 8);

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
      password: newTempPassword,
    });

    if (updateError) {
      console.error("[RESET] Erreur update password:", updateError);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    await sendWelcomeEmail(email, profile.first_name, newTempPassword);
    console.log("[RESET] Nouveau MDP temporaire envoye a", email);
  } else {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: appUrl + "/reset-password" },
    });

    if (error) {
      console.error("[RESET] Erreur generation lien:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    if (data?.properties?.action_link) {
      const resetLink = data.properties.action_link.replace(
        process.env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/verify",
        appUrl + "/api/auth/confirm"
      );
      await sendPasswordResetEmail(email, profile.first_name, resetLink);
      console.log("[RESET] Lien de reset envoye a", email);
    }
  }

  return NextResponse.json({ success: true });
}
