"use client";
import { useState } from "react";

export default function UnlockButton({ learnerId, chapterId }: { learnerId: string; chapterId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleUnlock = async () => {
    if (!confirm("Valider ce chapitre pour cet apprenant ?")) return;
    setLoading(true);
    const res = await fetch("/api/admin/unlock-chapter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId, chapterId }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setDone(true);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  if (done) return <span className="text-xs text-green-600 font-medium">Valide</span>;

  return (
    <button
      onClick={handleUnlock}
      disabled={loading}
      className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded font-medium hover:bg-amber-200 transition disabled:opacity-50"
    >
      {loading ? "..." : "Debloquer"}
    </button>
  );
}
