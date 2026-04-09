export interface ChapterWithProgress {
  id: string;
  title: string;
  order: number;
  scorm_package_path: string;
  estimated_duration?: number;
  progress: {
    status: string;
    total_time?: string;
    score?: number | null;
    completed_at?: string | null;
    last_accessed_at?: string | null;
  } | null;
}
