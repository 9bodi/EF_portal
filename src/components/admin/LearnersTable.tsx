"use client";
import { useState } from "react";
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
  completed: number;
  totalChapters: number;
  pct: number;
  timeStr: string;
  scoreStr: string;
  lastAccess: string | null;
}

export default function LearnersTable({ learners }: { learners: Learner[] }) {
  const [filters, setFilters] = useState({
    search: "",
    postalCode: "",
    groupName: "",
    fundingType: "",
    dateFrom: "",
    dateTo: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const filtered = learners.filter((l) => {
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

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR") : "-";

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFillColor(15, 31, 61);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Elu Formation", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Rapport de suivi des apprenants", 14, 23);
    const now = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    doc.text("Genere le " + now, doc.internal.pageSize.getWidth() - 14, 15, { align: "right" });
    doc.text(filtered.length + " apprenant(s)", doc.internal.pageSize.getWidth() - 14, 23, { align: "right" });

    const activeFilters: string[] = [];
    if (filters.search) activeFilters.push("Recherche : " + filters.search);
    if (filters.postalCode) activeFilters.push("CP : " + filters.postalCode);
    if (filters.groupName) activeFilters.push("Groupe : " + filters.groupName);
    if (filters.fundingType) activeFilters.push("Financement : " + (filters.fundingType === "dif" ? "DIF" : "Cohorte"));
    if (filters.dateFrom) activeFilters.push("Depuis : " + filters.dateFrom);
    if (filters.dateTo) activeFilters.push("Jusqu'au : " + filters.dateTo);

    let startY = 40;
    if (activeFilters.length > 0) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text("Filtres : " + activeFilters.join(" | "), 14, 38);
      startY = 44;
    }

    const tableData = filtered.map((l) => [
      l.last_name + " " + l.first_name,
      l.email,
      l.postal_code || "-",
      l.funding_type === "dif" ? "DIF" : l.funding_type === "cohort" ? "Cohorte" : "-",
      l.group_name || "-",
      fmtDate(l.created_at),
      l.completed + "/" + l.totalChapters + " (" + l.pct + "%)",
      l.timeStr,
      l.scoreStr,
      fmtDate(l.lastAccess),
    ]);

    autoTable(doc, {
      startY,
      head: [["Nom", "Email", "CP", "Financement", "Groupe", "Inscription", "Progression", "Temps", "Score", "Dernier acces"]],
      body: tableData,
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [15, 31, 61], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 42 },
        5: { halign: "center" },
        6: { halign: "center" },
        7: { halign: "center" },
        8: { halign: "center" },
        9: { halign: "center" },
      },
      didDrawPage: (data: any) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "Elu Formation - Page " + data.pageNumber + "/" + pageCount,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      },
    });

    doc.save("eluformation_suivi_" + new Date().toISOString().slice(0, 10) + ".pdf");
  };

  const exportCSV = () => {
    const headers = ["Nom", "Prenom", "Email", "Code Postal", "Commune", "Financement", "Groupe", "Inscription", "Progression", "Temps", "Score", "Dernier acces"];
    const rows = filtered.map((l) => [
      l.last_name,
      l.first_name,
      l.email,
      l.postal_code || "",
      l.commune || "",
      l.funding_type === "dif" ? "DIF" : l.funding_type === "cohort" ? "Cohorte" : "",
      l.group_name || "",
      fmtDate(l.created_at),
      l.completed + "/" + l.totalChapters + " (" + l.pct + "%)",
      l.timeStr,
      l.scoreStr,
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

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-[#0f1f3d]">Apprenants ({filtered.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-50 transition">
            {showFilters ? "Masquer filtres" : "Filtres"}
          </button>
          <button onClick={exportPDF} className="px-3 py-1.5 text-sm bg-[#0f1f3d] text-white rounded-lg font-medium hover:bg-[#1a3a6b] transition">
            Export PDF
          </button>
          <button onClick={exportCSV} className="px-3 py-1.5 text-sm border border-[#0f1f3d] text-[#0f1f3d] rounded-lg font-medium hover:bg-gray-50 transition">
            Export CSV
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input type="text" placeholder="Nom, prenom, email..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
          <input type="text" placeholder="Code postal" value={filters.postalCode} onChange={(e) => setFilters({...filters, postalCode: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
          <select value={filters.groupName} onChange={(e) => setFilters({...filters, groupName: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]">
            <option value="">Tous les groupes</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filters.fundingType} onChange={(e) => setFilters({...filters, fundingType: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]">
            <option value="">Tout financement</option>
            <option value="dif">DIF</option>
            <option value="cohort">Cohorte</option>
          </select>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]" title="Inscrit depuis" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="px-3 py-2 border rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0f1f3d]" title="Inscrit jusqu'au" />
          <button onClick={() => setFilters({ search: "", postalCode: "", groupName: "", fundingType: "", dateFrom: "", dateTo: "" })} className="px-3 py-2 text-sm text-red-500 hover:text-red-700 transition">
            Reinitialiser
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400">
          <p className="text-lg">Aucun apprenant trouve</p>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Financement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Groupe</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Inscription</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progression</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Temps</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dernier acces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-[#0f1f3d]">
                    <a href={"/admin/learner/" + l.id} className="hover:underline">
                      {l.last_name} {l.first_name}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{l.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{l.postal_code || "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{l.funding_type === "dif" ? "DIF" : l.funding_type === "cohort" ? "Cohorte" : "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{l.group_name || "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 text-center">{fmtDate(l.created_at)}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-[#0f1f3d] h-2 rounded-full" style={{ width: l.pct + "%" }} />
                      </div>
                      <span className="text-xs text-gray-500">{l.completed}/{l.totalChapters}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 text-center">{l.timeStr}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 text-center">{l.scoreStr}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 text-center">{fmtDate(l.lastAccess)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
