"use client";
import { useState } from "react";

export default function CreateLearnerForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "", phone: "",
    fundingType: "", commune: "", postalCode: "", groupName: "",
    mandat: "", collectivite: "", numeroDossierDife: "",
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
      setForm({ email: "", firstName: "", lastName: "", phone: "", fundingType: "", commune: "", postalCode: "", groupName: "", mandat: "", collectivite: "", numeroDossierDife: "" });
    } else {
      setError(data.error || "Erreur inconnue");
    }
  };

  if (!open) {
    return (
      <div className="mb-6">
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-[#373b94] text-white rounded-lg text-sm font-semibold hover:bg-[#4a4fbf] transition">
          + Inscrire un apprenant
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#373b94]">Inscrire un apprenant</h3>
        <button onClick={() => { setOpen(false); setResult(null); setError(""); }} className="text-gray-400 hover:text-gray-600 text-sm">Fermer</button>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 font-semibold">Apprenant créé avec succès</p>
          <p className="text-sm text-green-700 mt-1">{result.firstName} {result.lastName} — {result.email}</p>
          <p className="text-sm text-green-700 mt-1">Mot de passe temporaire : <span className="font-mono bg-green-100 px-2 py-1 rounded">{result.tempPassword}</span></p>
          <p className="text-xs text-green-600 mt-2">Communiquez ces identifiants à l'apprenant. Il devra changer son mot de passe à la première connexion.</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Prénom *" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} required className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
        <input type="text" placeholder="Nom *" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} required className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
        <input type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
        <select value={form.fundingType} onChange={(e) => setForm({...form, fundingType: e.target.value})} required className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]">
          <option value="">Financement *</option>
          <option value="dif">DIFE (Droit Individuel à la Formation des Élus)</option>
          <option value="collectivite">Collectivité territoriale</option>
        </select>
        <input type="tel" placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
        <input type="text" placeholder="Code postal" value={form.postalCode} onChange={(e) => setForm({...form, postalCode: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
        <input type="text" placeholder="Commune" value={form.commune} onChange={(e) => setForm({...form, commune: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
        <select value={form.mandat} onChange={(e) => setForm({...form, mandat: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]">
          <option value="">Type de mandat</option>
          <option value="maire">Maire</option>
          <option value="adjoint">Adjoint au maire</option>
          <option value="conseiller_municipal">Conseiller municipal</option>
          <option value="conseiller_departemental">Conseiller départemental</option>
          <option value="conseiller_regional">Conseiller régional</option>
          <option value="president_epci">Président d'EPCI</option>
          <option value="vice_president_epci">Vice-président d'EPCI</option>
          <option value="conseiller_communautaire">Conseiller communautaire</option>
          <option value="autre">Autre</option>
        </select>
        <input type="text" placeholder="Collectivité de rattachement" value={form.collectivite} onChange={(e) => setForm({...form, collectivite: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
        <input type="text" placeholder="N° dossier Mon Compte Élu" value={form.numeroDossierDife} onChange={(e) => setForm({...form, numeroDossierDife: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
        <input type="text" placeholder="Nom du groupe" value={form.groupName} onChange={(e) => setForm({...form, groupName: e.target.value})} className="px-4 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
        <div className="md:col-span-2">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-[#373b94] text-white rounded-lg text-sm font-semibold hover:bg-[#4a4fbf] transition disabled:opacity-50">
            {loading ? "Création..." : "Créer le compte"}
          </button>
        </div>
      </form>
    </div>
  );
}
