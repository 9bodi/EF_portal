"use client";

import { useState } from "react";

interface ChapterData {
  order: number;
  title: string;
  status: string;
  total_time: string | null;
  score: number | null;
  completed_at: string | null;
  last_accessed_at: string | null;
}

interface LearnerData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  commune?: string;
  postal_code?: string;
  funding_type?: string;
  group_name?: string;
  created_at: string;
}

interface Props {
  learner: LearnerData;
  chapters: ChapterData[];
  pct: number;
  completed: number;
  total: number;
  totalTimeStr: string;
  avgScore: number | null;
}

function formatTime(t: string | null): string {
  if (!t) return "-";
  const match = t.match(/(\d+):(\d+):(\d+)/);
  if (!match) return "-";
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 0) return h + "h" + String(m).padStart(2, "0");
  return m + "min";
}

function statusLabel(s: string): string {
  if (s === "completed" || s === "passed") return "Terminé";
  if (s === "incomplete") return "En cours";
  return "Non commencé";
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

export default function LearnerPdfButtons({
  learner,
  chapters,
  pct,
  completed,
  total,
  totalTimeStr,
  avgScore,
}: Props) {
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingSuccess, setLoadingSuccess] = useState(false);
  const [loadingCompletion, setLoadingCompletion] = useState(false);

  const fullName = `${learner.first_name} ${learner.last_name}`;
  const allCompleted = completed === total && total > 0;
  const canCertificateSuccess = avgScore !== null && avgScore >= 60 && allCompleted;
  const canCertificateCompletion = allCompleted;

  async function handleExportDetail() {
    setLoadingExport(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const logo = await loadLogoBase64();
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      doc.setFillColor(55, 59, 148);
      doc.rect(0, 0, 210, 36, "F");
      doc.addImage(logo, "PNG", 14, 10, 55, 14);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text("Fiche apprenant", 210 - 14, 22, { align: "right" });

      let y = 46;
      doc.setTextColor(55, 59, 148);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(fullName, 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);

      const infoLines = [
        `Email : ${learner.email}`,
        `Téléphone : ${learner.phone || "-"}`,
        `Commune : ${learner.commune || "-"}${
          learner.postal_code ? " (" + learner.postal_code + ")" : ""
        }`,
        `Financement : ${
          learner.funding_type === "dif"
            ? "DIF élu"
            : learner.funding_type === "cohort"
            ? "Cohorte"
            : "-"
        }`,
        `Groupe : ${learner.group_name || "-"}`,
        `Inscrit le : ${new Date(learner.created_at).toLocaleDateString("fr-FR")}`,
      ];

      infoLines.forEach((line) => {
        doc.text(line, 14, y);
        y += 5;
      });

      y += 6;
      doc.setFillColor(245, 243, 239);
      doc.roundedRect(14, y, 182, 18, 3, 3, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      const statsY = y + 11;
      doc.text(`Complétion : ${pct}%`, 22, statsY);
      doc.text(`Chapitres : ${completed}/${total}`, 72, statsY);
      doc.text(`Temps : ${totalTimeStr}`, 120, statsY);
      doc.text(`Score : ${avgScore !== null ? avgScore + "%" : "-"}`, 162, statsY);
      y += 26;

      doc.setTextColor(55, 59, 148);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Détail par chapitre", 14, y);
      y += 4;

      const tableData = chapters.map((ch) => [
        String(ch.order),
        ch.title,
        statusLabel(ch.status),
        formatTime(ch.total_time),
        ch.score !== null ? ch.score + "%" : "-",
        ch.completed_at ? new Date(ch.completed_at).toLocaleDateString("fr-FR") : "-",
        ch.last_accessed_at ? new Date(ch.last_accessed_at).toLocaleDateString("fr-FR") : "-",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["#", "Chapitre", "Statut", "Temps", "Score", "Terminé le", "Dernier accès"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [55, 59, 148], fontSize: 8, font: "helvetica" },
        bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center" },
          5: { halign: "center" },
          6: { halign: "center" },
        },
        margin: { left: 14, right: 14 },
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Élu Formation — Généré le ${new Date().toLocaleDateString("fr-FR")}`,
        105,
        pageHeight - 10,
        { align: "center" }
      );

      doc.save(`fiche-${learner.first_name}-${learner.last_name}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du PDF");
    }
    setLoadingExport(false);
  }

  async function handleCertificateSuccess() {
    setLoadingSuccess(true);
    try {
      const { jsPDF } = await import("jspdf");
      const logo = await loadLogoBase64();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const w = 297;
      const h = 210;

      doc.setDrawColor(55, 59, 148);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, w - 20, h - 20);
      doc.setLineWidth(0.5);
      doc.rect(13, 13, w - 26, h - 26);

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
      doc.text(
        "Élu Formation — Communication politique et publique",
        w / 2,
        120,
        { align: "center" }
      );

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`avec une moyenne générale de ${avgScore}%`, w / 2, 134, { align: "center" });
      doc.text(
        `Modules complétés : ${completed}/${total}  —  Temps total : ${totalTimeStr}`,
        w / 2,
        143,
        { align: "center" }
      );

      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.text(`Délivré le ${new Date().toLocaleDateString("fr-FR")}`, w / 2, 160, {
        align: "center",
      });

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(w / 2 - 30, 178, w / 2 + 30, 178);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Élu Formation", w / 2, 183, { align: "center" });

      doc.save(`certificat-reussite-${learner.first_name}-${learner.last_name}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du certificat");
    }
    setLoadingSuccess(false);
  }

  async function handleCertificateCompletion() {
    setLoadingCompletion(true);
    try {
      const { jsPDF } = await import("jspdf");
      const logo = await loadLogoBase64();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const w = 297;
      const h = 210;

      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, w - 20, h - 20);
      doc.setLineWidth(0.5);
      doc.rect(13, 13, w - 26, h - 26);

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
      doc.text(
        "Élu Formation — Communication politique et publique",
        w / 2,
        120,
        { align: "center" }
      );

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`${total} modules complétés  —  Temps total : ${totalTimeStr}`, w / 2, 138, {
        align: "center",
      });

      if (avgScore !== null) {
        doc.text(`Score moyen : ${avgScore}%`, w / 2, 147, { align: "center" });
      }

      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.text(`Délivré le ${new Date().toLocaleDateString("fr-FR")}`, w / 2, 164, {
        align: "center",
      });

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(w / 2 - 30, 178, w / 2 + 30, 178);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Élu Formation", w / 2, 183, { align: "center" });

      doc.save(`certificat-completion-${learner.first_name}-${learner.last_name}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du certificat");
    }
    setLoadingCompletion(false);
  }

  const btnBase: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "opacity .2s",
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
      <button
        onClick={handleExportDetail}
        disabled={loadingExport}
        style={{
          ...btnBase,
          background: "#373b94",
          color: "#fff",
          opacity: loadingExport ? 0.6 : 1,
        }}
      >
        {loadingExport ? "Génération..." : "📄 Exporter la fiche PDF"}
      </button>

      <button
        onClick={handleCertificateSuccess}
        disabled={!canCertificateSuccess || loadingSuccess}
        title={
          !canCertificateSuccess
            ? "Requiert tous les modules terminés avec une moyenne ≥ 60%"
            : ""
        }
        style={{
          ...btnBase,
          background: canCertificateSuccess ? "#373b94" : "#e5e7eb",
          color: canCertificateSuccess ? "#fff" : "#9ca3af",
          cursor: canCertificateSuccess ? "pointer" : "not-allowed",
          opacity: loadingSuccess ? 0.6 : 1,
        }}
      >
        {loadingSuccess ? "Génération..." : "🏆 Certificat de réussite"}
      </button>

      <button
        onClick={handleCertificateCompletion}
        disabled={!canCertificateCompletion || loadingCompletion}
        title={!canCertificateCompletion ? "Requiert tous les modules terminés" : ""}
        style={{
          ...btnBase,
          background: canCertificateCompletion ? "#22c55e" : "#e5e7eb",
          color: canCertificateCompletion ? "#fff" : "#9ca3af",
          cursor: canCertificateCompletion ? "pointer" : "not-allowed",
          opacity: loadingCompletion ? 0.6 : 1,
        }}
      >
        {loadingCompletion ? "Génération..." : "✅ Certificat de complétion"}
      </button>
    </div>
  );
}