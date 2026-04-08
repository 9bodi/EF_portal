"use client";
import { useState } from "react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#373b94] to-[#4a4fbf]">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-[#373b94] mb-2">Mot de passe oublie</h1>

        {sent ? (
          <div className="text-center">
            <p className="text-gray-600 mt-4">Si un compte existe avec cette adresse, vous recevrez un email avec les instructions pour reinitialiser votre mot de passe.</p>
            <a href="/login" className="inline-block mt-6 text-sm text-[#373b94] font-medium hover:underline">Retour a la connexion</a>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-500 mb-8">Entrez votre adresse email pour recevoir un lien de reinitialisation</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#373b94] outline-none text-gray-800"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#373b94] text-white rounded-lg font-semibold hover:bg-[#4a4fbf] transition disabled:opacity-50">
                {loading ? "Envoi..." : "Envoyer"}
              </button>
            </form>
            <a href="/login" className="block text-center text-sm text-gray-400 mt-6 hover:text-gray-600">Retour a la connexion</a>
          </>
        )}
      </div>
    </div>
  );
}

