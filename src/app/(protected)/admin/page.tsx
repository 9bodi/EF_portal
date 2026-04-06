import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateLearnerForm from "@/components/admin/CreateLearnerForm";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/formation");

  const { data: learners } = await supabase
    .from("users")
    .select("*")
    .neq("role", "admin")
    .order("last_name");

  const { data: allProgress } = await supabase
    .from("scorm_progress")
    .select("*");

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title")
    .order("order");

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
      <header className="bg-[#0f1f3d] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Elu Formation — Admin</h1>
          <p className="text-sm text-gray-300">{profile.first_name} {profile.last_name}</p>
        </div>
        <div className="flex gap-4 items-center">
          <a href="/formation" className="text-sm text-gray-300 hover:text-white transition">Voir comme apprenant</a>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm text-gray-300 hover:text-white transition">Deconnexion</button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
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
            <p className="text-sm text-gray-500">Completion moyenne</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-[#0f1f3d]">{totalChapters}</p>
            <p className="text-sm text-gray-500">Chapitres</p>
          </div>
        </div>

        <CreateLearnerForm />

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-[#0f1f3d]">Apprenants</h2>
          </div>
          {totalLearners === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <p className="text-lg">Aucun apprenant inscrit</p>
              <p className="text-sm mt-2">Cliquez sur le bouton ci-dessus pour inscrire un apprenant</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Financement</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progression</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Temps</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dernier acces</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {learnersWithStats.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-[#0f1f3d]">
                      <a href={"/admin/learner/" + l.id} className="hover:underline">
                        {l.last_name} {l.first_name}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{l.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{l.funding_type || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-[#0f1f3d] h-2 rounded-full" style={{ width: l.pct + "%" }} />
                        </div>
                        <span className="text-xs text-gray-500">{l.completed}/{l.totalChapters}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{l.timeStr}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{l.scoreStr}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">
                      {l.lastAccess ? new Date(l.lastAccess).toLocaleDateString("fr-FR") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
