"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LearnerData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  commune: string | null;
  postal_code: string | null;
  funding_type: string | null;
  group_name: string | null;
  mandat: string | null;
  collectivite: string | null;
  numero_dossier_dife: string | null;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
}

interface ChapterData {
  order: number;
  title: string;
  status: string;
  total_time: string | null;
  score: number | null;
  completed_at: string | null;
  last_accessed_at: string | null;
}

interface LearnerPdfButtonsProps {
  learner: LearnerData;
  chapters: ChapterData[];
  pct: number;
  completed: number;
  total: number;
  totalTimeStr: string;
  avgScore: number | null;
  timePct: number;
  amount: number;
}

function formatTime(t: string | null): string {
  if (!t) return "-";
  const m = t.match(/(\d+):(\d+):(\d+)/);
  if (!m) return t;
  const h = parseInt(m[1]);
  const min = parseInt(m[2]);
  return h > 0 ? `${h}h${String(min).padStart(2, "0")}` : `${min} min`;
}

function formatDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR");
}

function statusLabel(status: string): string {
  switch (status) {
    case "completed": return "Terminé";
    case "passed": return "Réussi";
    case "incomplete": return "En cours";
    default: return "Non commencé";
  }
}

function formatMandat(m: string | null): string {
  if (!m) return "-";
  const labels: Record<string, string> = {
    maire: "Maire",
    adjoint: "Adjoint au maire",
    conseiller_municipal: "Conseiller municipal",
    conseiller_departemental: "Conseiller départemental",
    conseiller_regional: "Conseiller régional",
    president_epci: "Président d'EPCI",
    vice_president_epci: "Vice-président d'EPCI",
    conseiller_communautaire: "Conseiller communautaire",
    autre: "Autre",
  };
  return labels[m] || m;
}

function formatFunding(f: string | null): string {
  if (!f) return "-";
  if (f === "dif") return "DIFE";
  if (f === "collectivite" || f === "cohort") return "Collectivité territoriale";
  return f;
}

export default function LearnerPdfButtons({
  learner,
  chapters,
  pct,
  completed,
  total,
  totalTimeStr,
  avgScore,
  timePct,
  amount,
}: LearnerPdfButtonsProps) {
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        setLogoBase64(canvas.toDataURL("image/png"));
      }
    };
    img.src = "/img/LOGO_ELU-FORMATION_BLANC100.png";
  }, []);

  const exportFicheApprenant = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Header
    doc.setFillColor(55, 59, 148);
    doc.rect(0, 0, pageWidth, 40, "F");
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 14, 8, 80, 17);
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Fiche apprenant", pageWidth - 14, 22, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Générée le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth - 14, 32, { align: "right" });

    y = 50;
    doc.setTextColor(30, 30, 30);

    // Informations apprenant
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Informations apprenant", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const info: [string, string][] = [
      ["Nom", `${learner.first_name} ${learner.last_name}`],
      ["Email", learner.email],
      ["Téléphone", learner.phone || "-"],
      ["Commune", `${learner.commune || "-"} ${learner.postal_code ? `(${learner.postal_code})` : ""}`],
      ["Mandat", formatMandat(learner.mandat)],
      ["Collectivité", learner.collectivite || "-"],
      ["Financement", formatFunding(learner.funding_type)],
      ["N° dossier DIFE", learner.numero_dossier_dife || "-"],
      ["Groupe", learner.group_name || "-"],
      ["Inscription", formatDate(learner.created_at)],
      ["Début formation", learner.start_date || "-"],
      ["Fin formation", learner.end_date || "En cours"],
    ];

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label} :`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, y);
      y += 6;
    });

    y += 6;

    // Statistiques
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Statistiques", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const stats: [string, string][] = [
      ["Complétion", `${pct}%`],
      ["Chapitres terminés", `${completed} / ${total}`],
      ["Temps total", totalTimeStr],
      ["% temps (sur 3h)", `${timePct}%`],
      ["Montant facturable", `${amount.toFixed(2)} €`],
      ["Score moyen", avgScore !== null ? `${avgScore}%` : "-"],
    ];

    stats.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label} :`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, y);
      y += 6;
    });

    y += 6;

    // Barre de progression
    const barX = 14;
    const barW = pageWidth - 28;
    const barH = 8;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(barX, y, barW, barH, 2, 2, "F");
    if (pct > 0) {
      doc.setFillColor(55, 59, 148);
      doc.roundedRect(barX, y, (barW * pct) / 100, barH, 2, 2, "F");
    }
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    if (pct > 10) {
      doc.text(`${pct}%`, barX + (barW * pct) / 100 / 2, y + 5.5, { align: "center" });
    }
    doc.setTextColor(30, 30, 30);
    y += 16;

    // Tableau chapitres
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Détail des chapitres", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["#", "Chapitre", "Statut", "Temps", "Score", "Terminé le", "Dernier accès"]],
      body: chapters.map((ch) => [
        String(ch.order),
        ch.title,
        statusLabel(ch.status),
        formatTime(ch.total_time),
        ch.score != null ? `${ch.score}%` : "-",
        ch.completed_at ? formatDate(ch.completed_at) : "-",
        ch.last_accessed_at ? formatDate(ch.last_accessed_at) : "-",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [55, 59, 148], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 55 },
        2: { cellWidth: 22 },
        3: { cellWidth: 20 },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 24 },
        6: { cellWidth: 24 },
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Élu Formation — Fiche apprenant — Page ${i}/${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`fiche-${learner.first_name}-${learner.last_name}.pdf`);
  };

  const exportAttestation = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFillColor(55, 59, 148);
    doc.rect(0, 0, pageWidth, 45, "F");
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", pageWidth / 2 - 42, 10, 84, 18);
    }

    let y = 60;

    doc.setTextColor(55, 59, 148);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ATTESTATION DE FORMATION", pageWidth / 2, y, { align: "center" });
    y += 16;

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const lines = [
      "Je soussigné(e), Élu Formation, certifie que :",
      "",
      `${learner.first_name} ${learner.last_name}`,
      `Email : ${learner.email}`,
      learner.commune ? `Commune : ${learner.commune}${learner.postal_code ? ` (${learner.postal_code})` : ""}` : "",
      learner.mandat ? `Mandat : ${formatMandat(learner.mandat)}` : "",
      learner.collectivite ? `Collectivité : ${learner.collectivite}` : "",
      learner.numero_dossier_dife ? `N° dossier DIFE : ${learner.numero_dossier_dife}` : "",
      "",
      "a suivi la formation :",
      "",
    ].filter(Boolean);

    lines.forEach((line) => {
      doc.text(line, 30, y);
      y += 7;
    });

    // Titre formation
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(55, 59, 148);
    doc.text("« Bien gérer son image et communication d'élu local »", pageWidth / 2, y, { align: "center" });
    y += 14;

    // Détails
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);

    const details = [
      `Taux de complétion : ${pct}%`,
      `Chapitres terminés : ${completed} / ${total}`,
      `Temps total de formation : ${totalTimeStr}`,
      `Taux en temps (sur 3h) : ${timePct}%`,
      avgScore !== null ? `Score moyen obtenu : ${avgScore}%` : null,
      learner.start_date ? `Début de formation : ${learner.start_date}` : null,
      learner.end_date ? `Fin de formation : ${learner.end_date}` : null,
    ].filter(Boolean) as string[];

    details.forEach((line) => {
      doc.text(line, 30, y);
      y += 7;
    });

    y += 10;

    doc.setFont("helvetica", "normal");
    doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth - 30, y, { align: "right" });
    y += 8;
    doc.text("Pour Élu Formation,", pageWidth - 30, y, { align: "right" });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Élu Formation — contact@eluformation.fr — www.eluformation.fr",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    doc.save(`attestation-${learner.first_name}-${learner.last_name}.pdf`);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
      <button
        onClick={exportFicheApprenant}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "1px solid rgba(55,59,148,0.2)",
          background: "#f0f1ff",
          color: "#373b94",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Télécharger la fiche PDF
      </button>
      {pct === 100 && (
        <button
          onClick={exportAttestation}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid rgba(34,197,94,0.2)",
            background: "#f0fdf4",
            color: "#16a34a",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Télécharger l&apos;attestation
        </button>
      )}
    </div>
  );
}
