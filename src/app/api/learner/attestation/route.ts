import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const adminClient = getAdminClient();

    // Check if attestation already exists
    const { data: existing } = await adminClient
      .from("attestations")
      .select("attestation_number, generated_at")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({
        attestation_number: existing.attestation_number,
        generated_at: existing.generated_at,
        isNew: false,
      });
    }

    // Generate new number
    const year = new Date().getFullYear();
    let seqNum: number;

    const { data: seqData, error: seqError } = await adminClient.rpc("nextval_attestation");

    if (seqError) {
      const { count } = await adminClient
        .from("attestations")
        .select("id", { count: "exact", head: true })
        .gte("generated_at", `${year}-01-01`)
        .lt("generated_at", `${year + 1}-01-01`);
      seqNum = (count || 0) + 1;
    } else {
      seqNum = seqData;
    }

    const attestationNumber = `ATT-${year}-${String(seqNum).padStart(4, "0")}`;

    const { error: insertError } = await adminClient
      .from("attestations")
      .insert({
        user_id: user.id,
        attestation_number: attestationNumber,
        generated_at: new Date().toISOString(),
        generated_by: user.id,
      });

    if (insertError) {
      console.error("Insert attestation error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      attestation_number: attestationNumber,
      generated_at: new Date().toISOString(),
      isNew: true,
    });
  } catch (err: any) {
    console.error("Learner attestation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
