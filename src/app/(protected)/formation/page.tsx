import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChapterList from "@/components/formation/ChapterList";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function FormationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");
  if (profile.must_change_password) redirect("/first-login");

  const { data: chapters } = await supabase.from("chapters").select("*").order("order");
  const { data: progress } = await supabase.from("scorm_progress").select("*").eq("user_id", user.id);

  const chaptersWithProgress = (chapters || []).map((ch: any) => {
    const p = (progress || []).find((pr: any) => pr.chapter_id === ch.id);
    return { ...ch, progress: p || null };
  });

  const completed = chaptersWithProgress.filter(
    (c: any) => c.progress?.status === "completed" || c.progress?.status === "passed"
  ).length;
  const total = chaptersWithProgress.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const next = chaptersWithProgress.find(
    (c: any) => !c.progress || (c.progress.status !== "completed" && c.progress.status !== "passed")
  );

  const circumference = 175.9;
  const strokeDashoffset = circumference - (circumference * pct) / 100;

  await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

  const isAdmin = profile.role === "admin";

  return (
    <div className="ef-root">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ef-root {
          min-height: 100vh;
          background: #f5f3ef;
          font-family: 'DM Sans', sans-serif;
          color: #1a1c3a;
          overflow-x: hidden;
        }

        /* ── HEADER ── */
        .ef-header {
          background: #373b94;
          padding: 0 32px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(30,33,100,0.22);
        }

        .ef-header-logo { display: flex; align-items: center; }

        .ef-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ef-greeting {
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          font-weight: 500;
          margin-right: 8px;
          white-space: nowrap;
        }
        .ef-greeting strong {
          color: #fff;
          font-weight: 600;
        }

        .ef-btn-ghost {
          color: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 7px;
          padding: 7px 14px;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          white-space: nowrap;
        }
        .ef-btn-ghost:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-color: rgba(255,255,255,0.35);
        }

        .ef-btn-admin {
          background: rgba(255,255,255,0.12);
          color: #fff;
          font-weight: 600;
          border-color: rgba(255,255,255,0.25);
        }
        .ef-btn-admin:hover {
          background: rgba(255,255,255,0.2);
        }

        /* ── MAIN ── */
        .ef-main {
          max-width: 860px;
          width: 100%;
          margin: 0 auto;
          padding: 40px 20px 60px;
          overflow-x: hidden;
        }

        /* ── HERO CARD ── */
        .ef-hero {
          background: #373b94;
          border-radius: 20px;
          padding: 36px 40px;
          margin-bottom: 36px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 32px;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .ef-hero::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 240px;
          height: 240px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
          pointer-events: none;
        }
        .ef-hero::after {
          content: '';
          position: absolute;
          bottom: -80px;
          right: 80px;
          width: 180px;
          height: 180px;
          background: rgba(255,255,255,0.03);
          border-radius: 50%;
          pointer-events: none;
        }

        .ef-hero-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin-bottom: 10px;
        }

        .ef-hero-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          margin-bottom: 8px;
        }

        .ef-hero-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.55);
          margin-bottom: 28px;
          font-weight: 400;
        }

        .ef-stat-row {
          display: flex;
          gap: 24px;
          margin-bottom: 28px;
        }

        .ef-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ef-stat-num {
          font-family: 'DM Sans', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .ef-stat-label {
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        .ef-stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.12);
          align-self: stretch;
          margin: 2px 0;
        }

        .ef-progress-track {
          height: 5px;
          background: rgba(255,255,255,0.12);
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .ef-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(255,255,255,0.6) 0%, #fff 100%);
          border-radius: 99px;
          transition: width 0.9s cubic-bezier(0.4,0,0.2,1);
        }

        .ef-btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          color: #373b94;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          padding: 13px 24px;
          border-radius: 10px;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          letter-spacing: 0.01em;
        }
        .ef-btn-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.24);
        }
        .ef-btn-cta:hover .ef-arrow {
          transform: translateX(4px);
        }
        .ef-arrow {
          font-size: 16px;
          transition: transform 0.2s ease;
        }

        /* Circular ring */
        .ef-ring-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .ef-ring-inner {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          pointer-events: none;
        }
        .ef-ring-pct {
          font-family: 'DM Sans', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          line-height: 1;
        }
        .ef-ring-done {
          font-size: 10px;
          color: rgba(255,255,255,0.45);
          font-weight: 500;
          margin-top: 2px;
          letter-spacing: 0.04em;
        }

        /* ── SECTION HEADER ── */
        .ef-section-head {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 16px;
        }
        .ef-section-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #1a1c3a;
          letter-spacing: -0.01em;
        }
        .ef-section-count {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* ── FOOTER ── */
        .ef-footer {
          text-align: center;
          padding: 20px;
          font-size: 13px;
          color: #b0b8c8;
          font-weight: 400;
        }
        .ef-footer a {
          color: #373b94;
          text-decoration: none;
          font-weight: 600;
        }
        .ef-footer a:hover { text-decoration: underline; }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .ef-header {
            padding: 0 16px;
            height: 60px;
          }
          .ef-greeting {
            display: none;
          }
          .ef-main {
            padding: 24px 16px 48px;
          }
          .ef-hero {
            grid-template-columns: 1fr;
            padding: 28px 20px;
            gap: 28px;
          }
          .ef-hero-title {
            font-size: 22px;
          }
          .ef-ring-wrap {
            order: -1;
            display: flex;
            justify-content: center;
          }
          .ef-stat-row {
            gap: 16px;
          }
          .ef-btn-cta {
            width: 100%;
            justify-content: center;
          }
          /* Fix chapter cards overflow */
          .ef-main > * {
            max-width: 100%;
            overflow-x: hidden;
          }
        }
      ` }} />

      {/* ── HEADER ── */}
      <header className="ef-header">
        <div className="ef-header-logo">
          <Image
            src="/img/LOGO_ELU-FORMATION_BLANC100.png"
            alt="Élu Formation"
            width={160}
            height={52}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div className="ef-header-right">
          <span className="ef-greeting">
            Bonjour <strong>{profile.first_name}</strong>
          </span>
          {isAdmin && (
            <a href="/admin" className="ef-btn-ghost ef-btn-admin">
              Admin
            </a>
          )}
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="ef-btn-ghost">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="ef-main">

        {/* Hero progress card */}
        <div className="ef-hero">
          <div>
            <p className="ef-hero-label">Tableau de bord</p>
            <h1 className="ef-hero-title">
              {pct === 100
                ? "Formation terminée 🎉"
                : completed > 0
                ? "Continuez sur votre lancée"
                : "Commencez votre formation"}
            </h1>
            <p className="ef-hero-sub">
              {pct === 100
                ? "Vous avez complété l'intégralité du parcours."
                : "Progressez à votre rythme, chapitre par chapitre."}
            </p>

            <div className="ef-stat-row">
              <div className="ef-stat">
                <span className="ef-stat-num">{completed}</span>
                <span className="ef-stat-label">Terminé{completed > 1 ? "s" : ""}</span>
              </div>
              <div className="ef-stat-divider" />
              <div className="ef-stat">
                <span className="ef-stat-num">{total - completed}</span>
                <span className="ef-stat-label">Restant{(total - completed) > 1 ? "s" : ""}</span>
              </div>
              <div className="ef-stat-divider" />
              <div className="ef-stat">
                <span className="ef-stat-num">{total}</span>
                <span className="ef-stat-label">Total</span>
              </div>
            </div>

            <div className="ef-progress-track">
              <div className="ef-progress-fill" style={{ width: `${pct}%` }} />
            </div>

            {next && (
              <a href={`/formation/${next.id}`} className="ef-btn-cta">
                {completed > 0 ? "Continuer la formation" : "Commencer la formation"}
                <span className="ef-arrow">→</span>
              </a>
            )}
          </div>

          {/* Ring */}
          <div className="ef-ring-wrap">
            <svg width="120" height="120" viewBox="0 0 72 72">
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="5"
              />
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
                style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </svg>
            <div className="ef-ring-inner">
              <span className="ef-ring-pct">{pct}%</span>
              <span className="ef-ring-done">complété</span>
            </div>
          </div>
        </div>

        {/* Chapter list */}
        <div className="ef-section-head">
          <h2 className="ef-section-title">Votre parcours</h2>
          <span className="ef-section-count">{total} chapitre{total > 1 ? "s" : ""}</span>
        </div>

        <ChapterList chapters={chaptersWithProgress} />
      </main>

      <footer className="ef-footer">
        Support&nbsp;:{" "}
        <a href="mailto:contact@eluformation.fr">contact@eluformation.fr</a>
      </footer>
    </div>
  );
}