"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError("Email ou mot de passe incorrect"); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Erreur de connexion"); setLoading(false); return; }
    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (profile?.must_change_password) { router.push("/first-login"); }
    else if (profile?.role === "admin") { router.push("/admin"); }
    else { router.push("/formation"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1f3d] to-[#1a3a6b]">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-[#0f1f3d] mb-2">Elu Formation</h1>
        <p className="text-center text-gray-500 mb-8">Connectez-vous a votre espace</p>
        <form onSubmit={handleLogin} className="space-y-5">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f1f3d] outline-none text-gray-800" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f1f3d] outline-none text-gray-800" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#0f1f3d] text-white rounded-lg font-semibold hover:bg-[#1a3a6b] transition disabled:opacity-50">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="text-center text-gray-400 text-sm mt-6">Support : contact@eluformation.fr</p>
      </div>
    </div>
  );
}
