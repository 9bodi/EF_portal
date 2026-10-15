// src/lib/certificates/pdf.ts
import jsPDF from "jspdf";

export type Row = {
  prenom: string; nom: string;
  collectivite: string; departement: string; intitule: string;
  dateFormation: string; dureeHeures: number; email?: string;
};

const fmtH = (h: number) =>
  `${Number.isInteger(h) ? h : h.toString().replace(".", ",")} heure${h > 1 ? "s" : ""}`;

/** Décalage vertical des valeurs, en mm. Monter = diminuer. */
const DY = 2;
/** Décalage horizontal des valeurs posées après un libellé, en mm. */
const DX = 2;

export function drawCertificate(doc: jsPDF, r: Row, dateEdition: string, bg: string) {
  doc.addImage(bg, "PNG", 0, 0, 210, 297);
  doc.setTextColor(31, 41, 55);

  doc.setFont("helvetica", "bold").setFontSize(13);
  doc.text(`${r.prenom} ${r.nom.toUpperCase()}`, 105, 95 + DY, { align: "center" });

  doc.setFont("helvetica", "normal").setFontSize(12);
  doc.text(`élu(e) de la collectivité de ${r.collectivite} (${r.departement})`,
    105, 103 + DY, { align: "center" });

  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(`a suivi l'action « ${r.intitule} »`, 170),
    105, 112 + DY, { align: "center" });

  doc.text(`${r.dateFormation},`, 71 + DX, 131 + DY);
  doc.text(fmtH(r.dureeHeures), 58 + DX, 137 + DY);
  doc.text(fmtH(r.dureeHeures), 93 + DX, 155 + DY);
  doc.text(dateEdition, 21 + DX, 204 + DY);
}

/** Grille temporaire de calage : drawGrid(doc) juste après drawCertificate */
export function drawGrid(doc: jsPDF) {
  doc.setDrawColor(255, 0, 0).setTextColor(255, 0, 0).setFontSize(5);
  for (let y = 10; y <= 290; y += 5) {
    doc.line(0, y, 210, y);
    doc.text(String(y), 1, y - 0.5);
  }
  for (let x = 10; x <= 200; x += 10) {
    doc.line(x, 0, x, 297);
    doc.text(String(x), x + 0.5, 6);
  }
  doc.setTextColor(31, 41, 55);
}

export function buildSinglePdf(rows: Row[], dateEdition: string, bg: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  rows.forEach((r, i) => {
    if (i > 0) doc.addPage();
    drawCertificate(doc, r, dateEdition, bg);
  });
  return doc;
}

export const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_");

export const fileName = (r: Row) =>
  `Certificat_EF_${slug(r.prenom)}_${slug(r.nom.toUpperCase())}_${r.dateFormation.replace(/\//g, "-")}.pdf`;

export const toIso = (d: string) => {
  const [j, m, a] = d.split("/");
  return `${a}-${m}-${j}`;
};
