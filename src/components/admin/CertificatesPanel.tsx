"use client";
import { useMemo, useRef, useState } from "react";
import { readCsv } from "@/lib/csv";
import { validateRow, fmtDate } from "@/lib/certificates/parse";
import { buildSinglePdf, drawCertificate, fileName, type Row } from "@/lib/certificates/pdf";
import jsPDF from "jspdf";
import { getBackgroundClient } from "@/lib/certificates/background";

const COLS = ["prenom","nom","collectivite","departement","intitule","date_formation","duree_heures"];
const CADENCE_MS = 143; // 7 req/s
const QUOTA_JOUR = 100;

type Line = Row & { id: string; errors: string[]; warnings: string[]; status: string };

export default function CertificatesPanel({ sentToday, recent }: { sentToday: number; recent: any[] }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [fileErr, setFileErr] = useState("");
  const [dateEdition, setDateEdition] = useState(fmtDate(new Date()));
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const revalidate = (ls: Line[]) =>
    ls.map((l) => {
            const v = validateRow({
        prenom: l.prenom, nom: l.nom, collectivite: l.collectivite,
        departement: l.departement, intitule: l.intitule,
        date_formation: l.dateFormation, duree_heures: String(l.dureeHeures), email: l.email ?? "",
      });

      return { ...l, errors: v.errors, warnings: v.warnings };
    });

  const handleFile = async (f: File) => {
    setFileErr(""); setLines([]); setLog("");
    try {
      const raw = readCsv(await f.text());
      const missing = COLS.filter((c) => !(c in raw[0]));
      if (missing.length) {
        setFileErr(`Colonnes obligatoires manquantes : ${missing.join(", ")}. Colonnes trouvées : ${Object.keys(raw[0]).join(", ")}`);
        return;
      }
            setLines(revalidate(raw.map((r, i) => ({
        id: String(i),
        prenom: r.prenom, nom: r.nom,
        collectivite: r.collectivite, departement: r.departement, intitule: r.intitule,
        dateFormation: r.date_formation,
        dureeHeures: parseFloat((r.duree_heures || "").replace(",", ".")),
        email: r.email, errors: [], warnings: [], status: "—",
      }))));

    } catch (e: any) { setFileErr(e.message); }
  };

  const edit = (id: string, field: keyof Row, value: string) =>
    setLines((ls) => revalidate(ls.map((l) =>
      l.id === id ? { ...l, [field]: field === "dureeHeures" ? parseFloat(value.replace(",", ".")) : value } : l
    )));

  const nbErr = lines.filter((l) => l.errors.length).length;
  const ok = lines.length > 0 && nbErr === 0;

  const sessions = useMemo(() => {
    const m = new Map<string, Line[]>();
    lines.forEach((l) => {
      const k = `${l.intitule}|${l.dateFormation}|${l.dureeHeures}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(l);
    });
    return [...m.entries()];
  }, [lines]);

  const recipients = useMemo(() => {
    const m = new Map<string, Line[]>();
    lines.filter((l) => l.email?.trim()).forEach((l) => {
      const k = l.email!.trim().toLowerCase();
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(l);
    });
    return m;
  }, [lines]);

   const downloadAll = async () => {
    try {
      const bg = await getBackgroundClient();
      buildSinglePdf(lines, dateEdition, bg)
        .save(`Certificats_EF_${dateEdition.replace(/\//g, "-")}.pdf`);
    } catch (e: any) { setFileErr(e.message); }
  };

    const downloadOne = async (l: Line) => {
    try {
      const bg = await getBackgroundClient();
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      drawCertificate(doc, l, dateEdition, bg);
      doc.save(fileName(l));
    } catch (e: any) { setFileErr(e.message); }
  };


  const sendAll = async () => {
    const restant = QUOTA_JOUR - sentToday;
    if (recipients.size > restant &&
        !confirm(`${recipients.size} envois pour ${restant} restants aujourd'hui. Continuer ?`)) return;

    setBusy(true); setLog("Préparation...");
    const prep = await fetch("/api/admin/certificates/prepare", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: lines, dateEdition }),
    });
    const { batchId, error } = await prep.json();
    if (error) { setFileErr(error); setBusy(false); return; }

    let last = 0, n = 0;
    for (const [email, group] of recipients) {
      const wait = CADENCE_MS - (Date.now() - last);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      last = Date.now();

      const res = await fetch("/api/admin/certificates/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: group, dateEdition, batchId }),
      });
      const body = await res.json().catch(() => ({}));
      const st = res.ok ? "envoyé" : body.code === "QUOTA_EXCEEDED" ? "quota" : "échec";
      setLines((ls) => ls.map((l) => group.some((g) => g.id === l.id) ? { ...l, status: st } : l));
      n++;
      setLog(`${n}/${recipients.size} destinataires traités`);
      if (body.code === "QUOTA_EXCEEDED") { setLog("Quota journalier atteint. Reprenez demain."); break; }
    }
    setBusy(false);
  };

  const template = () => {
    const csv = COLS.join(";") + ";email\n"
      + "Anna;MANCINI;Champforgeuil;71;Prise de parole en public;08/11/2025;7;a.mancini@champforgeuil.fr\n";
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "template_certificats.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600">
        <code className="text-xs bg-gray-200 px-2 py-1 rounded block">{COLS.join(";")};email</code>
        <p className="mt-2 text-xs text-gray-500">
          Toutes obligatoires sauf <strong>email</strong>. Dates au format jj/mm/aaaa, colonne en Texte dans Excel.
          Taux fixé à 100 %.
        </p>
        <button onClick={template} className="mt-3 text-sm text-[#373b94] font-medium underline">
          Télécharger le modèle CSV
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input type="file" ref={fileRef} accept=".csv,.txt" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
          Choisir un fichier CSV
        </button>
        <label className="text-sm text-gray-600">Fait à Vernon, le</label>
        <input type="text" value={dateEdition} onChange={(e) => setDateEdition(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm text-gray-800 w-32" />
        <span className="text-xs text-gray-400 ml-auto">{sentToday}/{QUOTA_JOUR} mails envoyés aujourd'hui</span>
      </div>

      {fileErr && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">{fileErr}</div>}

      {lines.length > 0 && (
        <>
          <div className="mb-4 text-sm">
            {sessions.map(([k, g]) => {
              const [intitule, date, duree] = k.split("|");
              return (
                <div key={k} className="flex gap-2 items-center py-1">
                  <span className="font-medium text-[#373b94]">{intitule}</span>
                  <span className="text-gray-500">— {date} — {duree} h —</span>
                  <span className={g.length === 1 ? "text-orange-600 font-medium" : "text-gray-500"}>
                    {g.length} participant{g.length > 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>

          <p className={`text-sm mb-3 font-medium ${nbErr ? "text-red-600" : "text-green-700"}`}>
            {lines.length - nbErr} ligne(s) valide(s){nbErr > 0 && `, ${nbErr} à corriger`}
            {" — "}{recipients.size} destinataire(s)
          </p>

          <div className="overflow-x-auto max-h-96 mb-4">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>{["Prénom","Nom","Collectivité","Dép.","Intitulé","Date","H","Email","Statut",""].map((h) =>
                  <th key={h} className="text-left py-2 px-2 font-medium text-gray-500">{h}</th>)}</tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className={l.errors.length ? "bg-red-50" : l.warnings.length ? "bg-orange-50" : ""}>
                    {(["prenom","nom","collectivite","departement","intitule","dateFormation","dureeHeures","email"] as const).map((f) => (
                      <td key={f} className="px-1 py-1">
                        <input value={String(l[f] ?? "")} onChange={(e) => edit(l.id, f, e.target.value)}
                          className="w-full px-1 py-1 border rounded text-xs text-gray-800 bg-white" />
                      </td>
                    ))}
                    <td className="px-2 py-1 whitespace-nowrap">{l.status}</td>
                    <td className="px-2 py-1">
                      <button onClick={() => downloadOne(l)} disabled={!!l.errors.length}
                        className="text-[#373b94] underline disabled:text-gray-300">PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lines.filter((l) => l.errors.length || l.warnings.length).map((l) => (
              <p key={l.id} className="text-xs mt-1">
                <span className="font-medium">{l.prenom} {l.nom} :</span>{" "}
                <span className="text-red-600">{l.errors.join(" · ")}</span>{" "}
                <span className="text-orange-600">{l.warnings.join(" · ")}</span>
              </p>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <button onClick={downloadAll} disabled={!ok}
              className="px-5 py-2 border border-[#373b94] text-[#373b94] rounded-lg text-sm font-semibold disabled:opacity-40">
              Télécharger tout ({lines.length} pages)
            </button>
            <button onClick={sendAll} disabled={!ok || busy || recipients.size === 0}
              className="px-5 py-2 bg-[#373b94] text-white rounded-lg text-sm font-semibold disabled:opacity-40">
              {busy ? "Envoi..." : `Envoyer par email (${recipients.size})`}
            </button>
            <span className="text-sm text-gray-500">{log}</span>
          </div>
        </>
      )}
    </div>
  );
}
