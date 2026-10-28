import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import LeadsTable from "@/components/admin/LeadsTable";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getAdminClient();

  const { data: profile } = await admin.from("users").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/formation");

  const { data: leads } = await admin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader firstName={profile.first_name} lastName={profile.last_name} />
      <AdminTabs />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <LeadsTable leads={leads || []} />
      </main>
    </div>
  );
}
