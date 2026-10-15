// src/lib/certificates/parse.ts
import type { Row } from "./pdf";

const DEPTS = /^(0[1-9]|[1-8]\d|9[0-5]|2A|2B|97[1-6])$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLS = ["prenom","nom","collectivite","departement",
              "intitule","date_formation","duree_heures"] as const;

export function parseDate(v: string): Date | null {
  const s = v.trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  if (/^\d{5}$/.test(s)) { // numéro de série Excel
    const u = new Date(Date.UTC(1899, 11, 30 + +s));
    return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
  }
  return null;
}

export const fmtDate = (d: Date) =>
  `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;

function today() {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function validateRow(raw: Record<string, string>) {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const c of COLS) if (!raw[c]?.trim()) errors.push(`${c} est obligatoire`);



  if (raw.departement && !DEPTS.test(raw.departement.trim()))
    errors.push(`Département invalide : « ${raw.departement} »`);

  const d = raw.date_formation ? parseDate(raw.date_formation) : null;
  if (raw.date_formation && !d)
    errors.push(`Date illisible : « ${raw.date_formation} ». Formatez la colonne en Texte (jj/mm/aaaa)`);
  if (d && d > today())
    errors.push(`La date de formation est dans le futur : ${fmtDate(d)}`);
  if (d && d < new Date(today().getFullYear() - 5, 0, 1))
    warnings.push(`Date ancienne : ${fmtDate(d)}. Vérifiez l'année`);

  const h = parseFloat((raw.duree_heures || "").replace(",", "."));
  if (raw.duree_heures && (isNaN(h) || h <= 0))
    errors.push(`Durée invalide : « ${raw.duree_heures} »`);

  if (raw.email?.trim() && !EMAIL.test(raw.email.trim()))
    errors.push(`Adresse email invalide : « ${raw.email} »`);
  if (!raw.email?.trim())
    warnings.push("Pas d'email : le certificat ne sera pas envoyé");

  if (raw.intitule && raw.intitule.length > 120)
    warnings.push("Intitulé long : risque de débordement sur le bloc suivant");

  return { errors, warnings, date: d, heures: h };
}

export function groupBySession(rows: Row[]) {
  const map = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.intitule}|${r.dateFormation}|${r.dureeHeures}`;
    (map.get(k) ?? map.set(k, []).get(k)!).push(r);
  }
  return [...map.values()];
}
