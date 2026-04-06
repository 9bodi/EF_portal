import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChapterList from "@/components/formation/ChapterList";

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
    return { ...ch, status: p?.status || "not_started", total_time: p?.total_time || null };
  });

  const completed = chaptersWithProgress.filter((c: any) => c.status === "completed" || c.status === "passed").length;
  const total = chaptersWithProgress.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const next = chaptersWithProgress.find((c: any) => c.status !== "completed" && c.status !== "passed");

  await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0f1f3d] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Elu Formation</h1>
          <p className="text-sm text-gray-300">Bonjour {profile.first_name || profile.email}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button className="text-sm text-gray-300 hover:text-white transition">Deconnexion</button>
        </form>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#0f1f3d]">Votre progression</h2>
            <span className="text-sm text-gray-500">{completed}/{total} chapitres</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-[#0f1f3d] h-3 rounded-full transition-all" style={{ width: pct + "%" }} />
          </div>
          <p className="text-sm text-gray-500 mt-2">{pct}% complete</p>
          {next && (
            <a href={"/formation/" + next.id} className="inline-block mt-4 px-6 py-3 bg-[#0f1f3d] text-white rounded-lg font-semibold hover:bg-[#1a3a6b] transition">
              {completed > 0 ? "Continuer la formation" : "Commencer la formation"}
            </a>
          )}
        </div>
        <ChapterList chapters={chaptersWithProgress} />
      </main>
      <footer className="text-center text-gray-400 text-sm py-6">Support : contact@eluformation.fr</footer>
    </div>
  );
}
