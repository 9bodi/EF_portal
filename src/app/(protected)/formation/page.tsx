import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChapterList from "@/components/formation/ChapterList";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function FormationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");
  if (profile.must_change_password) redirect("/first-login");

  const { data: chapters } = await supabase.from("chapters").select("*").order("order");
  const { data: progress } = await supabase.from("scorm_progress").select("*").eq("user_id", user.id);

  const chaptersWithProgress = (chapters || []).map((ch: any) => {
    const p = (progress || []).find((pr: any) => pr.chapter_id === ch.id);
    return { ...ch, progress: p || null };
  });

  const completed = chaptersWithProgress.filter(
    (c: any) => c.progress?.status === "completed" || c.progress?.status === "passed"
  ).length;
  const total = chaptersWithProgress.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const next = chaptersWithProgress.find(
    (c: any) => !c.progress || (c.progress.status !== "completed" && c.progress.status !== "passed")
  );

  const circumference = 175.9;
  const strokeDashoffset = circumference - (circumference * pct) / 100;

  await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen" style={{ background: "#f5f3ef", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <header
        style={{
          background: "#0f1f3d",
          padding: "16px 24px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/img/LOGO_ELU-FORMATION_BLANC100.png"
            alt="Élu Formation"
            width={200}
            height={65}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#fff", fontWeight: 600, fontSize: 15, margin: 0 }}>
            Bonjour {profile.first_name}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          {isAdmin && (
            <a
              href="/admin"
              style={{
                color: "#fff",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "0.03em",
              }}
            >
              Admin
            </a>
          )}
          <form action="/api/auth/logout" method="POST">
            <button
              style={{
                color: "#9aa5b8",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "7px 14px",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto px-4 py-8" style={{ maxWidth: 820 }}>
        <div
          className="flex items-center gap-6 mb-10 p-6 rounded-2xl"
          style={{ background: "#fff", border: "1px solid rgba(15,31,61,0.08)" }}
        >
          <svg width="80" height="80" viewBox="0 0 72 72" className="flex-shrink-0">
            <circle cx="36" cy="36" r="28" fill="none" stroke="#e8e5de" strokeWidth="6" />
            <circle
              cx="36" cy="36" r="28" fill="none"
              stroke="#0f1f3d" strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
            <text x="36" y="41" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="14" fontWeight="500" fill="#0f1f3d">
              {pct}%
            </text>
          </svg>

          <div className="flex-1">
            <h2 className="font-semibold mb-1" style={{ fontSize: 20, color: "#0f1f3d" }}>
              Votre avancement
            </h2>
            <p className="text-sm mb-3" style={{ color: "#6b7280" }}>
              {completed} chapitre{completed > 1 ? "s" : ""} terminé{completed > 1 ? "s" : ""} sur {total}
            </p>
            <div className="w-full rounded-full" style={{ background: "#e8e5de", height: 8 }}>
              <div className="rounded-full" style={{ background: "#0f1f3d", height: 8, width: `${pct}%`, transition: "width 0.8s ease" }} />
            </div>
            {next && (
              <a
                href={`/formation/${next.id}`}
                className="inline-flex items-center gap-2 mt-4 font-medium text-sm text-white"
                style={{ background: "#0f1f3d", padding: "11px 22px", borderRadius: 10, textDecoration: "none" }}
              >
                {completed > 0 ? "Continuer la formation" : "Commencer la formation"}
                <span>→</span>
              </a>
            )}
          </div>
        </div>

        <h3 className="font-semibold mb-6" style={{ fontSize: 16, color: "#0f1f3d" }}>
          Votre parcours de formation
        </h3>
        <ChapterList chapters={chaptersWithProgress} />
      </main>

      <footer className="text-center py-6 text-sm" style={{ color: "#9aa5b8" }}>
        Support : contact@eluformation.fr
      </footer>
    </div>
  );
}
