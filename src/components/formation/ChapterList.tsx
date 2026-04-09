"use client";

import { ChapterWithProgress } from "@/types";

export default function ChapterList({ chapters }: { chapters: ChapterWithProgress[] }) {
  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  const total = sorted.length;
  const cols = 3;
  const rows = Math.ceil(total / cols);

  const unlockedSet = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    const ch = sorted[i];
    const status = ch.progress?.status;
    if (ch.order <= 1) { unlockedSet.add(ch.id); continue; }
    if (status === "incomplete" || status === "completed" || status === "passed") {
      unlockedSet.add(ch.id); continue;
    }
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

  // Shared card renderer used by both desktop and mobile
  function renderCard(chapter: ChapterWithProgress) {
    const status = chapter.progress?.status;
    const isDone = status === "completed" || status === "passed";
    const isActive = status === "incomplete";
    const isUnlocked = unlockedSet.has(chapter.id);
    const isLocked = !isUnlocked;
    const timeDisplay = formatTime(chapter.progress?.total_time);
    const dotBg = isDone ? "#22c55e" : isActive ? "#373b94" : "#d1d5db";
    const dotWrapClass = `cl-dot-wrap${isDone ? " cl-dot-wrap--done" : isActive ? " cl-dot-wrap--active" : isLocked ? " cl-dot-wrap--locked" : ""}`;
    const timeNode = timeDisplay
      ? <p className="cl-time">{timeDisplay}</p>
      : chapter.estimated_duration
      ? <p className="cl-time">~{chapter.estimated_duration} min</p>
      : null;

    return (
      <a
        key={chapter.id}
        href={isLocked ? undefined : `/formation/${chapter.id}`}
        className={
          isActive ? "cl-card cl-card--active"
          : isLocked ? "cl-card cl-card--locked"
          : "cl-card cl-card--default"
        }
        style={{ border: isActive ? "2px solid #373b94" : "1.5px solid rgba(15,31,61,0.10)" }}
      >
        <div className={dotWrapClass}>
          {isLocked
            ? <span style={{ fontSize: 14, opacity: 0.5 }}>🔒</span>
            : isDone
            ? <span style={{ fontSize: 14 }}>✓</span>
            : <span className="cl-dot" style={{ background: dotBg }} />
          }
        </div>
        <div className="cl-card-body">
          {isDone && <span className="cl-badge cl-badge--done">Terminé</span>}
          {isActive && <span className="cl-badge cl-badge--active">En cours</span>}
          {isLocked && <span className="cl-badge cl-badge--locked">🔒</span>}
          <div className="cl-meta">
            <span className="cl-dot" style={{ background: dotBg }} />
            {chapter.order === 0 ? "Introduction" : `Chapitre ${chapter.order}`}
          </div>
          <div className="cl-mobile-row">
            <p className="cl-title">{chapter.title}</p>
            {isDone && <span className="cl-badge cl-badge--done">Terminé</span>}
            {isActive && <span className="cl-badge cl-badge--active">En cours</span>}
          </div>
          {timeNode}
        </div>
      </a>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
        .cl-card {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 160px;
          text-decoration: none;
          background: #fff;
          border-radius: 14px;
          padding: 14px 14px 12px;
          position: relative;
          transition: transform .2s, box-shadow .2s;
          box-sizing: border-box;
          overflow: hidden;
        }
        .cl-card:hover:not(.cl-card--locked) {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(15,31,61,0.10);
        }
        .cl-card--active  { border: 2px solid #373b94; }
        .cl-card--default { border: 1.5px solid rgba(15,31,61,0.10); }
        .cl-card--locked  { border: 1.5px solid rgba(15,31,61,0.10); opacity: 0.45; cursor: default; }

        .cl-badge {
          position: absolute; top: 10px; right: 10px;
          padding: 3px 8px; border-radius: 99px; font-size: 11px; font-weight: 500;
          white-space: nowrap;
        }
        .cl-badge--done   { background: #dcfce7; color: #15803d; }
        .cl-badge--active { background: #373b94; color: #fff; }
        .cl-badge--locked { font-size: 13px; opacity: 0.4; background: none; padding: 0; top: 11px; }

        .cl-meta {
          font-size: 11px; font-weight: 500; color: #6b7280;
          margin-bottom: 6px;
          display: flex; align-items: center; gap: 4px;
          padding-right: 56px;
        }
        .cl-dot {
          width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0;
        }
        .cl-title {
          font-size: 13px; font-weight: 500; color: #1a1a2e;
          line-height: 1.4; margin-bottom: auto;
          padding-right: 4px;
        }
        .cl-time {
          font-size: 11px; color: #6b7280; margin-top: 6px; flex-shrink: 0;
        }

        /* ── DESKTOP only ── */
        @media (min-width: 641px) {
          .cl-mobile  { display: none !important; }
          .cl-desktop { display: block !important; }
          .cl-dot-wrap { display: none; }
          .cl-card-body { display: contents; }
          .cl-mobile-row { display: contents; }
        }

        /* ── MOBILE ── */
        @media (max-width: 640px) {
          .cl-desktop { display: none !important; }
          .cl-mobile  { display: flex; flex-direction: column; gap: 8px; }

          .cl-connector-h,
          .cl-connector-v { display: none !important; }

          .cl-card {
            height: auto !important;
            min-height: unset !important;
            padding: 14px 14px 12px !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 12px;
          }

          .cl-card-body {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
          }

          .cl-badge {
            position: static !important;
            align-self: flex-start;
            margin-top: 4px;
            flex-shrink: 0;
          }

          .cl-meta { padding-right: 0 !important; margin-bottom: 3px; }
          .cl-title { padding-right: 0 !important; font-size: 13px; }
          .cl-time  { margin-top: 3px; }

          .cl-dot-wrap {
            width: 36px; height: 36px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            background: rgba(55,59,148,0.07);
          }
          .cl-dot-wrap--done   { background: #dcfce7; }
          .cl-dot-wrap--active { background: rgba(55,59,148,0.12); }
          .cl-dot-wrap--locked { background: rgba(0,0,0,0.04); }

          .cl-mobile-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }
        }
      ` }} />

      {/* ── MOBILE: flat list in natural order (no serpentine) ── */}
      <div className="cl-mobile">
        {sorted.map((chapter) => renderCard(chapter))}
      </div>

      {/* ── DESKTOP: serpentine grid ── */}
      <div className="cl-desktop">
        {grid.map((row, rowIdx) => {
          const isLastRow = rowIdx === rows - 1;
          const leftToRight = rowIdx % 2 === 0;
          const endColIdx = leftToRight ? cols - 1 : 0;

          return (
            <div key={rowIdx} className="cl-grid">
              {row.map((chapter, colIdx) => {
                if (!chapter) return <div key={colIdx} />;

                const status = chapter.progress?.status;
                const isDone = status === "completed" || status === "passed";
                const isActive = status === "incomplete";
                const isUnlocked = unlockedSet.has(chapter.id);
                const isLocked = !isUnlocked;
                const timeDisplay = formatTime(chapter.progress?.total_time);

                const showRight = colIdx !== endColIdx;
                const showDown = colIdx === endColIdx && !isLastRow;

                const dotBg = isDone ? "#22c55e" : isActive ? "#373b94" : "#d1d5db";
                const dotWrapClass = `cl-dot-wrap${isDone ? " cl-dot-wrap--done" : isActive ? " cl-dot-wrap--active" : isLocked ? " cl-dot-wrap--locked" : ""}`;

                const timeNode = timeDisplay
                  ? <p className="cl-time">{timeDisplay}</p>
                  : chapter.estimated_duration
                  ? <p className="cl-time">~{chapter.estimated_duration} min</p>
                  : null;

                return (
                  <div
                    key={chapter.id}
                    className="cl-cell"
                    style={{ padding: "10px 8px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}
                  >
                    {/* horizontal connector */}
                    {showRight && (
                      <div className="cl-connector-h" style={{
                        position: "absolute",
                        ...(leftToRight ? { right: "-9px" } : { left: "-9px" }),
                        top: "50%", transform: "translateY(-50%)",
                        width: 18, height: 2,
                        background: "#373b94", opacity: 0.25, zIndex: 2, pointerEvents: "none",
                      }} />
                    )}
                    {/* vertical connector */}
                    {showDown && (
                      <div className="cl-connector-v" style={{
                        position: "absolute",
                        bottom: -10, left: "50%", transform: "translateX(-50%)",
                        width: 2, height: 20,
                        background: "#373b94", opacity: 0.25, zIndex: 2,
                      }} />
                    )}

                    <a
                      href={isLocked ? undefined : `/formation/${chapter.id}`}
                      className={
                        isActive ? "cl-card cl-card--active"
                        : isLocked ? "cl-card cl-card--locked"
                        : "cl-card cl-card--default"
                      }
                      style={{ border: isActive ? "2px solid #373b94" : "1.5px solid rgba(15,31,61,0.10)" }}
                    >
                      <div className={dotWrapClass}>
                        {isLocked
                          ? <span style={{ fontSize: 14, opacity: 0.5 }}>🔒</span>
                          : isDone
                          ? <span style={{ fontSize: 14 }}>✓</span>
                          : <span className="cl-dot" style={{ background: dotBg }} />
                        }
                      </div>

                      <div className="cl-card-body">
                        {isDone && <span className="cl-badge cl-badge--done">Terminé</span>}
                        {isActive && <span className="cl-badge cl-badge--active">En cours</span>}
                        {isLocked && <span className="cl-badge cl-badge--locked">🔒</span>}

                        <div className="cl-meta">
                          <span className="cl-dot" style={{ background: dotBg }} />
                          {chapter.order === 0 ? "Introduction" : `Chapitre ${chapter.order}`}
                        </div>

                        <div className="cl-mobile-row">
                          <p className="cl-title">{chapter.title}</p>
                          {isDone && <span className="cl-badge cl-badge--done">Terminé</span>}
                          {isActive && <span className="cl-badge cl-badge--active">En cours</span>}
                        </div>

                        {timeNode}
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}