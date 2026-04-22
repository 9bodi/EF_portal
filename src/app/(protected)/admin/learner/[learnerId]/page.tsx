import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Image from "next/image";
import UnlockButton from "@/components/admin/UnlockButton";
import LearnerPdfButtons from "@/components/admin/LearnerPdfButtons";

function getAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function formatTime(t: string | null): string {
  if (!t) return "-";
  const m = t.match(/(\d+):(\d+):(\d+)/);
  if (!m) return t;
  const h = parseInt(m[1]);
  const min = parseInt(m[2]);
  if (h > 0) return `${h}h${String(min).padStart(2, "0")}`;
  return `${min} min`;
}

interface PageProps {
  params: Promise<{ learnerId: string }>;
}

export default async function LearnerDetailPage({ params }: PageProps) {
  const { learnerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("users")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();
  if (!adminProfile || adminProfile.role !== "admin") redirect("/formation");

  const admin = getAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("id", learnerId)
    .single();
  if (!profile) redirect("/admin");

  const { data: chapters } = await admin
    .from("chapters")
    .select("*")
    .order("order", { ascending: true });

  const { data: progressData } = await admin
    .from("scorm_progress")
    .select("*")
    .eq("user_id", learnerId);

  const progressMap: Record<string, any> = {};
  (progressData || []).forEach((p: any) => {
    progressMap[p.chapter_id] = p;
  });

  const chaptersWithProgress = (chapters || []).map((ch: any) => {
    const prog = progressMap[ch.id] || null;
    return {
      ...ch,
      progress: prog,
      status: prog?.status || "not_started",
      score: prog?.score ?? null,
      total_time: prog?.total_time || null,
      completed_at: prog?.completed_at || null,
      last_accessed_at: prog?.last_accessed_at || null,
    };
  });

  const total = chaptersWithProgress.length;
  const completed = chaptersWithProgress.filter(
    (c: any) => c.status === "completed" || c.status === "passed"
  ).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const totalSeconds = chaptersWithProgress.reduce((acc: number, c: any) => {
    if (!c.total_time) return acc;
    const m = String(c.total_time).match(/(\d+):(\d+):(\d+)/);
    if (!m) return acc;
    return acc + parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
  }, 0);
  const totalH = Math.floor(totalSeconds / 3600);
  const totalM = Math.floor((totalSeconds % 3600) / 60);
  const totalTimeStr = totalH > 0 ? `${totalH}h${String(totalM).padStart(2, "0")}` : `${totalM} min`;

  const scored = chaptersWithProgress.filter((c: any) => c.score != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((a: number, c: any) => a + c.score, 0) / scored.length)
    : null;

  // Date début = premier accès à un module
  const allAccessDates = chaptersWithProgress
    .filter((c: any) => c.last_accessed_at)
    .map((c: any) => new Date(c.last_accessed_at).getTime());
  const startDate = allAccessDates.length > 0
    ? new Date(Math.min(...allAccessDates)).toLocaleDateString("fr-FR")
    : null;

  // Date fin = dernier module terminé (seulement si tous sont terminés)
  const allCompletedDates = chaptersWithProgress
    .filter((c: any) => c.completed_at)
    .map((c: any) => new Date(c.completed_at).getTime());
  const endDate = completed === total && allCompletedDates.length > 0
    ? new Date(Math.max(...allCompletedDates)).toLocaleDateString("fr-FR")
    : null;

  // Données sérialisables pour le composant PDF
  const learnerData = {
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone: profile.phone || null,
    commune: profile.commune || null,
    postal_code: profile.postal_code || null,
    funding_type: profile.funding_type || null,
    group_name: profile.group_name || null,
    created_at: profile.created_at,
    start_date: startDate,
    end_date: endDate,
  };

  const chaptersData = chaptersWithProgress.map((c: any) => ({
    order: c.order,
    title: c.title,
    status: c.status,
    total_time: c.total_time,
    score: c.score,
    completed_at: c.completed_at,
    last_accessed_at: c.last_accessed_at,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#0f1129" }}>
      {/* HEADER */}
      <header
        style={{
          background: "linear-gradient(135deg, #1a1d3a 0%, #0f1129 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image
            src="/img/LOGO_ELU-FORMATION_BLANC100.png"
            alt="Logo"
            width={140}
            height={36}
            style={{ objectFit: "contain", height: "auto" }}
          />
          <span
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#9aa5b8",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            ADMIN
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#9aa5b8", fontSize: 13 }}>
            {adminProfile.first_name} {adminProfile.last_name}
          </span>
          <a
            href="/admin"
            style={{
              color: "#6b7aff",
              fontSize: 13,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Retour admin
          </a>
          <a
            href="/api/auth/logout"
            style={{
              color: "#9aa5b8",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "7px 14px",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Déconnexion
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* INFOS APPRENANT */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a1d3a 0%, #252850 100%)",
            borderRadius: 16,
            padding: 28,
            marginBottom: 24,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
            {profile.first_name} {profile.last_name}
          </h1>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              color: "#e2e8f0",
              fontSize: 14,
            }}
          >
            <div>
              <span style={{ color: "#9ca3af" }}>Email</span>
              <br />
              {profile.email}
            </div>
            <div>
              <span style={{ color: "#9ca3af" }}>Téléphone</span>
              <br />
              {profile.phone || "-"}
            </div>
            <div>
              <span style={{ color: "#9ca3af" }}>Commune</span>
              <br />
              {profile.commune || "-"} {profile.postal_code ? `(${profile.postal_code})` : ""}
            </div>
            <div>
              <span style={{ color: "#9ca3af" }}>Financement</span>
              <br />
              {profile.funding_type || "-"}
            </div>
            <div>
              <span style={{ color: "#9ca3af" }}>Groupe</span>
              <br />
              {profile.group_name || "-"}
            </div>
            <div>
              <span style={{ color: "#9ca3af" }}>Inscrit le</span>
              <br />
              {new Date(profile.created_at).toLocaleDateString("fr-FR")}
            </div>
            <div>
              <span style={{ color: "#9ca3af" }}>Dernière connexion</span>
              <br />
              {profile.last_login_at
                ? new Date(profile.last_login_at).toLocaleDateString("fr-FR")
                : "-"}
            </div>
            <div>
              <span style={{ color: "#9ca3af" }}>Début formation</span>
              <br />
              {startDate || "-"}
            </div>
            <div>
              <span style={{ color: "#9ca3af" }}>Fin formation</span>
              <br />
              {endDate || "En cours"}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Complétion", value: `${pct}%`, color: "#6b7aff" },
            { label: "Chapitres", value: `${completed}/${total}`, color: "#22c55e" },
            { label: "Temps total", value: totalTimeStr, color: "#f59e0b" },
            { label: "Score moyen", value: avgScore !== null ? `${avgScore}%` : "-", color: "#ef4444" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "linear-gradient(135deg, #1a1d3a 0%, #252850 100%)",
                borderRadius: 14,
                padding: 24,
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}
            >
              <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
                {s.label}
              </div>
              <div style={{ color: s.color, fontSize: 28, fontWeight: 800 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* BOUTONS PDF */}
        <LearnerPdfButtons
          learner={learnerData}
          chapters={chaptersData}
          pct={pct}
          completed={completed}
          total={total}
          totalTimeStr={totalTimeStr}
          avgScore={avgScore}
        />

        {/* TABLEAU CHAPITRES */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a1d3a 0%, #252850 100%)",
            borderRadius: 16,
            padding: 24,
            border: "1px solid rgba(255,255,255,0.06)",
            overflowX: "auto",
          }}
        >
          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            Détail des chapitres
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {["#", "Chapitre", "Statut", "Temps", "Score", "Terminé le", "Dernier accès", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      style={{
                        color: "#9ca3af",
                        fontWeight: 600,
                        textAlign: "left",
                        padding: "10px 8px",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {chaptersWithProgress.map((ch: any) => {
                const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                  completed: { bg: "rgba(34,197,94,0.15)", text: "#22c55e", label: "Terminé" },
                  passed: { bg: "rgba(34,197,94,0.15)", text: "#22c55e", label: "Réussi" },
                  incomplete: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", label: "En cours" },
                  not_started: { bg: "rgba(156,163,175,0.1)", text: "#9ca3af", label: "Non commencé" },
                };
                const st = statusColors[ch.status] || statusColors.not_started;

                return (
                  <tr
                    key={ch.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 8px", color: "#9ca3af" }}>{ch.order}</td>
                    <td style={{ padding: "12px 8px", color: "#e2e8f0", fontWeight: 600 }}>
                      {ch.title}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span
                        style={{
                          background: st.bg,
                          color: st.text,
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", color: "#e2e8f0" }}>
                      {formatTime(ch.total_time)}
                    </td>
                    <td style={{ padding: "12px 8px", color: "#e2e8f0" }}>
                      {ch.score != null ? `${ch.score}%` : "-"}
                    </td>
                    <td style={{ padding: "12px 8px", color: "#9ca3af", fontSize: 12 }}>
                      {ch.completed_at
                        ? new Date(ch.completed_at).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td style={{ padding: "12px 8px", color: "#9ca3af", fontSize: 12 }}>
                      {ch.last_accessed_at
                        ? new Date(ch.last_accessed_at).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      {ch.status !== "completed" && ch.status !== "passed" && (
                        <UnlockButton
  learnerId={learnerId}
  chapterId={ch.id}
/>


                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px 0",
          color: "#9ca3af",
          fontSize: 12,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          marginTop: 40,
        }}
      >
        Besoin d&apos;aide ?{" "}
        <a href="mailto:contact@eluformation.fr" style={{ color: "#6b7aff" }}>
          contact@eluformation.fr
        </a>
      </footer>
    </div>
  );
}
