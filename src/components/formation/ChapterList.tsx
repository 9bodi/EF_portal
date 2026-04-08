"use client";

import { ChapterWithProgress } from "@/types";

export default function ChapterList({ chapters }: { chapters: ChapterWithProgress[] }) {
  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  const total = sorted.length;
  const cols = 3;
  const rows = Math.ceil(total / cols);

  // Déverrouillage : intro + module 1 toujours ouverts
  // Les suivants se débloquent dès que le précédent a été ouvert (incomplete, completed ou passed)
  const unlockedSet = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    const ch = sorted[i];
    const status = ch.progress?.status;

    // Module 0 et 1 toujours accessibles
    if (ch.order <= 1) {
      unlockedSet.add(ch.id);
      continue;
    }

    // Si le module lui-même a déjà été ouvert, il reste accessible
    if (status === "incomplete" || status === "completed" || status === "passed") {
      unlockedSet.add(ch.id);
      continue;
    }

    // Sinon, on regarde si le précédent a été ouvert
    const prev = sorted.find((c) => c.order === ch.order - 1);
    if (prev) {
      const prevStatus = prev.progress?.status;
      if (prevStatus === "incomplete" || prevStatus === "completed" || prevStatus === "passed") {
        unlockedSet.add(ch.id);
      }
    }
  }

  function buildGrid(): (ChapterWithProgress | null)[][] {
    const grid: (ChapterWithProgress | null)[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowItems: (ChapterWithProgress | null)[] = sorted.slice(r * cols, r * cols + cols);
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
        const endColIdx = leftToRight ? cols - 1 : 0;

        return (
          <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0 }}>
            {row.map((chapter, colIdx) => {
              if (!chapter) return <div key={colIdx} />;

              const status = chapter.progress?.status;
              const isDone = status === "completed" || status === "passed";
              const isActive = status === "incomplete";
              const isUnlocked = unlockedSet.has(chapter.id);
              const isLocked = !isUnlocked;
              const timeDisplay = formatTime(chapter.progress?.total_time);

              const showDown = colIdx === endColIdx && !isLastRow;
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
                      opacity: isLocked ? 0.45 : 1,
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
                    {isDone && (
                      <span style={{
                        position: "absolute", top: 12, right: 12,
                        padding: "3px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500,
                        background: "#dcfce7", color: "#15803d",
                      }}>
                        Terminé
                      </span>
                    )}
                    {isActive && (
                      <span style={{
                        position: "absolute", top: 12, right: 12,
                        padding: "3px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500,
                        background: "#0f1f3d", color: "#fff",
                      }}>
                        En cours
                      </span>
                    )}
                    {isLocked && (
                      <span style={{
                        position: "absolute", top: 12, right: 12,
                        fontSize: 14, opacity: 0.4,
                      }}>
                        🔒
                      </span>
                    )}

                    <div style={{
                      fontSize: 11, fontWeight: 500, color: "#6b7280",
                      marginBottom: 8, display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", display: "inline-block",
                        background: isDone ? "#22c55e" : isActive ? "#0f1f3d" : "#d1d5db",
                        flexShrink: 0,
                      }} />
                      {chapter.order === 0 ? "Introduction" : `Chapitre ${chapter.order}`}
                    </div>

                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", lineHeight: 1.4, marginBottom: "auto" }}>
                      {chapter.title}
                    </p>

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
