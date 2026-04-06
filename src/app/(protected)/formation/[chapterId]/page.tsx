import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ScormPlayer from "@/components/formation/ScormPlayer";

interface PageProps {
  params: Promise<{ chapterId: string }>;
}

export default async function ChapterPage({ params }: PageProps) {
  const { chapterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: chapter } = await supabase
    .from("chapters").select("*").eq("id", chapterId).single();
  if (!chapter) redirect("/formation");

  const { data: progress } = await supabase
    .from("scorm_progress").select("*")
    .eq("user_id", user.id).eq("chapter_id", chapterId).single();

  const scormEntryUrl = chapter.scorm_package_path + "/scormdriver/indexAPI.html";

  return (
    <ScormPlayer
      chapterId={chapterId}
      scormEntryUrl={scormEntryUrl}
      savedCmiData={progress?.cmi_data || null}
      chapterTitle={chapter.title}
    />
  );
}
