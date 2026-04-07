"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Erreur : " + updateError.message);
      setLoading(false);
      return;
    }

    router.push("/login?reset=success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1f3d] to-[#1a3a6b]">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-[#0f1f3d] mb-2">Nouveau mot de passe</h1>
        <p className="text-center text-gray-500 mb-8">Choisissez votre nouveau mot de passe</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f1f3d] outline-none text-gray-800"
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 8 caracteres</p>
          </div>
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f1f3d] outline-none text-gray-800"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#0f1f3d] text-white rounded-lg font-semibold hover:bg-[#1a3a6b] transition disabled:opacity-50">
            {loading ? "Enregistrement..." : "Valider"}
          </button>
        </form>
      </div>
    </div>
  );
}
