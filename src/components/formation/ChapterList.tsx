"use client";

import { ChapterWithProgress } from "@/types";

export default function ChapterList({ chapters }: { chapters: ChapterWithProgress[] }) {
  const sorted = [...chapters].sort((a, b) => a.order - b.order);

  // ── Unlock logic ──
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

  function formatTime(t: string | null | undefined): string | null {
    if (!t || t === "00:00:00") return null;
    const match = t.match(/(\d+):(\d+):(\d+)/);
    if (!match) return null;
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cl-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        .cl-rect {
          display: flex;
          align-items: center;
          gap: 20px;
          background: #fff;
          border-radius: 16px;
          padding: 24px 28px;
          text-decoration: none;
          color: inherit;
          position: relative;
          overflow: hidden;
          transition: transform .2s, box-shadow .2s;
          border: 1.5px solid rgba(55, 59, 148, 0.10);
        }
        .cl-rect:hover:not(.cl-rect--locked) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(55, 59, 148, 0.12);
        }
        .cl-rect--active {
          border: 2px solid #373b94;
        }
        .cl-rect--locked {
          opacity: 0.5;
          cursor: default;
        }

        /* Progress bar at bottom of card */
        .cl-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 4px;
          background: #373b94;
          border-radius: 0 2px 0 0;
          transition: width .4s ease;
        }
        .cl-progress-bar--done {
          background: #22c55e;
        }

        /* Number circle */
        .cl-number {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          flex-shrink: 0;
          color: #fff;
          background: #d1d5db;
        }
        .cl-number--active {
          background: #373b94;
        }
        .cl-number--done {
          background: #22c55e;
        }
        .cl-number--locked {
          background: #e5e7eb;
          color: #9ca3af;
        }

        /* Content area */
        .cl-content {
          flex: 1;
          min-width: 0;
        }
        .cl-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .cl-chapter-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a2e;
          line-height: 1.4;
          margin: 0;
        }
        .cl-chapter-time {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 6px;
        }

        /* Right side badge */
        .cl-status {
          flex-shrink: 0;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }
        .cl-status--done {
          background: #dcfce7;
          color: #15803d;
        }
        .cl-status--active {
          background: rgba(55, 59, 148, 0.1);
          color: #373b94;
        }
        .cl-status--locked {
          font-size: 18px;
        }

        /* Vertical connector line between cards */
        .cl-connector {
          width: 2px;
          height: 16px;
          background: rgba(55, 59, 148, 0.15);
          margin: 0 auto;
          flex-shrink: 0;
        }

        /* ── MOBILE adjustments ── */
        @media (max-width: 640px) {
          .cl-rect {
            padding: 16px 16px;
            gap: 14px;
          }
          .cl-number {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            font-size: 16px;
          }
          .cl-chapter-title {
            font-size: 14px;
          }
          .cl-status {
            padding: 4px 10px;
            font-size: 12px;
          }
        }
      ` }} />

      <div className="cl-list">
        {sorted.map((chapter, idx) => {
          const status = chapter.progress?.status;
          const isDone = status === "completed" || status === "passed";
          const isActive = status === "incomplete";
          const isUnlocked = unlockedSet.has(chapter.id);
          const isLocked = !isUnlocked;
          const timeDisplay = formatTime(chapter.progress?.total_time);

          // Progress percentage for the bar
          const progressPct = isDone ? 100 : isActive ? 40 : 0;

          const numberClass = `cl-number${isDone ? " cl-number--done" : isActive ? " cl-number--active" : isLocked ? " cl-number--locked" : ""}`;
          const cardClass = `cl-rect${isActive ? " cl-rect--active" : isLocked ? " cl-rect--locked" : ""}`;

          return (
            <div key={chapter.id}>
              {/* Connector line between cards */}
              {idx > 0 && <div className="cl-connector" />}

              <a
                href={isLocked ? undefined : `/formation/${chapter.id}`}
                className={cardClass}
              >
                {/* Progress bar at bottom */}
                <div
                  className={`cl-progress-bar${isDone ? " cl-progress-bar--done" : ""}`}
                  style={{ width: `${progressPct}%` }}
                />

                {/* Number circle */}
                <div className={numberClass}>
                  {isLocked ? "🔒" : isDone ? "✓" : chapter.order === 0 ? "0" : chapter.order}
                </div>

                {/* Text content */}
                <div className="cl-content">
                  <p className="cl-label">
                    {chapter.order === 0 ? "Introduction" : `Module ${chapter.order}`}
                  </p>
                  <p className="cl-chapter-title">{chapter.title}</p>
                  {timeDisplay ? (
                    <p className="cl-chapter-time">{timeDisplay}</p>
                  ) : chapter.estimated_duration ? (
                    <p className="cl-chapter-time">~{chapter.estimated_duration} min</p>
                  ) : null}
                </div>

                {/* Status badge */}
                {isDone && <span className="cl-status cl-status--done">Terminé</span>}
                {isActive && <span className="cl-status cl-status--active">En cours</span>}
                {isLocked && <span className="cl-status cl-status--locked">🔒</span>}
              </a>
            </div>
          );
        })}
      </div>
    </>
  );
}
