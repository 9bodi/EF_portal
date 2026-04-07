import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Image from "next/image";
import CreateLearnerForm from "@/components/admin/CreateLearnerForm";
import ImportLearnersForm from "@/components/admin/ImportLearnersForm";
import LearnersTable from "@/components/admin/LearnersTable";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getAdminClient();

  const { data: profile } = await admin.from("users").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/formation");

  const { data: learners } = await admin
    .from("users")
    .select("*")
    .neq("role", "admin")
    .order("last_name");

  const { data: allProgress } = await admin.from("scorm_progress").select("*");
  const { data: chapters } = await admin.from("chapters").select("id, title").order("order");

  const totalChapters = (chapters || []).length;

  const learnersWithStats = (learners || []).map((learner: any) => {
    const progress = (allProgress || []).filter((p: any) => p.user_id === learner.id);
    const completed = progress.filter((p: any) => p.status === "completed" || p.status === "passed").length;
    const totalSeconds = progress.reduce((acc: number, p: any) => {
      if (!p.total_time) return acc;
      const match = p.total_time.match(/(\d+):(\d+):(\d+)/);
      if (!match) return acc;
      return acc + parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
    }, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const timeStr = hours > 0 ? hours + "h" + String(minutes).padStart(2, "0") : minutes + "min";
    const avgScore = progress.filter((p: any) => p.score !== null && p.score !== undefined);
    const scoreStr = avgScore.length > 0
      ? Math.round(avgScore.reduce((a: number, p: any) => a + p.score, 0) / avgScore.length) + "%"
      : "-";
    const lastAccess = progress.reduce((latest: string | null, p: any) => {
      if (!p.last_accessed_at) return latest;
      if (!latest) return p.last_accessed_at;
      return p.last_accessed_at > latest ? p.last_accessed_at : latest;
    }, null);

    return {
      ...learner,
      completed,
      totalChapters,
      timeStr,
      scoreStr,
      lastAccess,
      pct: totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0,
    };
  });

  const totalLearners = learnersWithStats.length;
  const activeLearners = learnersWithStats.filter((l: any) => l.lastAccess).length;
  const avgCompletion = totalLearners > 0
    ? Math.round(learnersWithStats.reduce((a: number, l: any) => a + l.pct, 0) / totalLearners)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header
        style={{
          background: "#0f1f3d",
          padding: "14px 24px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        {/* Logo gauche */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/img/LOGO_ELU-FORMATION_BLANC100.png"
            alt="Élu Formation"
            width={160}
            height={52}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* ADMIN + prénom centré */}
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

        {/* Actions droite */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16 }}>
          <a
            href="/formation"
            style={{ color: "#9aa5b8", fontSize: 13, textDecoration: "none" }}
          >
            Voir comme apprenant
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{totalLearners}</p>
            <p className="text-sm text-gray-500">Apprenants inscrits</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{activeLearners}</p>
            <p className="text-sm text-gray-500">Apprenants actifs</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{avgCompletion}%</p>
            <p className="text-sm text-gray-500">Complétion moyenne</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{totalChapters}</p>
            <p className="text-sm text-gray-500">Chapitres</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6 items-start flex-wrap">
          <CreateLearnerForm />
          <ImportLearnersForm />
        </div>

        <LearnersTable learners={learnersWithStats} />
      </main>
    </div>
  );
}
