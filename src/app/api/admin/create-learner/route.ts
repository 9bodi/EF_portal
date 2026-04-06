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

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const body = await request.json();
  const { email, firstName, lastName, phone, fundingType, commune, postalCode, groupName } = body;

  if (!email || !firstName || !lastName || !commune || !postalCode || !fundingType) {
    return NextResponse.json({ error: "Email, prenom, nom, commune, code postal et financement requis" }, { status: 400 });
  }

  if (fundingType !== "dif" && fundingType !== "cohort") {
    return NextResponse.json({ error: "Type de financement invalide" }, { status: 400 });
  }

  const admin = getAdminClient();
  const tempPassword = "EluForm_" + Math.random().toString(36).slice(2, 8);

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError) {
    console.error("[ADMIN] Erreur creation auth:", authError);
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const insertData: Record<string, unknown> = {
    id: authUser.user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    commune,
    postal_code: postalCode,
    funding_type: fundingType,
    role: "learner",
    must_change_password: true,
    created_at: new Date().toISOString(),
  };
  if (phone) insertData.phone = phone;
  if (groupName) insertData.group_name = groupName;

  const { error: profileError } = await admin.from("users").insert(insertData);

  if (profileError) {
    console.error("[ADMIN] Erreur creation profil:", profileError);
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    learner: { id: authUser.user.id, email, firstName, lastName, tempPassword },
  });
}
