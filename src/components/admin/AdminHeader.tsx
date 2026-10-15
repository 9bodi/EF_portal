import Image from "next/image";

export default function AdminHeader({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <header style={{ background: "#373b94", padding: "14px 24px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Image src="/img/LOGO_ELU-FORMATION_BLANC100.png" alt="Élu Formation" width={160} height={52} style={{ objectFit: "contain" }} priority />
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 99, marginBottom: 4 }}>
          ADMIN
        </span>
        <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 }}>{firstName} {lastName}</p>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16 }}>
        <a href="/formation" style={{ color: "#9aa5b8", fontSize: 13, textDecoration: "none" }}>Voir comme apprenant</a>
        <a href="/api/auth/logout" style={{ color: "#9aa5b8", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "7px 14px", background: "transparent", cursor: "pointer", fontSize: 13, textDecoration: "none" }}>
          Déconnexion
        </a>
      </div>
    </header>
  );
}
