import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
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
            <p className="text-sm text-gray-500">Completion moyenne</p>
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
