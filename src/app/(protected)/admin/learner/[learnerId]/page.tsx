import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

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

  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0f1f3d] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/admin" className="text-sm text-gray-300 hover:text-white transition">← Retour</a>
          <h1 className="text-xl font-bold">Detail apprenant</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#0f1f3d]">{learner.first_name} {learner.last_name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-600">
            <div><span className="text-gray-400">Email</span><br/>{learner.email}</div>
            <div><span className="text-gray-400">Telephone</span><br/>{learner.phone || "-"}</div>
            <div><span className="text-gray-400">Commune</span><br/>{learner.commune ? learner.commune + (learner.postal_code ? " (" + learner.postal_code + ")" : "") : "-"}</div>
            <div><span className="text-gray-400">Financement</span><br/>{learner.funding_type === "dif" ? "DIF elu" : learner.funding_type === "cohort" ? "Cohorte" : "-"}</div>
            <div><span className="text-gray-400">Groupe</span><br/>{learner.group_name || "-"}</div>
            <div><span className="text-gray-400">Inscrit le</span><br/>{new Date(learner.created_at).toLocaleDateString("fr-FR")}</div>
            <div><span className="text-gray-400">Derniere connexion</span><br/>{learner.last_login_at ? new Date(learner.last_login_at).toLocaleDateString("fr-FR") : "-"}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{pct}%</p>
            <p className="text-sm text-gray-500">Completion</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{completed}/{total}</p>
            <p className="text-sm text-gray-500">Chapitres termines</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{totalTimeStr}</p>
            <p className="text-sm text-gray-500">Temps total</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{avgScore !== null ? avgScore + "%" : "-"}</p>
            <p className="text-sm text-gray-500">Score moyen</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-bold text-[#0f1f3d]">Detail par chapitre</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chapitre</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Temps</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Termine le</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dernier acces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chaptersWithProgress.map((ch: any) => {
                const isCompleted = ch.status === "completed" || ch.status === "passed";
                const isStarted = ch.status === "incomplete";
                return (
                  <tr key={ch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-[#0f1f3d]">
                      <span className="text-gray-400 mr-2">{ch.order}</span>{ch.title}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Termine</span>}
                      {isStarted && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">En cours</span>}
                      {!isCompleted && !isStarted && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Non commence</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{formatTime(ch.total_time)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{ch.score !== null ? ch.score + "%" : "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{ch.completed_at ? new Date(ch.completed_at).toLocaleDateString("fr-FR") : "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{ch.last_accessed_at ? new Date(ch.last_accessed_at).toLocaleDateString("fr-FR") : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
