import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Image from "next/image";
import UnlockButton from "@/components/admin/UnlockButton";
import LearnerPdfButtons from "@/components/admin/LearnerPdfButtons";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function formatTime(t: string | null): string {
  if (!t) return "-";
  const match = t.match(/(\d+):(\d+):(\d+)/);
  if (!match) return "-";
  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (h > 0) return h + "h" + String(m).padStart(2, "0");
  return m + "min";
}

interface PageProps {
  params: Promise<{ learnerId: string }>;
}

export default async function LearnerDetailPage({ params }: PageProps) {
  const { learnerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getAdminClient();

  const { data: profile } = await admin.from("users").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/formation");

  const { data: learner } = await admin.from("users").select("*").eq("id", learnerId).single();
  if (!learner) redirect("/admin");

  const { data: chapters } = await admin.from("chapters").select("*").order("order");
  const { data: progress } = await admin.from("scorm_progress").select("*").eq("user_id", learnerId);

  const chaptersWithProgress = (chapters || []).map((ch: any) => {
    const p = (progress || []).find((pr: any) => pr.chapter_id === ch.id);
    return {
      ...ch,
      status: p?.status || "not_started",
      total_time: p?.total_time || null,
      score: p?.score ?? null,
      completed_at: p?.completed_at || null,
      last_accessed_at: p?.last_accessed_at || null,
    };
  });

  const completed = chaptersWithProgress.filter((c: any) => c.status === "completed" || c.status === "passed").length;
  const total = chaptersWithProgress.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const totalSeconds = chaptersWithProgress.reduce((acc: number, c: any) => {
    if (!c.total_time) return acc;
    const match = c.total_time.match(/(\d+):(\d+):(\d+)/);
    if (!match) return acc;
    return acc + parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
  }, 0);
  const totalH = Math.floor(totalSeconds / 3600);
  const totalM = Math.floor((totalSeconds % 3600) / 60);
  const totalTimeStr = totalH > 0 ? totalH + "h" + String(totalM).padStart(2, "0") : totalM + "min";

  const scored = chaptersWithProgress.filter((c: any) => c.score !== null);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((a: number, c: any) => a + c.score, 0) / scored.length)
    : null;

  // Serializable data for the client component
  const learnerData = {
    first_name: learner.first_name,
    last_name: learner.last_name,
    email: learner.email,
    phone: learner.phone || "",
    commune: learner.commune || "",
    postal_code: learner.postal_code || "",
    funding_type: learner.funding_type || "",
    group_name: learner.group_name || "",
    created_at: learner.created_at,
  };

  const chaptersData = chaptersWithProgress.map((ch: any) => ({
    order: ch.order,
    title: ch.title,
    status: ch.status,
    total_time: ch.total_time,
    score: ch.score,
    completed_at: ch.completed_at,
    last_accessed_at: ch.last_accessed_at,
  }));

  return (
    <div className="min-h-screen" style={{ background: "#f5f3ef", fontFamily: "'DM Sans', sans-serif" }}>

      <header
        style={{
          background: "#373b94",
          padding: "14px 24px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image
            src="/img/LOGO_ELU-FORMATION_BLANC100.png"
            alt="Élu Formation"
            width={160}
            height={52}
            style={{ objectFit: "contain", height: "auto" }}

            priority
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              padding: "3px 10px",
              borderRadius: 99,
              marginBottom: 4,
            }}
          >
            ADMIN
          </span>
          <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 }}>
            {profile.first_name} {profile.last_name}
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16 }}>
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
            }}
          >
            ← Retour
          </a>
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

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Learner info card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 24, border: "1px solid rgba(55,59,148,0.08)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#373b94", marginBottom: 16 }}>{learner.first_name} {learner.last_name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm" style={{ color: "#4b5563" }}>
            <div><span style={{ color: "#9ca3af" }}>Email</span><br/>{learner.email}</div>
            <div><span style={{ color: "#9ca3af" }}>Téléphone</span><br/>{learner.phone || "-"}</div>
            <div><span style={{ color: "#9ca3af" }}>Commune</span><br/>{learner.commune ? learner.commune + (learner.postal_code ? " (" + learner.postal_code + ")" : "") : learner.postal_code || "-"}</div>
            <div><span style={{ color: "#9ca3af" }}>Financement</span><br/>{learner.funding_type === "dif" ? "DIF élu" : learner.funding_type === "cohort" ? "Cohorte" : "-"}</div>
            <div><span style={{ color: "#9ca3af" }}>Groupe</span><br/>{learner.group_name || "-"}</div>
            <div><span style={{ color: "#9ca3af" }}>Inscrit le</span><br/>{new Date(learner.created_at).toLocaleDateString("fr-FR")}</div>
            <div><span style={{ color: "#9ca3af" }}>Dernière connexion</span><br/>{learner.last_login_at ? new Date(learner.last_login_at).toLocaleDateString("fr-FR") : "-"}</div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center", border: "1px solid rgba(55,59,148,0.08)" }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#373b94" }}>{pct}%</p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Complétion</p>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center", border: "1px solid rgba(55,59,148,0.08)" }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#373b94" }}>{completed}/{total}</p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Chapitres terminés</p>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center", border: "1px solid rgba(55,59,148,0.08)" }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#373b94" }}>{totalTimeStr}</p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Temps total</p>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center", border: "1px solid rgba(55,59,148,0.08)" }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#373b94" }}>{avgScore !== null ? avgScore + "%" : "-"}</p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Score moyen</p>
          </div>
        </div>

        {/* PDF buttons */}
        <LearnerPdfButtons
          learner={learnerData}
          chapters={chaptersData}
          pct={pct}
          completed={completed}
          total={total}
          totalTimeStr={totalTimeStr}
          avgScore={avgScore}
        />

        {/* Chapters table */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid rgba(55,59,148,0.08)" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#373b94" }}>Détail par chapitre</h3>
          </div>
          <table className="w-full">
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chapitre</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Temps</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Terminé le</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dernier accès</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chaptersWithProgress.map((ch: any) => {
                const isCompleted = ch.status === "completed" || ch.status === "passed";
                const isStarted = ch.status === "incomplete";
                return (
                  <tr key={ch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm" style={{ color: "#373b94" }}>
                      <span style={{ color: "#9ca3af", marginRight: 8 }}>{ch.order}</span>{ch.title}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Terminé</span>}
                      {isStarted && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">En cours</span>}
                      {!isCompleted && !isStarted && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Non commencé</span>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{formatTime(ch.total_time)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{ch.score !== null ? ch.score + "%" : "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{ch.completed_at ? new Date(ch.completed_at).toLocaleDateString("fr-FR") : "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{ch.last_accessed_at ? new Date(ch.last_accessed_at).toLocaleDateString("fr-FR") : "-"}</td>
                    <td className="px-4 py-4 text-center">
                      {isCompleted
                        ? <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>
                        : <UnlockButton learnerId={learnerId} chapterId={ch.id} chapterTitle={ch.title} />
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "24px", fontSize: 13, color: "#9ca3af" }}>
        Support : contact@eluformation.fr
      </footer>
    </div>
  );
}
