"use client";

import { useState } from "react";

interface Props {
  firstName: string;
  lastName: string;
  completed: number;
  total: number;
  totalTimeStr: string;
  avgScore: number | null;
}

async function loadLogoBase64(): Promise<string> {
  const res = await fetch("/img/LOGO_ELU-FORMATION_RVB.png");
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export default function LearnerCertificates({ firstName, lastName, completed, total, totalTimeStr, avgScore }: Props) {
  const [loadingSuccess, setLoadingSuccess] = useState(false);
  const [loadingCompletion, setLoadingCompletion] = useState(false);

  const fullName = `${firstName} ${lastName}`;
  const allCompleted = completed === total && total > 0;
  const canSuccess = avgScore !== null && avgScore >= 60 && allCompleted;
  const canCompletion = allCompleted;

  if (!canSuccess && !canCompletion) return null;

  async function handleCertificateSuccess() {
    setLoadingSuccess(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const logo = await loadLogoBase64();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const w = 297;

      doc.setDrawColor(55, 59, 148);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, w - 20, 190);
      doc.setLineWidth(0.5);
      doc.rect(13, 13, w - 26, 184);

      doc.addImage(logo, "PNG", (w - 70) / 2, 20, 70, 18);

      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text("CERTIFICAT DE RÉUSSITE", w / 2, 62, { align: "center" });

      doc.setDrawColor(55, 59, 148);
      doc.setLineWidth(0.8);
      doc.line(w / 2 - 40, 67, w / 2 + 40, 67);

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text("Nous certifions que", w / 2, 82, { align: "center" });

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text(fullName, w / 2, 94, { align: "center" });

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text("a validé avec succès la formation", w / 2, 108, { align: "center" });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text("Élu Formation — Communication politique et publique", w / 2, 120, { align: "center" });

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`avec une moyenne générale de ${avgScore}%`, w / 2, 134, { align: "center" });
      doc.text(`Modules complétés : ${completed}/${total}  —  Temps total : ${totalTimeStr}`, w / 2, 143, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.text(`Délivré le ${new Date().toLocaleDateString("fr-FR")}`, w / 2, 160, { align: "center" });

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(w / 2 - 30, 178, w / 2 + 30, 178);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Élu Formation", w / 2, 183, { align: "center" });

      doc.save(`certificat-reussite-${firstName}-${lastName}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du certificat");
    }
    setLoadingSuccess(false);
  }

  async function handleCertificateCompletion() {
    setLoadingCompletion(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const logo = await loadLogoBase64();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const w = 297;

      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, w - 20, 190);
      doc.setLineWidth(0.5);
      doc.rect(13, 13, w - 26, 184);

      doc.addImage(logo, "PNG", (w - 70) / 2, 20, 70, 18);

      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("CERTIFICAT DE COMPLÉTION", w / 2, 62, { align: "center" });

      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.8);
      doc.line(w / 2 - 40, 67, w / 2 + 40, 67);

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text("Nous certifions que", w / 2, 82, { align: "center" });

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text(fullName, w / 2, 94, { align: "center" });

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text("a suivi l'intégralité de la formation", w / 2, 108, { align: "center" });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text("Élu Formation — Communication politique et publique", w / 2, 120, { align: "center" });

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`${total} modules complétés  —  Temps total : ${totalTimeStr}`, w / 2, 138, { align: "center" });
      if (avgScore !== null) {
        doc.text(`Score moyen : ${avgScore}%`, w / 2, 147, { align: "center" });
      }

      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.text(`Délivré le ${new Date().toLocaleDateString("fr-FR")}`, w / 2, 164, { align: "center" });

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(w / 2 - 30, 178, w / 2 + 30, 178);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Élu Formation", w / 2, 183, { align: "center" });

      doc.save(`certificat-completion-${firstName}-${lastName}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du certificat");
    }
    setLoadingCompletion(false);
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #373b94 0%, #2a2d72 100%)",
      borderRadius: 16,
      padding: "28px 32px",
      marginBottom: 28,
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          Félicitations ! 🎉
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
          Vos certificats sont disponibles au téléchargement.
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {canSuccess && (
          <button
            onClick={handleCertificateSuccess}
            disabled={loadingSuccess}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: "#fff",
              color: "#373b94",
              opacity: loadingSuccess ? 0.6 : 1,
              transition: "transform .2s, box-shadow .2s",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            {loadingSuccess ? "Génération..." : "🏆 Certificat de réussite"}
          </button>
        )}
        {canCompletion && (
          <button
            onClick={handleCertificateCompletion}
            disabled={loadingCompletion}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              border: "2px solid rgba(255,255,255,0.3)",
              background: "transparent",
              color: "#fff",
              opacity: loadingCompletion ? 0.6 : 1,
              transition: "transform .2s, box-shadow .2s",
            }}
          >
            {loadingCompletion ? "Génération..." : "✅ Certificat de complétion"}
          </button>
        )}
      </div>
    </div>
  );
}
