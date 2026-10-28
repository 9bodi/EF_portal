import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const VALID_TYPES = ["pre-inscription", "rappel"];

const VALID_MANDATS = [
  "conseiller_municipal",
  "adjoint",
  "maire",
  "autre",
];

const VALID_FORMATIONS = [
  "Image et communication de l'élu (e-learning)",
  "Budget et finances locales (visio)",
  "L'IA pour les élus locaux (visio)",
  "Prendre la parole en public (visio)",
  "Communiquer sur les réseaux sociaux (visio)",
  "Fonctionnement des collectivités (visio)",
  "Urbanisme - Cadre légal et responsabilités (visio)",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, prenom, nom, email, telephone, commune, mandat, formations, disponibilites, message, newsletter } = body;

    // --- Validation ---
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Type de formulaire invalide." }, { status: 400 });
    }

    if (!prenom || !prenom.trim()) {
      return NextResponse.json({ error: "Le prénom est requis." }, { status: 400 });
    }
    if (!nom || !nom.trim()) {
      return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
    }

    if (type === "pre-inscription") {
      if (!email || !email.trim()) {
        return NextResponse.json({ error: "L'email est requis." }, { status: 400 });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({ error: "Format d'email invalide." }, { status: 400 });
      }
      if (!telephone || !telephone.trim()) {
        return NextResponse.json({ error: "Le téléphone est requis." }, { status: 400 });
      }
      if (formations && Array.isArray(formations)) {
        for (const f of formations) {
          if (!VALID_FORMATIONS.includes(f)) {
            return NextResponse.json({ error: `Formation invalide : ${f}` }, { status: 400 });
          }
        }
      }
    }

    if (type === "rappel") {
      if (!telephone || !telephone.trim()) {
        return NextResponse.json({ error: "Le téléphone est requis." }, { status: 400 });
      }
      if (email && email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return NextResponse.json({ error: "Format d'email invalide." }, { status: 400 });
        }
      }
    }

    if (mandat && !VALID_MANDATS.includes(mandat)) {
      return NextResponse.json({ error: "Mandat invalide." }, { status: 400 });
    }

    // --- Insert ---
    const admin = getAdminClient();

    const { data, error } = await admin.from("leads").insert({
      type,
      status: "nouveau",
      prenom: prenom.trim(),
      nom: nom.trim(),
      email: email?.trim() || null,
      telephone: telephone?.trim() || null,
      commune: commune?.trim() || null,
      mandat: mandat || null,
      formations: formations && formations.length > 0 ? formations : null,
      disponibilites: disponibilites?.trim() || null,
      message: message?.trim() || null,
      newsletter: newsletter || false,
      source: "campus",
    }).select().single();

    if (error) {
      console.error("Lead insert error:", error);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Leads API error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
