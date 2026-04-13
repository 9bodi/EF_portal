"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Email ou mot de passe incorrect. Vérifiez vos informations ou contactez-nous.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("must_change_password, role")
        .eq("id", user.id)
        .single();

      if (profile?.must_change_password) {
        router.push("/first-login");
        return;
      }
      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/formation");
      }
    }
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
          Votre espace de formation
        </p>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: "40px 40px", width: "100%", maxWidth: 420 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#373b94", marginBottom: 32, textAlign: "center" }}>
          Connexion
        </h2>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label htmlFor="email" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "2px solid #e5e7eb", borderRadius: 10, outline: "none", boxSizing: "border-box", color: "#1f2937", backgroundColor: "#fff" }}
              placeholder="votre@email.fr"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", fontSize: 15, border: "2px solid #e5e7eb", borderRadius: 10, outline: "none", boxSizing: "border-box", color: "#1f2937", backgroundColor: "#fff" }}
              placeholder="Votre mot de passe"
              required
              autoComplete="current-password"
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
            {loading ? "Connexion en cours..." : "Accéder à ma formation"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <a href="/reset-password" style={{ color: "#373b94", fontSize: 14, textDecoration: "underline" }}>
            Mot de passe oublié ?
          </a>
        </div>
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

