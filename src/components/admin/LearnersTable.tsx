"use client";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Learner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  commune?: string;
  postal_code?: string;
  funding_type?: string;
  group_name?: string;
  created_at: string;
  last_login_at?: string | null;
  access_expires_at?: string | null;
  must_change_password?: boolean;
  completed: number;
  totalChapters: number;
  pct: number;
  timeStr: string;
  scoreStr: string;
  lastAccess: string | null;
}

type Tab = "en_cours" | "non_demarre" | "termine";

export default function LearnersTable({ learners }: { learners: Learner[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("en_cours");
  const [filters, setFilters] = useState({
    search: "",
    postalCode: "",
    groupName: "",
    fundingType: "",
    dateFrom: "",
    dateTo: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [logoWhite, setLogoWhite] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setLogoWhite(canvas.toDataURL("image/png"));
      }
    };
    img.src = "/img/LOGO_ELU-FORMATION_BLANC100.png";
  }, []);

  const now = Date.now();

  const segmented = {
    non_demarre: learners.filter((l) => !l.lastAccess && l.must_change_password !== false),
    en_cours: learners.filter((l) => {
      if (!l.lastAccess && l.must_change_password !== false) return false;
      if (l.pct >= 100) {
        const expires = l.access_expires_at ? new Date(l.access_expires_at).getTime() : null;
        if (expires && now > expires) return false;
      }
      if (l.pct >= 100) return false;
      return true;
    }),
    termine: learners.filter((l) => {
      if (l.pct >= 100) return true;
      const expires = l.access_expires_at ? new Date(l.access_expires_at).getTime() : null;
      if (expires && now > expires && l.lastAccess) return true;
      return false;
    }),
  };

  const currentList = segmented[activeTab];

  const filtered = currentList.filter((l) => {
    const search = filters.search.toLowerCase();
    if (search && !l.first_name.toLowerCase().includes(search) &&
        !l.last_name.toLowerCase().includes(search) &&
        !l.email.toLowerCase().includes(search)) return false;
    if (filters.postalCode && !(l.postal_code || "").startsWith(filters.postalCode)) return false;
    if (filters.groupName && (l.group_name || "").toLowerCase() !== filters.groupName.toLowerCase()) return false;
    if (filters.fundingType && l.funding_type !== filters.fundingType) return false;
    if (filters.dateFrom && l.created_at < filters.dateFrom) return false;
    if (filters.dateTo && l.created_at > filters.dateTo + "T23:59:59") return false;
    return true;
  });

  const groups = [...new Set(learners.map((l) => l.group_name).filter(Boolean))] as string[];

  const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString("fr-FR") : "-";

  const daysLeft = (expiresAt: string | null | undefined): string => {
    if (!expiresAt) return "-";
    const diff = Math.ceil((new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Expiré";
    return diff + "j";
  };

  const handleDelete = async (learnerId: string) => {
    setDeletingId(learnerId);
    try {
      const res = await fetch("/api/admin/delete-learner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert("Erreur : " + (data.error || "Échec de la suppression"));
      }
    } catch {
      alert("Erreur réseau");
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const handleResendWelcome = async (learnerId: string) => {
    setResendingId(learnerId);
    try {
      const res = await fetch("/api/admin/resend-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Email de bienvenue renvoyé !");
      } else {
        alert("Erreur : " + (data.error || "Échec de l'envoi"));
      }
    } catch {
      alert("Erreur réseau");
    }
    setResendingId(null);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(55, 59, 148);
    doc.rect(0, 0, pageW, 32, "F");

    if (logoWhite) {
      doc.addImage(logoWhite, "PNG", 14, 5, 92, 20);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ELU FORMATION", 14, 20);
    }

    doc.setTextColor(200, 210, 230);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Rapport de suivi des apprenants", 110, 14);

    const nowStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    doc.text("Généré le " + nowStr, pageW - 14, 14, { align: "right" });
    doc.text(filtered.length + " apprenant(s)", pageW - 14, 22, { align: "right" });

    const tabLabels: Record<Tab, string> = {
      en_cours: "Formation en cours",
      non_demarre: "Formation non démarrée",
      termine: "Formation terminée",
    };
    doc.text("Onglet : " + tabLabels[activeTab], 110, 22);

    let startY = 40;

    const tableData = filtered.map((l) => [
      l.last_name + " " + l.first_name,
      l.email,
      l.postal_code || "-",
      l.funding_type === "dif" ? "DIF" : l.funding_type === "cohort" ? "Cohorte" : "-",
      l.group_name || "-",
      fmtDate(l.created_at),
      fmtDate(l.last_login_at),
      l.completed + "/" + l.totalChapters + " (" + l.pct + "%)",
      l.timeStr,
      l.scoreStr,
      daysLeft(l.access_expires_at),
    ]);

    autoTable(doc, {
      startY,
      head: [["Nom", "Email", "CP", "Fin.", "Groupe", "Inscription", "1ère connexion", "Progression", "Temps", "Score", "Accès"]],
      body: tableData,
      styles: { fontSize: 7, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.2 },
      headStyles: { fillColor: [55, 59, 148], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 38 },
        5: { halign: "center" },
        6: { halign: "center" },
        7: { halign: "center" },
        8: { halign: "center" },
        9: { halign: "center" },
        10: { halign: "center" },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data: any) => {
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "Élu Formation — Rapport confidentiel — Page " + data.pageNumber,
          pageW / 2,
          pageH - 8,
          { align: "center" }
        );
      },
    });

    doc.save("eluformation_suivi_" + new Date().toISOString().slice(0, 10) + ".pdf");
  };

  const exportCSV = () => {
    const headers = ["Nom", "Prénom", "Email", "CP", "Commune", "Financement", "Groupe", "Inscription", "1ère connexion", "Progression", "Temps", "Score", "Fin accès", "Dernier accès"];
    const rows = filtered.map((l) => [
      l.last_name,
      l.first_name,
      l.email,
      l.postal_code || "",
      l.commune || "",
      l.funding_type === "dif" ? "DIF" : l.funding_type === "cohort" ? "Cohorte" : "",
      l.group_name || "",
      fmtDate(l.created_at),
      fmtDate(l.last_login_at),
      l.completed + "/" + l.totalChapters + " (" + l.pct + "%)",
      l.timeStr,
      l.scoreStr,
      fmtDate(l.access_expires_at),
      fmtDate(l.lastAccess),
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eluformation_suivi_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "en_cours", label: "En cours", count: segmented.en_cours.length },
    { key: "non_demarre", label: "Non démarrée", count: segmented.non_demarre.length },
    { key: "termine", label: "Terminée", count: segmented.termine.length },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* ONGLETS */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-6 py-3 text-sm font-medium transition-colors relative"
            style={{
              color: activeTab === tab.key ? "#373b94" : "#6b7280",
              borderBottom: activeTab === tab.key ? "2px solid #373b94" : "2px solid transparent",
              background: activeTab === tab.key ? "#f0f1ff" : "transparent",
            }}
          >
            {tab.label}
            <span
              style={{
                marginLeft: 8,
                background: activeTab === tab.key ? "#373b94" : "#e5e7eb",
                color: activeTab === tab.key ? "#fff" : "#6b7280",
                padding: "2px 8px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* HEADER ACTIONS */}
      <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-[#373b94]">Apprenants ({filtered.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-50 transition">
            {showFilters ? "Masquer filtres" : "Filtres"}
          </button>
          <button onClick={exportPDF} className="px-3 py-1.5 text-sm bg-[#373b94] text-white rounded-lg font-medium hover:bg-[#4a4fbf] transition">
            Export PDF
          </button>
          <button onClick={exportCSV} className="px-3 py-1.5 text-sm border border-[#373b94] text-[#373b94] rounded-lg font-medium hover:bg-gray-50 transition">
            Export CSV
          </button>
        </div>
      </div>

      {/* FILTRES */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input type="text" placeholder="Nom, prénom, email..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
          <input type="text" placeholder="Code postal" value={filters.postalCode} onChange={(e) => setFilters({...filters, postalCode: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" />
          <select value={filters.groupName} onChange={(e) => setFilters({...filters, groupName: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]">
            <option value="">Tous les groupes</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filters.fundingType} onChange={(e) => setFilters({...filters, fundingType: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]">
            <option value="">Tout financement</option>
            <option value="dif">DIF</option>
            <option value="cohort">Cohorte</option>
          </select>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" title="Inscrit depuis" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#373b94]" title="Inscrit jusqu'au" />
          <button onClick={() => setFilters({ search: "", postalCode: "", groupName: "", fundingType: "", dateFrom: "", dateTo: "" })} className="px-3 py-2 text-sm text-red-500 hover:text-red-700 transition">
            Réinitialiser
          </button>
        </div>
      )}

      {/* MODALE CONFIRMATION SUPPRESSION */}
      {confirmDeleteId && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 9999,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 32,
            maxWidth: 420, width: "90%", textAlign: "center",
          }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>
              Supprimer cet apprenant ?
            </p>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
              Cette action est irréversible. Toutes les données (profil, progression, compte) seront supprimées.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "1px solid #e5e7eb",
                  background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: "#ef4444", color: "#fff", fontWeight: 600, fontSize: 14,
                  cursor: "pointer", opacity: deletingId === confirmDeleteId ? 0.6 : 1,
                }}
              >
                {deletingId === confirmDeleteId ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400">
          <p className="text-lg">Aucun apprenant trouvé</p>
          {learners.length > 0 && <p className="text-sm mt-2">Essayez de modifier vos filtres</p>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Inscription</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">1ère connexion</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Factu. prévi.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fin accès</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progression</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Temps</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => {
                const createdMs = new Date(l.created_at).getTime();
                const factuDate = new Date(createdMs + 15 * 24 * 60 * 60 * 1000);
                const expiresStr = daysLeft(l.access_expires_at);
                const isExpired = expiresStr === "Expiré";

                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-[#373b94]">
                      <a href={"/admin/learner/" + l.id} className="hover:underline">
                        {l.last_name} {l.first_name}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{l.email}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{l.postal_code || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{l.funding_type === "dif" ? "DIF" : l.funding_type === "cohort" ? "Cohorte" : "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{fmtDate(l.created_at)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{fmtDate(l.last_login_at)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{factuDate.toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-4 text-sm text-center">
                      <span style={{
                        color: isExpired ? "#ef4444" : "#22c55e",
                        fontWeight: 600,
                        fontSize: 12,
                      }}>
                        {fmtDate(l.access_expires_at)}
                        {!isExpired && <span style={{ color: "#9ca3af", fontWeight: 400 }}> ({expiresStr})</span>}
                        {isExpired && <span style={{ marginLeft: 4, color: "#ef4444" }}>Expiré</span>}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-[#373b94] h-2 rounded-full" style={{ width: l.pct + "%" }} />
                        </div>
                        <span className="text-xs text-gray-500">{l.completed}/{l.totalChapters}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{l.timeStr}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{l.scoreStr}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {activeTab === "non_demarre" && (
                          <button
                            onClick={() => handleResendWelcome(l.id)}
                            disabled={resendingId === l.id}
                            title="Renvoyer le mail de bienvenue"
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                            style={{ opacity: resendingId === l.id ? 0.5 : 1 }}
                          >
                            {resendingId === l.id ? "..." : "📧 Renvoyer"}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDeleteId(l.id)}
                          title="Supprimer l'apprenant"
                          className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100 transition"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
