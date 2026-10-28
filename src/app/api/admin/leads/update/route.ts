import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const VALID_STATUSES = ["nouveau", "contacte", "en-cours", "inscrit", "annule"];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    // Delete
    if (body.delete === true) {
      const { error } = await admin.from("leads").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Update
    const updates: Record<string, unknown> = {};

    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
    }

    const { error } = await admin.from("leads").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Leads update error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
