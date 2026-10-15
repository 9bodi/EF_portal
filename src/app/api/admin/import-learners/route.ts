import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { parseCsvLine, normalizeHeader } from "@/lib/csv";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const VALID_MANDATS = [
  "maire", "adjoint", "conseiller_municipal", "conseiller_departemental",
  "conseiller_regional", "president_epci", "vice_president_epci",
  "conseiller_communautaire", "autre"
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = getAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

  if (/\.(xlsx|xls)$/i.test(file.name)) {
    return NextResponse.json({
      error: "Fichier Excel détecté. Dans Excel : Fichier → Enregistrer sous → CSV UTF-8, puis réimportez."
    }, { status: 400 });
  }

  const text = (await file.text()).replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return NextResponse.json({ error: "Le fichier doit contenir un en-tête et au moins une ligne" }, { status: 400 });

  const header = parseCsvLine(lines[0]).map(normalizeHeader);

  const colMap: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    prenom: ["prenom", "first_name", "firstname"],
    nom: ["nom", "last_name", "lastname"],
    email: ["email", "mail", "e-mail"],
    telephone: ["telephone", "tel", "phone"],
    code_postal: ["code_postal", "cp", "postal_code"],
    commune: ["commune", "ville", "city"],
    financement: ["financement", "funding", "funding_type", "type_financement"],
    mandat: ["mandat", "type_mandat", "mandate"],
    collectivite: ["collectivite", "collectivité", "rattachement", "mairie", "epci"],
    numero_dossier_dife: ["numero_dossier_dife", "n_dossier", "dossier_dife", "num_dife"],
    groupe: ["groupe", "group", "group_name", "nom_groupe"],
  };

  for (const [key, names] of Object.entries(aliases)) {
    const idx = header.findIndex((h) => names.includes(h));
    if (idx !== -1) colMap[key] = idx;
  }

  const required = ["prenom", "nom", "email", "financement"];
  const missing = required.filter((k) => colMap[k] === undefined);
  if (missing.length > 0) {
    return NextResponse.json({
      error: `Colonnes obligatoires manquantes : ${missing.join(", ")}. Trouvées : ${header.join(", ")}`
    }, { status: 400 });
  }

  const results: { line: number; email: string; success: boolean; tempPassword?: string; error?: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const get = (k: string) => (colMap[k] !== undefined ? (cols[colMap[k]] || "").trim() : "");

    const prenom = get("prenom");
    const nom = get("nom");
    const email = get("email");
    const telephone = get("telephone");
    const cp = get("code_postal");
    const commune = get("commune");
    const financement = get("financement").toLowerCase();
    const mandat = get("mandat").toLowerCase().replace(/\s+/g, "_");
    const collectivite = get("collectivite");
    const numeroDossierDife = get("numero_dossier_dife");
    const groupe = get("groupe");

    if (!prenom || !nom || !email || !financement) {
      results.push({ line: i + 1, email: email || "?", success: false, error: "Champs obligatoires manquants (prénom, nom, email, financement)" });
      continue;
    }

    const fundingType = financement === "dif" ? "dif" : (financement === "collectivite" || financement === "cohort") ? "collectivite" : null;
    if (!fundingType) {
      results.push({ line: i + 1, email, success: false, error: "Financement invalide (dif ou collectivite)" });
      continue;
    }

    if (mandat && !VALID_MANDATS.includes(mandat)) {
      results.push({ line: i + 1, email, success: false, error: `Mandat invalide : ${mandat}` });
      continue;
    }

    const tempPassword = "EluForm_" + Math.random().toString(36).slice(2, 8);

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      results.push({ line: i + 1, email, success: false, error: authError.message });
      continue;
    }

    const insertData: Record<string, unknown> = {
      id: authUser.user.id,
      email,
      first_name: prenom,
      last_name: nom,
      phone: telephone || null,
      postal_code: cp || null,
      commune: commune || null,
      funding_type: fundingType,
      mandat: mandat || null,
      collectivite: collectivite || null,
      role: "learner",
      must_change_password: true,
      created_at: new Date().toISOString(),
      access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    if (numeroDossierDife) insertData.numero_dossier_dife = numeroDossierDife;
    if (groupe) insertData.group_name = groupe;

    const { error: profileError } = await admin.from("users").insert(insertData);

    if (profileError) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      results.push({ line: i + 1, email, success: false, error: profileError.message });
      continue;
    }

    await sendWelcomeEmail(email, prenom, tempPassword);
    results.push({ line: i + 1, email, success: true, tempPassword });
  }

  const created = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({ created, failed, total: results.length, details: results });
}
