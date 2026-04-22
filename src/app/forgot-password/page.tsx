"use client";

import { useState } from "react";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#373b94", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px", fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <Image
          src="/img/LOGO_ELU-FORMATION_BLANC100.png"
          alt="Élu Formation"
          width={220}
          height={72}
          style={{ objectFit: "contain", height: "auto" }}
          priority
        />
      </div>

      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: "40px 40px", width: "100%", maxWidth: 420 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#373b94", marginBottom: 8, textAlign: "center" }}>
          Mot de passe oublié
        </h2>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6b7280", marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>
              Si un compte existe avec cette adresse, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
            </p>
            <a href="/login" style={{ display: "inline-block", marginTop: 24, color: "#373b94", fontSize: 14, fontWeight: 600, textDecoration: "underline" }}>
              Retour à la connexion
            </a>
          </div>
        ) : (
          <>
            <p style={{ color: "#6b7280", textAlign: "center", fontSize: 14, marginBottom: 32 }}>
              Entrez votre adresse email pour recevoir un lien de réinitialisation
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label htmlFor="email" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "2px solid #e5e7eb", borderRadius: 10, outline: "none", boxSizing: "border-box", color: "#1f2937", backgroundColor: "#fff" }}
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
                style={{ background: "#373b94", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, marginTop: 4 }}
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
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

      <div style={{ marginTop: 32, textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
        <p>Besoin d&apos;aide ? Contactez-nous</p>
        <p style={{ marginTop: 4, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
          contact@eluformation.fr
        </p>
      </div>
    </div>
  );
}
