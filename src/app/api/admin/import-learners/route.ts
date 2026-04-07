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

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === "," || ch === ";") { result.push(current.trim()); current = ""; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const admin = getAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return NextResponse.json({ error: "Le fichier doit contenir un en-tete et au moins une ligne" }, { status: 400 });

  const header = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_")
  );

  const colMap: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    prenom: ["prenom", "first_name", "firstname"],
    nom: ["nom", "last_name", "lastname"],
    email: ["email", "mail", "e-mail"],
    code_postal: ["code_postal", "cp", "postal_code", "code_postal"],
    financement: ["financement", "funding", "funding_type", "type_financement"],
    telephone: ["telephone", "tel", "phone"],
    commune: ["commune", "ville", "city"],
    groupe: ["groupe", "group", "group_name", "nom_groupe"],
  };

  for (const [key, names] of Object.entries(aliases)) {
    const idx = header.findIndex((h) => names.includes(h));
    if (idx !== -1) colMap[key] = idx;
  }

  if (colMap.prenom === undefined || colMap.nom === undefined || colMap.email === undefined ||
      colMap.code_postal === undefined || colMap.financement === undefined) {
    return NextResponse.json({
      error: "Colonnes obligatoires manquantes. Attendues : prenom, nom, email, code_postal, financement. Trouvees : " + header.join(", ")
    }, { status: 400 });
  }

  const results: { line: number; email: string; success: boolean; tempPassword?: string; error?: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const prenom = cols[colMap.prenom] || "";
    const nom = cols[colMap.nom] || "";
    const email = cols[colMap.email] || "";
    const cp = cols[colMap.code_postal] || "";
    const financement = (cols[colMap.financement] || "").toLowerCase();
    const telephone = colMap.telephone !== undefined ? cols[colMap.telephone] || "" : "";
    const commune = colMap.commune !== undefined ? cols[colMap.commune] || "" : "";
    const groupe = colMap.groupe !== undefined ? cols[colMap.groupe] || "" : "";

    if (!prenom || !nom || !email || !cp || !financement) {
      results.push({ line: i + 1, email: email || "?", success: false, error: "Champs obligatoires manquants" });
      continue;
    }

    const fundingType = financement === "dif" ? "dif" : financement === "cohort" ? "cohort" : null;
    if (!fundingType) {
      results.push({ line: i + 1, email, success: false, error: "Financement invalide (dif ou cohort)" });
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
      postal_code: cp,
      funding_type: fundingType,
      role: "learner",
      must_change_password: true,
      created_at: new Date().toISOString(),
    };
    if (telephone) insertData.phone = telephone;
    if (commune) insertData.commune = commune;
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
