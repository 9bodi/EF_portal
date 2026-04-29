"use client";
import { useState } from "react";

export default function ReactivateButton({ learnerId }: { learnerId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReactivate = async () => {
    if (!confirm("Réactiver l'accès pour 30 jours ?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reactivate-learner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert("Erreur : " + (data.error || "Échec"));
      }
    } catch {
      alert("Erreur réseau");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleReactivate}
      disabled={loading || done}
      style={{
        padding: "10px 20px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        border: "2px solid #f59e0b",
        background: done ? "#fef3c7" : "#fff",
        color: "#92400e",
        cursor: loading || done ? "default" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {done ? "Accès réactivé !" : loading ? "Réactivation..." : "Réactiver l'accès (30j)"}

    </button>
  );
}
