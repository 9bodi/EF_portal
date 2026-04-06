"use client";
import { useState } from "react";

export default function CreateLearnerForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "", phone: "", fundingType: "", cohortName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/admin/create-learner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setResult(data.learner);
      setForm({ email: "", firstName: "", lastName: "", phone: "", fundingType: "", cohortName: "" });
    } else {
      setError(data.error || "Erreur inconnue");
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-[#0f1f3d] text-white rounded-lg text-sm font-semibold hover:bg-[#1a3a6b] transition">
        + Inscrire un apprenant
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#0f1f3d]">Inscrire un apprenant</h3>
        <button onClick={() => { setOpen(false); setResult(null); setError(""); }} className="text-gray-400 hover:text-gray-600 text-sm">Fermer</button>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 font-semibold">Apprenant cree avec succes</p>
          <p className="text-sm text-green-700 mt-1">{result.firstName} {result.lastName} — {result.email}</p>
          <p className="text-sm text-green-700 mt-1">Mot de passe temporaire : <span className="font-mono bg-green-100 px-2 py-1 rounded">{result.tempPassword}</span></p>
          <p className="text-xs text-green-600 mt-2">Communiquez ces identifiants a l apprenant. Il devra changer son mot de passe a la premiere connexion.</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Prenom *" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} required className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
        <input type="text" placeholder="Nom *" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} required className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
        <input type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
        <input type="tel" placeholder="Telephone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
        <select value={form.fundingType} onChange={(e) => setForm({...form, fundingType: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]">
          <option value="">Type de financement</option>
          <option value="DIF">DIF elu</option>
          <option value="collectivite">Collectivite</option>
          <option value="personnel">Personnel</option>
          <option value="autre">Autre</option>
        </select>
        <input type="text" placeholder="Nom de cohorte" value={form.cohortName} onChange={(e) => setForm({...form, cohortName: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
        <div className="md:col-span-2">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-[#0f1f3d] text-white rounded-lg text-sm font-semibold hover:bg-[#1a3a6b] transition disabled:opacity-50">
            {loading ? "Creation..." : "Creer le compte"}
          </button>
        </div>
      </form>
    </div>
  );
}
