"use client";
import { useState } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const MANDATS = [
  { value: "maire", label: "Maire" },
  { value: "adjoint", label: "Adjoint(e)" },
  { value: "conseiller_municipal", label: "Conseiller(ère) municipal(e)" },
  { value: "autre", label: "Autre" },
];

const CRENEAUX = ["Matin", "Midi", "Après-midi", "Après 18 h"];

export default function ContactPage() {
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    commune: "",
    mandat: "",
    creneaux: [] as string[],
    precisions: "",
    message: "",
    newsletter: false,
    rgpd: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function toggleCreneau(c: string) {
    setForm((prev) => ({
      ...prev,
      creneaux: prev.creneaux.includes(c) ? prev.creneaux.filter((x) => x !== c) : [...prev.creneaux, c],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.rgpd) {
      setError("Veuillez accepter la politique de confidentialité.");
      return;
    }

    const { creneaux, precisions, ...rest } = form;
    const payload = {
      ...rest,
      // Compatibilité avec l'API existante : créneaux + précisions envoyés dans "disponibilites"
      disponibilites: [creneaux.join(", "), precisions.trim()].filter(Boolean).join(" — "),
      type: "rappel",
      formations: [],
    };

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={`ef ${jakarta.className}`}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="ef-success-wrap">
          <div className="ef-success">
            <div className="ef-success-icon">
              <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#17803d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <div>
              <h1 className="ef-success-title">Demande bien reçue !</h1>
              <p className="ef-success-text">
                Merci pour votre demande. Un conseiller vous rappellera dans les plus brefs délais.
              </p>
            </div>
            <ol className="ef-timeline">
              <li><span className="ef-dot ef-dot--done">✓</span>Demande de rappel enregistrée</li>
              <li><span className="ef-dot ef-dot--next">2</span>Appel d&apos;un conseiller</li>
              <li className="ef-muted"><span className="ef-dot">3</span>Réponse à vos questions</li>
            </ol>
            <a href="https://eluformation.fr" className="ef-cta ef-cta--inline">
              Retour vers eluformation.fr <ArrowIcon />
            </a>
            <p className="ef-legal">Place de la République SAS — Organisme de formation agréé</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ef ${jakarta.className}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ef-layout">
        {/* Panneau gauche */}
        <aside className="ef-aside">
          <div className="ef-logo">
            <Image src="/img/LOGO_ELU-FORMATION.png" alt="Élu Formation" width={150} height={50} style={{ objectFit: "contain" }} priority />
          </div>

          <div className="ef-intro">
            <span className="ef-badge">Être rappelé</span>
            <h1 className="ef-h1">Un conseiller répond à vos questions.</h1>
            <p className="ef-lead">Laissez vos coordonnées, nous vous recontactons rapidement.</p>
          </div>

          <ol className="ef-steps">
            <Step icon={<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />} title="Vous laissez vos coordonnées" text="1 minute, sans engagement." />
            <Step icon={<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />} title="Un conseiller vous rappelle" text="Sur le créneau de votre choix." />
            <Step icon={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></>} title="Il répond à vos questions" text="Formations, modalités, inscription." />
          </ol>

          <div className="ef-trust">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
            <div>
              <strong>Organisme de formation agréé</strong>
              <span>Place de la République SAS</span>
            </div>
          </div>
        </aside>

        {/* Formulaire */}
        <main className="ef-main">
          <form onSubmit={handleSubmit} className="ef-form">
            <div className="ef-form-head">
              <h2>Votre demande de rappel</h2>
              <p>Tous les champs sont obligatoires, sauf mention « optionnel ».</p>
            </div>

            <div className="ef-grid">
              {/* 1. Coordonnées */}
              <section className="ef-card">
                <h3 className="ef-card-title"><span className="ef-num">1</span>Vos coordonnées</h3>
                <div className="ef-row2">
                  <Field label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} required autoComplete="given-name" placeholder="Marie" />
                  <Field label="Nom" name="nom" value={form.nom} onChange={handleChange} required autoComplete="family-name" placeholder="Dupont" />
                </div>
                <div className="ef-row2 ef-row2--stack">
                  <Field label="Téléphone" name="telephone" type="tel" value={form.telephone} onChange={handleChange} required autoComplete="tel" placeholder="06 00 00 00 00" />
                  <Field
                    label={<>E-mail <span className="ef-optional">(optionnel)</span></>}
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder="marie@mairie.fr"
                  />
                </div>
                <Field
                  label={<>Commune <span className="ef-optional">(optionnel)</span></>}
                  name="commune"
                  value={form.commune}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  placeholder="Ex : Saint-Malo"
                />
                <fieldset className="ef-fieldset">
                  <legend className="ef-label">Mandat <span className="ef-optional">(optionnel)</span></legend>
                  <div className="ef-pills" role="radiogroup" aria-label="Mandat">
                    {MANDATS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        role="radio"
                        aria-checked={form.mandat === m.value}
                        className={`ef-pill ${form.mandat === m.value ? "is-on" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, mandat: f.mandat === m.value ? "" : m.value }))}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </section>

              {/* 2. Rappel + envoi */}
              <section className="ef-card ef-card--submit">
                <div className="ef-stack">
                  <h3 className="ef-card-title"><span className="ef-num">2</span>Quand vous rappeler ?</h3>
                  <div className="ef-pills" role="group" aria-label="Créneaux préférés">
                    {CRENEAUX.map((c) => {
                      const on = form.creneaux.includes(c);
                      return (
                        <button key={c} type="button" aria-pressed={on} className={`ef-pill ${on ? "is-on" : ""}`} onClick={() => toggleCreneau(c)}>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                  <Field
                    label={<>Précisions <span className="ef-optional">(optionnel)</span></>}
                    name="precisions"
                    value={form.precisions}
                    onChange={handleChange}
                    placeholder="Ex : plutôt le mardi"
                  />
                  <label className="ef-label ef-field">
                    <span>Votre question <span className="ef-optional">(optionnel)</span></span>
                    <textarea
                      className="ef-input ef-textarea"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ex : quelle formation pour un nouvel élu ?"
                    />
                  </label>
                </div>

                <div className="ef-stack">
                  <div className="ef-consents">
                    <label className="ef-consent">
                      <input type="checkbox" name="newsletter" checked={form.newsletter} onChange={handleChange} />
                      Je souhaite recevoir les actualités d&apos;Élu Formation.
                    </label>
                    <label className="ef-consent">
                      <input type="checkbox" name="rgpd" checked={form.rgpd} onChange={handleChange} required />
                      <span>
                        J&apos;accepte que mes données soient traitées conformément à la{" "}
                        <a href="/confidentialite" target="_blank" rel="noopener noreferrer">politique de confidentialité</a>.
                      </span>
                    </label>
                  </div>

                  {error && <div className="ef-error" role="alert">{error}</div>}

                  <button type="submit" className="ef-cta" disabled={loading}>
                    {loading ? "Envoi en cours…" : <>Demander à être rappelé <ArrowIcon /></>}
                  </button>
                </div>
              </section>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

/* ---------- Sous-composants ---------- */

function Field({
  label,
  ...props
}: { label: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="ef-label ef-field">
      {label}
      <input className="ef-input" {...props} />
    </label>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="ef-step">
      <span className="ef-step-icon">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </span>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </li>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
  );
}

/* ---------- Styles (identiques au formulaire de pré-inscription + textarea) ---------- */

const CSS = `
.ef{--brand:#373b94;--brand-dark:#2c2f7d;--panel:#23265f;--ink:#1b1d3a;--text:#33364f;--muted:#5b5f77;--line:#e4e5ee;--field:#d6d8e4;--bg:#f4f5fa;--soft:#eceefb;
  min-height:100vh;background:var(--bg);color:var(--ink)}
.ef *{box-sizing:border-box}
.ef button,.ef input{font-family:inherit}
.ef a{color:var(--brand)}
.ef a:hover{color:var(--brand-dark)}

/* Layout */
.ef-layout{display:flex;min-height:100vh}
.ef-aside{width:360px;flex:none;background:var(--panel);color:#fff;padding:40px 36px 32px;display:flex;flex-direction:column;gap:28px}
.ef-logo{align-self:flex-start;background:#fff;border-radius:12px;padding:8px 12px;display:flex}
.ef-intro{display:flex;flex-direction:column;gap:12px}
.ef-badge{align-self:flex-start;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:rgba(255,255,255,.12);padding:5px 11px;border-radius:999px}
.ef-h1{margin:0;font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-.025em}
.ef-lead{margin:0;font-size:15px;line-height:1.55;color:#d6d8f3}
.ef-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:16px}
.ef-step{display:flex;gap:14px;align-items:flex-start}
.ef-step div,.ef-trust div{display:flex;flex-direction:column;gap:2px}
.ef-step strong{font-size:14px}
.ef-step span:not(.ef-step-icon){font-size:13px;color:#c4c6ec}
.ef-step-icon{flex:none;width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center}
.ef-trust{margin-top:auto;display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.16)}
.ef-trust strong{font-size:13px;font-weight:600}
.ef-trust span{font-size:12px;color:#c4c6ec}

.ef-main{flex:1 1 auto;min-width:0;padding:32px;display:flex;align-items:center;justify-content:center}
.ef-form{width:100%;max-width:920px;display:flex;flex-direction:column;gap:16px}
.ef-form-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;padding:0 2px}
.ef-form-head h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em}
.ef-form-head p{margin:0;font-size:13px;color:var(--muted)}
.ef-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}

/* Cartes */
.ef-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:12px}
.ef-card--submit{justify-content:space-between}
.ef-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.ef-card-title{margin:0;font-size:15px;font-weight:700;display:flex;align-items:center;gap:10px}
.ef-num{width:24px;height:24px;border-radius:7px;background:var(--soft);color:var(--brand);font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center}
.ef-count{font-size:12px;font-weight:600;color:var(--brand);background:var(--soft);padding:4px 10px;border-radius:999px}

/* Champs */
.ef-row2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.ef-label{font-size:13px;font-weight:600;color:var(--text)}
.ef-field{display:flex;flex-direction:column;gap:6px}
.ef-optional{font-weight:400;color:var(--muted)}
.ef-input{width:100%;height:44px;padding:0 12px;border-radius:11px;border:1px solid var(--field);background:#fbfbfe;font-size:15px;color:var(--ink);transition:border-color .15s,box-shadow .15s}
.ef-input::placeholder{color:#8a8ea6}
.ef-input:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 4px rgba(55,59,148,.14)}
.ef-fieldset{border:none;margin:0;padding:0;min-width:0}
.ef-fieldset legend{padding:0;margin-bottom:6px}

.ef-textarea{height:auto;min-height:88px;padding:10px 12px;line-height:1.5;resize:vertical}
.ef-stack{display:flex;flex-direction:column;gap:12px}

/* Pastilles */
.ef-pills{display:flex;flex-wrap:wrap;gap:6px}
.ef-pill{min-height:36px;padding:0 14px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;color:var(--text);border:1px solid var(--field);transition:all .15s}
.ef-pill:hover{border-color:#a9acd9}
.ef-pill.is-on{background:var(--brand);color:#fff;border-color:var(--brand)}

/* Formations */
.ef-options{display:flex;flex-direction:column;gap:6px}
.ef-option{width:100%;min-height:44px;display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:11px;cursor:pointer;background:#fff;border:1.5px solid var(--line);text-align:left;transition:all .15s}
.ef-option:hover{border-color:#a9acd9}
.ef-option.is-on{background:#f3f4fd;border-color:var(--brand)}
.ef-check{flex:none;width:18px;height:18px;border-radius:6px;border:1.5px solid #b9bcd0;background:#fff;display:flex;align-items:center;justify-content:center}
.ef-option.is-on .ef-check{background:var(--brand);border-color:var(--brand)}
.ef-option-title{flex:1 1 auto;min-width:0;font-size:14px;font-weight:600;line-height:1.3;color:var(--ink)}
.ef-tag{flex:none;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px}
.ef-tag--visio{background:#e8f1fb;color:#1d5a96}
.ef-tag--elearning{background:#fdf0e6;color:#9a4a12}

/* Consentements + envoi */
.ef-consents{display:flex;flex-direction:column;gap:10px}
.ef-consent{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.45;color:var(--text);cursor:pointer}
.ef-consent input{width:18px;height:18px;margin:1px 0 0;accent-color:var(--brand);flex:none}
.ef-error{background:#fef2f2;color:#b42318;padding:10px 14px;border-radius:10px;font-size:13px}
.ef-cta{height:52px;width:100%;border:none;border-radius:13px;background:var(--brand);color:#fff !important;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;text-decoration:none;transition:background .15s}
.ef-cta:hover{background:var(--brand-dark)}
.ef-cta:disabled{background:#9ca3af;cursor:not-allowed}
.ef-cta--inline{width:auto;padding:0 28px}
.ef-pill:focus-visible,.ef-option:focus-visible,.ef-cta:focus-visible{outline:3px solid rgba(55,59,148,.35);outline-offset:2px}

/* Confirmation */
.ef-success-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 16px}
.ef-success{width:100%;max-width:560px;background:#fff;border:1px solid var(--line);border-radius:24px;padding:48px 40px;display:flex;flex-direction:column;align-items:center;gap:24px;text-align:center}
.ef-success-icon{width:72px;height:72px;border-radius:999px;background:#e7f6ee;display:flex;align-items:center;justify-content:center}
.ef-success-title{margin:0 0 10px;font-size:28px;font-weight:800;letter-spacing:-.02em}
.ef-success-text{margin:0;font-size:16px;line-height:1.6;color:var(--muted)}
.ef-timeline{list-style:none;margin:0;padding:20px;width:100%;background:#f7f7fc;border-radius:16px;display:flex;flex-direction:column;gap:14px;text-align:left}
.ef-timeline li{display:flex;align-items:center;gap:12px;font-size:14px;color:var(--text)}
.ef-timeline li.ef-muted{color:var(--muted)}
.ef-dot{flex:none;width:24px;height:24px;border-radius:999px;border:2px solid #c4c6d8;color:var(--muted);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
.ef-dot--done{background:var(--brand);border-color:var(--brand);color:#fff}
.ef-dot--next{border-color:var(--brand);color:var(--brand)}
.ef-legal{margin:0;font-size:12px;color:var(--muted)}

/* Responsive */
@media (max-width:980px){
  .ef-layout{flex-direction:column;min-height:0}
  .ef-aside{width:auto;padding:24px 20px;gap:14px}
  .ef-steps,.ef-trust{display:none}
  .ef-h1{font-size:26px}
  .ef-main{padding:20px 16px 40px;align-items:flex-start}
}
@media (max-width:720px){
  .ef-grid{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:480px){
  .ef-row2--stack{grid-template-columns:minmax(0,1fr)}
  .ef-card{padding:18px}
  .ef-h1{font-size:24px}
  .ef-success{padding:36px 22px}
}
`;
