import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ learnerId: string }>;
}

export default async function LearnerDetailPage({ params }: PageProps) {
  const { learnerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/formation");

  const { data: learner } = await supabase.from("users").select("*").eq("id", learnerId).single();
  if (!learner) redirect("/admin");

  const { data: chapters } = await supabase.from("chapters").select("*").order("order");
  const { data: progress } = await supabase.from("scorm_progress").select("*").eq("user_id", learnerId);

  const chaptersWithProgress = (chapters || []).map((ch: any) => {
    const p = (progress || []).find((pr: any) => pr.chapter_id === ch.id);
    const timeStr = (() => {
      if (!p?.total_time) return "-";
      const match = p.total_time.match(/(\d+):(\d+):(\d+)/);
      if (!match) return "-";
      const h = parseInt(match[1]);
      const m = parseInt(match[2]);
      if (h > 0) return h + "h" + String(m).padStart(2, "0");
      return m + "min";
    })();
    return {
      ...ch,
      status: p?.status || "not_started",
      score: p?.score ?? null,
      timeStr,
      lastAccess: p?.last_accessed_at || null,
      completedAt: p?.completed_at || null,
    };
  });

  const completed = chaptersWithProgress.filter((c: any) => c.status === "completed" || c.status === "passed").length;
  const totalChapters = chaptersWithProgress.length;
  const pct = totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0;

  const totalSeconds = (progress || []).reduce((acc: number, p: any) => {
    if (!p.total_time) return acc;
    const match = p.total_time.match(/(\d+):(\d+):(\d+)/);
    if (!match) return acc;
    return acc + parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
  }, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const totalTimeStr = hours > 0 ? hours + "h" + String(minutes).padStart(2, "0") : minutes + "min";

  const scores = (progress || []).filter((p: any) => p.score !== null && p.score !== undefined);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a: number, p: any) => a + p.score, 0) / scores.length)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0f1f3d] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/admin" className="text-sm text-gray-300 hover:text-white">← Retour</a>
          <h1 className="text-xl font-bold">Elu Formation — Admin</h1>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button className="text-sm text-gray-300 hover:text-white transition">Deconnexion</button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-2xl font-bold text-[#0f1f3d]">{learner.first_name} {learner.last_name}</h2>
          <p className="text-gray-500">{learner.email}</p>
          <div className="flex gap-6 mt-4 text-sm text-gray-500">
            <span>Financement : {learner.funding_type || "-"}</span>
            <span>Cohorte : {learner.cohort_name || "-"}</span>
            <span>Inscrit le : {new Date(learner.created_at).toLocaleDateString("fr-FR")}</span>
            <span>Derniere connexion : {learner.last_login_at ? new Date(learner.last_login_at).toLocaleDateString("fr-FR") : "-"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{pct}%</p>
            <p className="text-sm text-gray-500">Completion</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{completed}/{totalChapters}</p>
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Temps</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Termine le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chaptersWithProgress.map((ch: any) => {
                const isCompleted = ch.status === "completed" || ch.status === "passed";
                const isStarted = ch.status === "incomplete";
                return (
                  <tr key={ch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <span className="text-gray-400 mr-2">{ch.order}</span>
                      <span className="font-medium text-[#0f1f3d]">{ch.title}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Termine</span>}
                      {isStarted && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">En cours</span>}
                      {!isCompleted && !isStarted && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Non commence</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{ch.score !== null ? ch.score + "%" : "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{ch.timeStr}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{ch.completedAt ? new Date(ch.completedAt).toLocaleDateString("fr-FR") : "-"}</td>
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
