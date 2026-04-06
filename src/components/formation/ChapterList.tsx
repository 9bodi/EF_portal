"use client";
import Link from "next/link";

interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  status?: string;
  total_time?: string;
}

function formatTime(pgInterval: string | null): string {
  if (!pgInterval) return "";
  const match = pgInterval.match(/(\d+):(\d+):(\d+)/);
  if (!match) return "";
  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (h > 0) return h + "h" + (m > 0 ? m + "min" : "");
  return m + "min";
}

export default function ChapterList({ chapters }: { chapters: Chapter[] }) {
  return (
    <div className="space-y-3">
      {chapters.sort((a, b) => a.order - b.order).map((ch) => {
        const isCompleted = ch.status === "completed" || ch.status === "passed";
        const isStarted = ch.status === "incomplete";
        return (
          <Link key={ch.id} href={"/formation/" + ch.id} className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border-l-4" style={{ borderLeftColor: isCompleted ? "#22c55e" : isStarted ? "#f59e0b" : "#e5e7eb" }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400">{ch.order}</span>
                  <h3 className="font-semibold text-[#0f1f3d]">{ch.title}</h3>
                </div>
                {ch.description && <p className="text-sm text-gray-500 mt-1 ml-8">{ch.description}</p>}
              </div>
              <div className="flex items-center gap-3 ml-4">
                {ch.total_time && <span className="text-xs text-gray-400">{formatTime(ch.total_time)}</span>}
                {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Termine</span>}
                {isStarted && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">En cours</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
