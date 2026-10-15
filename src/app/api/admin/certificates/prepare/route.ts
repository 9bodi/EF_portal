import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { toIso, type Row } from "@/lib/certificates/pdf";

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
  if (!profile || profile.role !== "admin")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { rows, dateEdition } = await request.json() as { rows: Row[]; dateEdition: string };
  if (!rows?.length) return NextResponse.json({ error: "Aucune ligne" }, { status: 400 });

  const batchId = crypto.randomUUID();
  const payload = rows.map((r) => ({
    first_name: r.prenom,
    last_name: r.nom.toUpperCase(),
    email: r.email?.trim().toLowerCase() || null,
    collectivite: r.collectivite,
    departement: r.departement,
    intitule: r.intitule,
    date_formation: toIso(r.dateFormation),
    duree_heures: r.dureeHeures,
    taux: 100,
    date_edition: toIso(dateEdition),
    status: r.email?.trim() ? "pending" : "skipped",
    batch_id: batchId,
    created_by: user.id,
  }));

  const { error } = await admin.from("certificate_sends")
    .upsert(payload, { onConflict: "email,intitule,date_formation", ignoreDuplicates: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ batchId });
}
