"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ───
interface LearnerData {
  id: string;
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
  id: string;
  order: number;
  title: string;
  status: string;
  total_time: string | null;
  score: number | null;
  completed_at: string | null;
  last_accessed_at: string | null;
}

interface SessionLog {
  chapter_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

interface LearnerPdfButtonsProps {
  learner: LearnerData;
  chapters: ChapterData[];
  sessionLogs: SessionLog[];
  pct: number;
  completed: number;
  total: number;
  totalTimeStr: string;
  avgScore: number | null;
  timePct: number;
  amount: number;
}

// ─── Constants ───
const FORMATION_TITLE = "Bien gérer son image et sa communication d'élu(e) local(e)";
const FORMATION_DURATION = "3 heures";
const ORGANISME = "Place de la République SAS — Élu Formation";
const OBJECTIFS_PEDAGOGIQUES = [
  "Saisir les spécificités de la communication politique des élus locaux",
  "Construire une stratégie de communication performante",
  "Maîtriser votre image publique et votre e-réputation",
  "Mobiliser les bons outils et les techniques adaptées",
  "Prendre la parole pour défendre vos projets avec assurance",
  "Rédiger des messages et discours impactants",
  "Communiquer efficacement sur les réseaux sociaux",
  "Gérer les relations presse et les interviews",
  "Communiquer en situation de crise",
  "Répondre aux attaques de manière constructive",
  "Adapter sa communication à des situations particulières (élections, intercommunalité, projets sensibles)",
];

// ─── Helpers ───
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

function formatHeure(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDurationSecs(secs: number): string {
  if (!secs || secs <= 0) return "-";
  const h = Math.floor(secs / 3600);
  const m = Math.ceil((secs % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m} min`;
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

// ─── Component ───
export default function LearnerPdfButtons({
  learner,
  chapters,
  sessionLogs,
  pct,
  completed,
  total,
  totalTimeStr,
  avgScore,
  timePct,
  amount,
}: LearnerPdfButtonsProps) {
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [attestLoading, setAttestLoading] = useState(false);

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

  /* ═══════════════════════════════════════════
     PDF: Fiche apprenant
     ═══════════════════════════════════════════ */
  const exportFicheApprenant = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    doc.setFillColor(55, 59, 148);
    doc.rect(0, 0, pageWidth, 40, "F");
    if (logoBase64) doc.addImage(logoBase64, "PNG", 14, 8, 80, 17);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Fiche apprenant", pageWidth - 14, 22, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Générée le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth - 14, 32, { align: "right" });

    y = 50;
    doc.setTextColor(30, 30, 30);

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
    if (pct > 10) doc.text(`${pct}%`, barX + (barW * pct) / 100 / 2, y + 5.5, { align: "center" });
    doc.setTextColor(30, 30, 30);
    y += 16;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Détail des chapitres", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["#", "Chapitre", "Statut", "Temps", "Score", "Terminé le", "Dernier accès"]],
      body: chapters.map((ch) => [
        String(ch.order), ch.title, statusLabel(ch.status), formatTime(ch.total_time),
        ch.score != null ? `${ch.score}%` : "-",
        ch.completed_at ? formatDate(ch.completed_at) : "-",
        ch.last_accessed_at ? formatDate(ch.last_accessed_at) : "-",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [55, 59, 148], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 55 }, 2: { cellWidth: 22 },
        3: { cellWidth: 20 }, 4: { cellWidth: 18, halign: "center" }, 5: { cellWidth: 24 }, 6: { cellWidth: 24 },
      },
    });

    const pageCount = (doc as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      (doc as any).setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Élu Formation — Fiche apprenant — Page ${i}/${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    }
    doc.save(`fiche-${learner.first_name}-${learner.last_name}.pdf`);
  };

  /* ═══════════════════════════════════════════
     PDF: Attestation de formation (conforme DIFE)
     ═══════════════════════════════════════════ */
  const exportAttestation = async () => {
    setAttestLoading(true);
    try {
      // Fetch or create attestation number from API
      const res = await fetch("/api/admin/attestation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: learner.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Erreur attestation : ${data.error}`);
        return;
      }
      const attestNum: string = data.attestation_number;
      const attestDate: string = data.generated_at;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFillColor(55, 59, 148);
      doc.rect(0, 0, pageWidth, 45, "F");
      if (logoBase64) doc.addImage(logoBase64, "PNG", pageWidth / 2 - 42, 10, 84, 18);

      let y = 58;

      // N° attestation
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.text(`N° ${attestNum}`, pageWidth - 14, y, { align: "right" });
      doc.text(`Émise le ${formatDate(attestDate)}`, pageWidth - 14, y + 4, { align: "right" });
      y += 12;

      // Title
      doc.setTextColor(55, 59, 148);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ATTESTATION DE FIN DE FORMATION", pageWidth / 2, y, { align: "center" });
      y += 12;

      // Organisme
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Délivrée par ${ORGANISME}`, pageWidth / 2, y, { align: "center" });
      y += 12;

      // Separator
      doc.setDrawColor(55, 59, 148);
      doc.setLineWidth(0.5);
      doc.line(30, y, pageWidth - 30, y);
      y += 10;

      // Beneficiary
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Certifie que :", 30, y);
      y += 8;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text(`${learner.first_name} ${learner.last_name}`, 30, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);

      const beneficiary: string[] = [
        learner.mandat ? `Mandat : ${formatMandat(learner.mandat)}` : "",
        learner.collectivite ? `Collectivité : ${learner.collectivite}` : "",
        `Email : ${learner.email}`,
        learner.commune ? `Commune : ${learner.commune}${learner.postal_code ? ` (${learner.postal_code})` : ""}` : "",
        learner.numero_dossier_dife ? `N° dossier DIFE : ${learner.numero_dossier_dife}` : "",
      ].filter(Boolean);
      beneficiary.forEach((line) => {
        doc.text(line, 30, y);
        y += 6;
      });
      y += 6;

      // Formation
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text("a suivi et achevé la formation intitulée :", 30, y);
      y += 10;

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      const titleLines = doc.splitTextToSize(`« ${FORMATION_TITLE} »`, pageWidth - 60);
      doc.text(titleLines, pageWidth / 2, y, { align: "center" });
      y += titleLines.length * 7 + 8;

      // Details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);

      const details: [string, string][] = [
        ["Modalité", "100 % en ligne (e-learning)"],
        ["Durée totale prévue", FORMATION_DURATION],
        ["Durée réalisée", totalTimeStr],
        ["Taux de complétion", `${pct}% (${completed}/${total} modules)`],
        ["Taux en temps", `${timePct}%`],
        ["Score moyen", avgScore !== null ? `${avgScore}%` : "-"],
        ["Période de formation", `du ${learner.start_date || "-"} au ${learner.end_date || "-"}`],
        ["Financement", formatFunding(learner.funding_type)],
      ];
      details.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label} :`, 30, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 90, y);
        y += 6;
      });
      y += 8;

      // Objectifs pédagogiques
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text("Objectifs pédagogiques atteints :", 30, y);
      y += 7;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);

      OBJECTIFS_PEDAGOGIQUES.forEach((obj, idx) => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${idx + 1}. ${obj}`, 34, y);
        y += 5.5;
      });
      y += 8;

      // Check space
      if (y > pageHeight - 55) {
        doc.addPage();
        y = 20;
      }

      // Separator
      doc.setDrawColor(55, 59, 148);
      doc.setLineWidth(0.3);
      doc.line(30, y, pageWidth - 30, y);
      y += 10;

      // Signature
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`Fait le ${formatDate(attestDate)}`, pageWidth - 30, y, { align: "right" });
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.text("Pour Élu Formation,", pageWidth - 30, y, { align: "right" });
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.text(ORGANISME, pageWidth - 30, y, { align: "right" });

      // Legal
      y += 15;
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text(
        "Cette attestation est délivrée en application des dispositions de l'article L.1221-3 du Code général des collectivités territoriales",
        30, y, { maxWidth: pageWidth - 60 }
      );
      y += 4;
      doc.text(
        "relatif au droit individuel à la formation des élus locaux (DIFE). Elle certifie l'assiduité et l'achèvement de la formation.",
        30, y, { maxWidth: pageWidth - 60 }
      );

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Élu Formation — contact@eluformation.fr — www.eluformation.fr",
        pageWidth / 2, pageHeight - 10, { align: "center" }
      );

      doc.save(`attestation-${learner.first_name}-${learner.last_name}.pdf`);
    } catch (err: any) {
      console.error("Attestation error:", err);
      alert("Erreur lors de la génération de l'attestation");
    } finally {
      setAttestLoading(false);
    }
  };

  /* ═══════════════════════════════════════════
     PDF: Émargement
     ═══════════════════════════════════════════ */
  const exportEmargement = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    doc.setFillColor(55, 59, 148);
    doc.rect(0, 0, pageWidth, 40, "F");
    if (logoBase64) doc.addImage(logoBase64, "PNG", 14, 8, 80, 17);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Feuille d'émargement", pageWidth - 14, 22, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Générée le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth - 14, 32, { align: "right" });

    y = 50;
    doc.setTextColor(30, 30, 30);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const infos: [string, string][] = [
      ["Apprenant", `${learner.first_name} ${learner.last_name}`],
      ["Email", learner.email],
      ["Mandat", formatMandat(learner.mandat)],
      ["Collectivité", learner.collectivite || "-"],
      ["Formation", FORMATION_TITLE],
      ["Durée déclarée", FORMATION_DURATION],
    ];
    infos.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label} :`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, y);
      y += 6;
    });
    y += 6;

    const chaptersOrdered = [...chapters].sort((a, b) => a.order - b.order);
    let totalSessionsSecs = 0;
    let totalSessions = 0;

    for (const ch of chaptersOrdered) {
      const chSessions = sessionLogs
        .filter((s) => s.chapter_id === ch.id)
        .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

      if (chSessions.length === 0 && ch.status === "not_started") continue;

      if (y > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text(`Module ${ch.order} — ${ch.title}`, 14, y);
      y += 2;

      if (chSessions.length > 0) {
        const chTotalSecs = chSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
        totalSessionsSecs += chTotalSecs;
        totalSessions += chSessions.length;

        autoTable(doc, {
          startY: y,
          head: [["Date", "Heure début", "Heure fin", "Durée"]],
          body: chSessions.map((s) => [
            formatDate(s.started_at),
            formatHeure(s.started_at),
            s.ended_at ? formatHeure(s.ended_at) : "En cours",
            formatDurationSecs(s.duration_seconds),
          ]),
          foot: [[
            { content: "Total module", colSpan: 3, styles: { fontStyle: "bold" as const, halign: "right" as const } },
            { content: formatDurationSecs(chTotalSecs), styles: { fontStyle: "bold" as const } },
          ]],
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: [100, 105, 180], textColor: [255, 255, 255], fontStyle: "bold" },
          footStyles: { fillColor: [240, 241, 255], textColor: [55, 59, 148] },
          alternateRowStyles: { fillColor: [250, 250, 255] },
          margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        const legacyInfo = ch.total_time ? `Temps enregistré : ${formatTime(ch.total_time)}` : "Aucune session enregistrée";
        doc.text(legacyInfo + (ch.last_accessed_at ? ` — Dernier accès : ${formatDate(ch.last_accessed_at)}` : ""), 14, y + 4);
        y += 12;
      }
    }

    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(55, 59, 148);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 59, 148);
    doc.text("Récapitulatif", 14, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);

    const recap: [string, string][] = [
      ["Nombre de sessions", String(totalSessions)],
      ["Temps total (sessions)", formatDurationSecs(totalSessionsSecs)],
      ["Temps total (plateforme)", totalTimeStr],
      ["% temps (sur 3h)", `${timePct}%`],
      ["Période", `${learner.start_date || "-"} au ${learner.end_date || "en cours"}`],
    ];
    recap.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label} :`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 80, y);
      y += 6;
    });

    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Ce document tient lieu de feuille d'émargement conformément à l'article D.6353-4 du Code du travail.",
      14, y, { maxWidth: pageWidth - 28 }
    );
    y += 6;
    doc.text(
      "Il atteste de la connexion effective de l'apprenant à la plateforme de formation en ligne.",
      14, y, { maxWidth: pageWidth - 28 }
    );

    const pageCount = (doc as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      (doc as any).setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Élu Formation — Émargement — Page ${i}/${pageCount}`,
        pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" }
      );
    }

    doc.save(`emargement-${learner.first_name}-${learner.last_name}.pdf`);
  };

  /* ─── Render ─── */
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
      <button
        onClick={exportFicheApprenant}
        style={{
          padding: "10px 20px", borderRadius: 8,
          border: "1px solid rgba(55,59,148,0.2)", background: "#f0f1ff",
          color: "#373b94", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}
      >
        Télécharger la fiche PDF
      </button>
      <button
        onClick={exportEmargement}
        style={{
          padding: "10px 20px", borderRadius: 8,
          border: "1px solid rgba(245,158,11,0.2)", background: "#fffbeb",
          color: "#b45309", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}
      >
        Télécharger l&apos;émargement
      </button>
      {pct === 100 && (
        <button
          onClick={exportAttestation}
          disabled={attestLoading}
          style={{
            padding: "10px 20px", borderRadius: 8,
            border: "1px solid rgba(34,197,94,0.2)", background: attestLoading ? "#e5e7eb" : "#f0fdf4",
            color: attestLoading ? "#9ca3af" : "#16a34a", fontSize: 13, fontWeight: 600,
            cursor: attestLoading ? "wait" : "pointer",
          }}
        >
          {attestLoading ? "Génération en cours..." : "Télécharger l'attestation"}
        </button>
      )}
    </div>
  );
}
