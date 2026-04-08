"use client";
import { useState, useRef } from "react";

interface ImportResult {
  line: number;
  email: string;
  success: boolean;
  tempPassword?: string;
  error?: string;
}

export default function ImportLearnersForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ created: number; failed: number; details: ImportResult[] } | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults(null);
    if (!fileRef.current?.files?.[0]) { setError("Selectionnez un fichier"); setLoading(false); return; }

    const formData = new FormData();
    formData.append("file", fileRef.current.files[0]);

    const res = await fetch("/api/admin/import-learners", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);

    if (data.error) { setError(data.error); return; }
    setResults(data);
  };

  const downloadTemplate = () => {
    const header = "prenom,nom,email,code_postal,financement,telephone,commune,groupe";
    const example = "Jean,Dupont,jean.dupont@mairie.fr,33000,dif,0612345678,Bordeaux,Groupe A";
    const blob = new Blob([header + "\n" + example + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_apprenants.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!results) return;
    const lines = ["email,mot_de_passe,statut,erreur"];
    results.details.forEach((r) => {
      lines.push(`${r.email},${r.tempPassword || ""},${r.success ? "cree" : "erreur"},${r.error || ""}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_resultats.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-[#4a4fbf] text-white rounded-lg text-sm font-semibold hover:bg-[#373b94] transition">
        Importer CSV
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#373b94]">Import CSV</h3>
        <button onClick={() => { setOpen(false); setResults(null); setError(""); setFileName(""); }} className="text-gray-400 hover:text-gray-600 text-sm">Fermer</button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600">
        <p className="font-medium mb-1">Format attendu (CSV, separateur virgule ou point-virgule) :</p>
        <code className="text-xs bg-gray-200 px-2 py-1 rounded block mt-1">prenom,nom,email,code_postal,financement,telephone,commune,groupe</code>
        <p className="mt-2 text-xs text-gray-400">Colonnes obligatoires : prenom, nom, email, code_postal, financement (dif ou cohort). Les autres sont optionnelles.</p>
        <button onClick={downloadTemplate} className="mt-3 text-sm text-[#373b94] font-medium underline hover:no-underline">
          Telecharger le template CSV
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {results && (
        <div className="mb-4">
          <div className="flex gap-4 mb-3">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <span className="text-green-700 font-bold text-lg">{results.created}</span>
              <span className="text-green-600 text-sm ml-1">crees</span>
            </div>
            {results.failed > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <span className="text-red-700 font-bold text-lg">{results.failed}</span>
                <span className="text-red-600 text-sm ml-1">erreurs</span>
              </div>
            )}
          </div>
          <button onClick={downloadResults} className="text-sm text-[#373b94] underline hover:no-underline">
            Telecharger les resultats (mots de passe inclus)
          </button>
          <div className="mt-3 max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead><tr><th className="text-left py-1 px-2">Email</th><th className="text-left py-1 px-2">MDP</th><th className="text-left py-1 px-2">Statut</th></tr></thead>
              <tbody>
                {results.details.map((r, i) => (
                  <tr key={i} className={r.success ? "" : "bg-red-50"}>
                    <td className="py-1 px-2">{r.email}</td>
                    <td className="py-1 px-2 font-mono">{r.tempPassword || "-"}</td>
                    <td className="py-1 px-2">{r.success ? <span className="text-green-600">OK</span> : <span className="text-red-600">{r.error}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-4">
        <input type="file" ref={fileRef} accept=".csv,.txt" required className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
        <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition">
          {fileName || "Choisir un fichier CSV"}
        </button>
        <button type="submit" disabled={loading || !fileName} className="px-6 py-2 bg-[#373b94] text-white rounded-lg text-sm font-semibold hover:bg-[#4a4fbf] transition disabled:opacity-50">
          {loading ? "Import en cours..." : "Importer"}
        </button>
      </form>
    </div>
  );
}

