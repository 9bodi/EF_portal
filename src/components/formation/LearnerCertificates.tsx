"use client";

import { useState } from "react";

interface Props {
  firstName: string;
  lastName: string;
  mandat: string | null;
  collectivite: string | null;
  completed: number;
  total: number;
  totalTimeStr: string;
  avgScore: number | null;
  startDate: string | null;
  endDate: string | null;
}

const FORMATION_TITLE = "Bien gérer son image et sa communication d'élu(e) local(e)";
const ORGANISME = "Place de la République SAS — Élu Formation";

function formatMandat(m: string | null): string {
  if (!m) return "";
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

async function loadLogoBase64(): Promise<string> {
  const res = await fetch("/img/LOGO_ELU-FORMATION_RVB.png");
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export default function LearnerCertificates({
  firstName,
  lastName,
  mandat,
  collectivite,
  completed,
  total,
  totalTimeStr,
  avgScore,
  startDate,
  endDate,
}: Props) {
  const [loading, setLoading] = useState(false);

  const fullName = `${firstName} ${lastName}`;
  const allCompleted = completed === total && total > 0;
console.log("LearnerCertificates debug:", { completed, total, allCompleted });

  if (!allCompleted) return null;

  async function handleDownload() {
    setLoading(true);
    try {
      // Get or create attestation number
      const res = await fetch("/api/learner/attestation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Erreur : ${data.error}`);
        return;
      }

      const attestNum: string = data.attestation_number;
      const attestDate: string = data.generated_at;

      const jsPDF = (await import("jspdf")).default;
      const logo = await loadLogoBase64();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const w = 297;
      const h = 210;

      // Border
      doc.setDrawColor(55, 59, 148);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, w - 20, h - 20);
      doc.setLineWidth(0.5);
      doc.rect(13, 13, w - 26, h - 26);

      // Logo
      doc.addImage(logo, "PNG", (w - 80) / 2, 20, 80, 17.5);

      // Title
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text("ATTESTATION DE FIN DE FORMATION", w / 2, 58, { align: "center" });

      // Attestation number
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(140, 140, 140);
      doc.text(`N° ${attestNum}`, w / 2, 65, { align: "center" });

      // Separator
      doc.setDrawColor(55, 59, 148);
      doc.setLineWidth(0.8);
      doc.line(w / 2 - 40, 69, w / 2 + 40, 69);

      // "Certifie que"
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text("Nous certifions que", w / 2, 80, { align: "center" });

      // Name
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text(fullName, w / 2, 92, { align: "center" });

      // Mandat + collectivité
      let yInfo = 100;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const mandatLine = [
        mandat ? formatMandat(mandat) : "",
        collectivite || "",
      ].filter(Boolean).join(" — ");
      if (mandatLine) {
        doc.text(mandatLine, w / 2, yInfo, { align: "center" });
        yInfo += 8;
      }

      // "a suivi et achevé"
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text("a suivi et achevé la formation", w / 2, yInfo, { align: "center" });
      yInfo += 10;

      // Formation title
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text(`« ${FORMATION_TITLE} »`, w / 2, yInfo, { align: "center" });
      yInfo += 8;

      // Modalité
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text("Modalité : 100 % en ligne (e-learning)", w / 2, yInfo, { align: "center" });
      yInfo += 10;

      // Details line
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const detailParts = [
        `Modules : ${completed}/${total}`,
        `Durée : ${totalTimeStr}`,
        avgScore !== null ? `Score moyen : ${avgScore}%` : null,
      ].filter(Boolean).join("   •   ");
      doc.text(detailParts, w / 2, yInfo, { align: "center" });
      yInfo += 7;

      // Period
      if (startDate || endDate) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Période : du ${startDate || "-"} au ${endDate || "-"}`, w / 2, yInfo, { align: "center" });
      }

      // Delivered date + signature
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Délivrée le ${new Date(attestDate).toLocaleDateString("fr-FR")}`,
        w / 2, 165, { align: "center" }
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 59, 148);
      doc.text("Pour Élu Formation,", w / 2, 173, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(ORGANISME, w / 2, 179, { align: "center" });

      // Legal mention
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        "Attestation délivrée en application de l'article L.1221-3 du CGCT relatif au DIFE des élus locaux.",
        w / 2, 189, { align: "center" }
      );

      doc.save(`attestation-${firstName}-${lastName}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération de l'attestation");
    }
    setLoading(false);
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
          Félicitations !
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
          Vous avez terminé la formation. Votre attestation est disponible.
        </p>
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          padding: "12px 24px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          cursor: loading ? "wait" : "pointer",
          border: "none",
          background: "#fff",
          color: "#373b94",
          opacity: loading ? 0.6 : 1,
          transition: "transform .2s, box-shadow .2s",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}
      >
        {loading ? "Génération en cours..." : "Télécharger mon attestation"}
      </button>
    </div>
  );
}
