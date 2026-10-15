import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import CertificatesPanel from "@/components/admin/CertificatesPanel";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function FormationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("users").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/formation");

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count: sentToday } = await admin
    .from("certificate_sends")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", since.toISOString());

  const { data: recent } = await admin
    .from("certificate_sends")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader firstName={profile.first_name} lastName={profile.last_name} />
      <AdminTabs />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#373b94] mb-1">Formations présentielles</h1>
        <p className="text-sm text-gray-500 mb-6">Génération et envoi des certificats de réalisation</p>
        <CertificatesPanel sentToday={sentToday ?? 0} recent={recent ?? []} />
      </main>
    </div>
  );
}
