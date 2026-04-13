"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function FirstLoginPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cguAccepted, setCguAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!cguAccepted) {
      setError("Vous devez accepter les conditions générales d'utilisation.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ must_change_password: false }).eq("id", user.id);
    }

    router.push("/formation");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#373b94", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px", fontFamily: "'DM Sans', sans-serif" }}>

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
          Bienvenue !
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: "40px 40px", width: "100%", maxWidth: 420 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#373b94", marginBottom: 8, textAlign: "center" }}>
          Créez votre mot de passe
        </h2>
        <p style={{ color: "#6b7280", textAlign: "center", fontSize: 14, marginBottom: 32 }}>
          Pour commencer, choisissez un mot de passe personnel que vous retiendrez facilement.
        </p>

        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label htmlFor="password" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "2px solid #e5e7eb", borderRadius: 10, outline: "none", boxSizing: "border-box", color: "#1f2937", backgroundColor: "#fff" }}
              placeholder="Minimum 8 caractères"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "2px solid #e5e7eb", borderRadius: 10, outline: "none", boxSizing: "border-box", color: "#1f2937", backgroundColor: "#fff" }}
              placeholder="Retapez votre mot de passe"
              required
              autoComplete="new-password"
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <input
              id="cgu"
              type="checkbox"
              checked={cguAccepted}
              onChange={(e) => setCguAccepted(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: "#373b94", cursor: "pointer", flexShrink: 0 }}
            />
            <label htmlFor="cgu" style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5, cursor: "pointer" }}>
              J&apos;accepte les{" "}
              <a href="/cgu" target="_blank" style={{ color: "#373b94", textDecoration: "underline", fontWeight: 500 }}>
                conditions générales d&apos;utilisation
              </a>
              {" "}et la{" "}
              <a href="/confidentialite" target="_blank" style={{ color: "#373b94", textDecoration: "underline", fontWeight: 500 }}>
                politique de confidentialité
              </a>
            </label>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 10, fontSize: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !cguAccepted}
            style={{ background: "#373b94", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 600, cursor: (loading || !cguAccepted) ? "not-allowed" : "pointer", opacity: (loading || !cguAccepted) ? 0.6 : 1, marginTop: 4 }}
          >
            {loading ? "En cours..." : "Commencer ma formation"}
          </button>
        </form>
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
