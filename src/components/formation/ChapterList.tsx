"use client";

import { ChapterWithProgress } from "@/types";

export default function ChapterList({ chapters }: { chapters: ChapterWithProgress[] }) {
  const total = chapters.length;
  const cols = 3;
  const rows = Math.ceil(total / cols);

  // Construit la grille en S
  function buildGrid(): (ChapterWithProgress | null)[][] {
    const grid: (ChapterWithProgress | null)[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowItems: (ChapterWithProgress | null)[] = chapters.slice(r * cols, r * cols + cols);
      while (rowItems.length < cols) rowItems.push(null);
      grid.push(r % 2 === 1 ? [...rowItems].reverse() : rowItems);
    }
    return grid;
  }

  const grid = buildGrid();

  function formatTime(t: string | null | undefined): string | null {
    if (!t || t === "00:00:00") return null;
    const match = t.match(/(\d+):(\d+):(\d+)/);
    if (!match) return null;
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
  }

  return (
    <div>
      {grid.map((row, rowIdx) => {
        const isLastRow = rowIdx === rows - 1;
        const leftToRight = rowIdx % 2 === 0;
        // Index dans la grille de la dernière case de cette rangée (celle qui a le trait vertical)
        const endColIdx = leftToRight ? cols - 1 : 0;

        return (
          <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0 }}>
            {row.map((chapter, colIdx) => {
              if (!chapter) return <div key={colIdx} />;

              const status = chapter.progress?.status;
              const isDone = status === "completed" || status === "passed";
              const isActive = status === "incomplete";
              const isLocked = !status || status === "not_started";
              const timeDisplay = formatTime(chapter.progress?.total_time);

              // Trait vertical : dernière case de chaque rangée sauf dernière rangée
              const showDown = colIdx === endColIdx && !isLastRow;
              // Trait horizontal : toutes les cases sauf la dernière de la rangée (endColIdx)
              const showRight = colIdx !== endColIdx;

              return (
                <div
                  key={chapter.id}
                  style={{
                    padding: "10px 8px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* Trait horizontal entre cases — dans le gap entre les cards */}
                  {showRight && (
                    <div style={{
                      position: "absolute",
                      ...(leftToRight
                        ? { right: "-9px" }
                        : { left: "-9px" }),
                      top: "50%", transform: "translateY(-50%)",
                      width: "18px", height: 2,
                      background: "#0f1f3d", opacity: 0.25, zIndex: 2,
                      pointerEvents: "none",
                    }} />
                  )}

                  {/* Trait vertical entre rangées */}
                  {showDown && (
                    <div style={{
                      position: "absolute",
                      bottom: -10, left: "50%", transform: "translateX(-50%)",
                      width: 2, height: 20,
                      background: "#0f1f3d", opacity: 0.25, zIndex: 2,
                    }} />
                  )}

                  <a
                    href={isLocked ? undefined : `/formation/${chapter.id}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      height: 160,
                      textDecoration: "none",
                      background: "#fff",
                      border: isActive ? "2px solid #0f1f3d" : "1.5px solid rgba(15,31,61,0.10)",
                      borderRadius: 14,
                      padding: "18px 16px",
                      cursor: isLocked ? "default" : "pointer",
                      opacity: isLocked ? 0.5 : 1,
                      position: "relative",
                      transition: "transform .2s, box-shadow .2s",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLocked) {
                        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)";
                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px rgba(15,31,61,0.10)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.transform = "";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
                    }}
                  >
                    {/* Badge statut */}
                    {(isDone || isActive) && (
                      <span style={{
                        position: "absolute", top: 12, right: 12,
                        padding: "3px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500,
                        background: isDone ? "#dcfce7" : "#0f1f3d",
                        color: isDone ? "#15803d" : "#fff",
                      }}>
                        {isDone ? "Terminé" : "En cours"}
                      </span>
                    )}

                    {/* Numéro chapitre */}
                    <div style={{
                      fontSize: 11, fontWeight: 500, color: "#6b7280",
                      marginBottom: 8, display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", display: "inline-block",
                        background: isDone ? "#22c55e" : isActive ? "#0f1f3d" : "#d1d5db",
                        flexShrink: 0,
                      }} />
                      Chapitre {chapter.order}
                    </div>

                    {/* Titre */}
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", lineHeight: 1.4, marginBottom: "auto" }}>
                      {chapter.title}
                    </p>

                    {/* Temps */}
                    {timeDisplay ? (
                      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>{timeDisplay}</p>
                    ) : chapter.estimated_duration ? (
                      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>~{chapter.estimated_duration} min</p>
                    ) : null}
                  </a>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
