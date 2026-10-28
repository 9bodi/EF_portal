"use client";
import { useState } from "react";

interface Lead {
  id: string;
  type: string;
  status: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  commune: string | null;
  mandat: string | null;
  formations: string[] | null;
  disponibilites: string | null;
  message: string | null;
  notes: string | null;
  newsletter: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
}

const MANDAT_LABELS: Record<string, string> = {
  maire: "Maire",
  adjoint: "Adjoint(e)",
  conseiller_municipal: "Conseiller(ère) municipal(e)",
  autre: "Autre",
};

const TYPE_LABELS: Record<string, string> = {
  "pre-inscription": "Pré-inscription",
  rappel: "Rappel",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function LeadsTable({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [exporting, setExporting] = useState(false);

  const filtered = leads.filter((l) => {
    if (filterType !== "all" && l.type !== filterType) return false;
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (new Date(l.created_at) < from) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      const match =
        l.prenom.toLowerCase().includes(s) ||
        l.nom.toLowerCase().includes(s) ||
        (l.email && l.email.toLowerCase().includes(s)) ||
        (l.telephone && l.telephone.includes(s)) ||
        (l.commune && l.commune.toLowerCase().includes(s));
      if (!match) return false;
    }
    return true;
  });

  function exportCSV() {
    setExporting(true);

    const headers = [
      "Date de validation",
      "Quelle formation souhaitez-vous suivre en priorité ? *",
      "Une autre formation vous intéresse ? (facultatif)",
      "Nom *",
      "Prénom *",
      "Commune d'élection *",
      "Mandat électif *",
      "Téléphone *",
      "Adresse email *",
      "Disponibilités (facultatif)",
      "Question et/ou besoin particulier ? (facultatif)",
      "Recevoir les dates de nos prochaines formations (facultatif)",
    ];

    const rows = filtered.map((l) => {
      const formations = l.formations || [];
      const prioritaire = formations.length > 0 ? formations[0] : "";
      const autres = formations.length > 1 ? formations.slice(1).join(", ") : "";

      return [
        formatDateShort(l.created_at),
        prioritaire,
        autres,
        l.nom,
        l.prenom,
        l.commune || "",
        MANDAT_LABELS[l.mandat || ""] || l.mandat || "",
        l.telephone || "",
        l.email || "",
        l.disponibilites || "",
        l.message || "",
        l.newsletter ? "Oui" : "Non",
      ];
    });

    const bom = "\uFEFF";
    const csv =
      bom +
      [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  async function deleteLead(id: string) {
    if (!confirm("Supprimer définitivement ce lead ? (RGPD)")) return;
    try {
      const res = await fetch("/api/admin/leads/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, delete: true }),
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        setSelectedLead(null);
      }
    } catch {}
  }

  return (
    <>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Leads</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={exporting || filtered.length === 0}
          style={{
            background: "#373b94",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: filtered.length === 0 ? "not-allowed" : "pointer",
            opacity: filtered.length === 0 ? 0.5 : 1,
          }}
        >
          {exporting ? "Export..." : `Exporter CSV (${filtered.length})`}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Rechercher (nom, email, tél, commune)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 13,
            minWidth: 240,
          }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}
        >
          <option value="all">Tous types</option>
          <option value="pre-inscription">Pré-inscription</option>
          <option value="rappel">Rappel</option>
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>À partir du</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          />
          {dateFrom && (
            <button
              onClick={() => setDateFrom("")}
              style={{
                background: "none",
                border: "none",
                fontSize: 16,
                cursor: "pointer",
                color: "#9ca3af",
                padding: "0 4px",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          overflow: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Téléphone</th>
              <th style={thStyle}>Commune</th>
              <th style={thStyle}>Formation prioritaire</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
                  Aucun lead trouvé.
                </td>
              </tr>
            )}
            {filtered.map((l) => (
              <tr
                key={l.id}
                onClick={() => setSelectedLead(l)}
                style={{
                  borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={tdStyle}>{formatDate(l.created_at)}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: l.type === "pre-inscription" ? "#7c3aed" : "#0369a1",
                    }}
                  >
                    {TYPE_LABELS[l.type] || l.type}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>
                  {l.prenom} {l.nom}
                </td>
                <td style={tdStyle}>{l.email || "—"}</td>
                <td style={tdStyle}>{l.telephone || "—"}</td>
                <td style={tdStyle}>{l.commune || "—"}</td>
                <td style={tdStyle}>
                  {l.formations && l.formations.length > 0 ? l.formations[0] : "—"}
                </td>
                <td style={tdStyle}>→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selectedLead && (
        <div
          onClick={() => setSelectedLead(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 32,
              maxWidth: 560,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                {selectedLead.prenom} {selectedLead.nom}
              </h3>
              <button
                onClick={() => setSelectedLead(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#9ca3af",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <DetailRow label="Type" value={TYPE_LABELS[selectedLead.type] || selectedLead.type} />
              <DetailRow label="Date" value={formatDate(selectedLead.created_at)} />
              <DetailRow label="Email" value={selectedLead.email || "—"} />
              <DetailRow label="Téléphone" value={selectedLead.telephone || "—"} />
              <DetailRow label="Commune" value={selectedLead.commune || "—"} />
              <DetailRow
                label="Mandat"
                value={
                  MANDAT_LABELS[selectedLead.mandat || ""] || selectedLead.mandat || "—"
                }
              />
            </div>

            {selectedLead.formations && selectedLead.formations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                  Formations souhaitées
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedLead.formations.map((f, i) => (
                    <span
                      key={f}
                      style={{
                        background: i === 0 ? "#dbeafe" : "#f3f4f6",
                        color: i === 0 ? "#1d4ed8" : "#374151",
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 6,
                        padding: "3px 10px",
                      }}
                    >
                      {i === 0 ? "Prioritaire : " : ""}
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedLead.disponibilites && (
              <DetailBlock label="Disponibilités" value={selectedLead.disponibilites} />
            )}

            {selectedLead.message && (
              <DetailBlock label="Message" value={selectedLead.message} />
            )}

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid #f1f5f9",
                paddingTop: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                Newsletter : {selectedLead.newsletter ? "Oui" : "Non"}
              </span>
              <button
                onClick={() => deleteLead(selectedLead.id)}
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Supprimer (RGPD)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, color: "#1e293b", margin: 0 }}>{value}</p>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>{label}</p>
      <p
        style={{
          fontSize: 13,
          color: "#374151",
          background: "#f9fafb",
          padding: "10px 14px",
          borderRadius: 8,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {value}
      </p>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  color: "#374151",
};
