import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import { drawCertificate, fileName, type Row } from "@/lib/certificates/pdf";
import { sendCertificateEmail } from "@/lib/email";
import { getBackground } from "@/lib/certificates/background";

export const runtime = "nodejs";
export const maxDuration = 60;

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function valid(r: Row) {
  return r.prenom && r.nom && r.collectivite
    && r.departement && r.intitule && r.dateFormation && r.dureeHeures > 0;
}


export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = getAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { rows, dateEdition, batchId } = await request.json() as
    { rows: Row[]; dateEdition: string; batchId: string };

  if (!rows?.length || !dateEdition || !batchId)
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const email = rows[0].email?.trim();
  if (!email) return NextResponse.json({ error: "Email manquant" }, { status: 400 });
  if (!rows.every(valid)) return NextResponse.json({ error: "Ligne invalide" }, { status: 400 });

  let bg: string;
  try {
    bg = await getBackground(new URL(request.url).origin);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  const attachments = rows.map((r) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    drawCertificate(doc, r, dateEdition, bg);
    return {
      filename: fileName(r),
      content: Buffer.from(doc.output("arraybuffer")).toString("base64"),
    };
  });

  const res = await sendCertificateEmail(email, rows[0].prenom, rows[0].intitule, attachments);

  await Promise.all(rows.map((r) =>
    admin.from("certificate_sends").update({
      status: res.ok ? "sent" : "failed",
      resend_id: res.ok ? res.id ?? null : null,
      error_message: res.ok ? null : res.error,
      sent_at: res.ok ? new Date().toISOString() : null,
    })
    .eq("batch_id", batchId)
    .eq("email", email)
    .eq("intitule", r.intitule)
    .eq("date_formation", r.dateFormation)
  ));

  if (!res.ok) {
    const status = res.code === "QUOTA_EXCEEDED" ? 429 : 500;
    return NextResponse.json({ code: res.code, error: res.error }, { status });
  }
  return NextResponse.json({ sent: true, id: res.id });
}
