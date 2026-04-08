"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/first-login`,
    });

    if (resetError) {
      setError("Une erreur est survenue. Vérifiez votre adresse email.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#373b94", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <Image
          src="/img/LOGO_ELU-FORMATION_BLANC100.png"
          alt="Élu Formation"
          width={220}
          height={72}
          style={{ objectFit: "contain" }}
          priority
        />
        <p style={{ color: "rgba(255,255,255,0.55)", marginTop: 12, fontSize: 15 }}>
          Réinitialisation du mot de passe
        </p>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: "40px 40px", width: "100%", maxWidth: 420 }}>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#373b94", marginBottom: 12 }}>
              Email envoyé !
            </h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 8 }}>
              Si un compte existe avec l&apos;adresse <strong>{email}</strong>,
              vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>
            <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 32 }}>
              Pensez à vérifier vos spams.
            </p>
            <a
              href="/login"
              style={{ display: "inline-block", background: "#373b94", color: "#fff", padding: "12px 28px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600 }}
            >
              Retour à la connexion
            </a>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#373b94", marginBottom: 8, textAlign: "center" }}>
              Mot de passe oublié ?
            </h2>
            <p style={{ color: "#6b7280", textAlign: "center", fontSize: 14, marginBottom: 32 }}>
              Entrez votre adresse email et nous vous enverrons un lien pour créer un nouveau mot de passe.
            </p>

            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label htmlFor="email" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "2px solid #e5e7eb", borderRadius: 10, outline: "none", boxSizing: "border-box" }}
                  placeholder="votre@email.fr"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 10, fontSize: 14 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ background: "#373b94", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <a href="/login" style={{ color: "#373b94", fontSize: 14, textDecoration: "underline" }}>
                Retour à la connexion
              </a>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
        <p>Besoin d&apos;aide ? Contactez-nous</p>
        <p style={{ marginTop: 4, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
          contact@eluformation.fr
        </p>
      </div>
    </div>
  );
}

