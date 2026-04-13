export default function MentionsLegales() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ background: "#373b94", padding: "16px 24px", textAlign: "center" }}>
  <a href="/login">
    <img src="/img/LOGO_ELU-FORMATION_BLANC100.png" alt="Élu Formation" style={{ height: 48, objectFit: "contain" }} />
  </a>
</header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#373b94", marginBottom: 32 }}>Mentions legales</h1>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>Editeur du site</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          <strong>PLACE DE LA REPUBLIQUE</strong> (nom commercial : Elu Formation)<br/>
          Societe par actions simplifiee (SAS)<br/>
          Capital social : 30 000,00 EUR<br/>
          SIRET : 892 385 949 00029<br/>
          Code APE : 8559A — Formation continue d adultes<br/>
          Siege social : 1 Avenue Victor Hugo, 27200 Vernon<br/>
          President : EUREKA CONCEPT INNOVATION<br/>
          Email : contact@eluformation.fr
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>Hebergement</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          <strong>Vercel Inc.</strong><br/>
          440 N Barranca Ave #4133, Covina, CA 91723, USA<br/>
          https://vercel.com
        </p>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Base de donnees hebergee par <strong>Supabase Inc.</strong><br/>
          970 Toa Payoh North #07-04, Singapore 318992<br/>
          https://supabase.com
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>Propriete intellectuelle</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          La marque Elu Formation est enregistree et en vigueur (depot du 19 juin 2022, expiration le 19 juin 2032).
          L ensemble des contenus (textes, images, videos, modules de formation) presents sur ce site sont proteges par le droit d auteur et sont la propriete exclusive de PLACE DE LA REPUBLIQUE ou de ses partenaires. Toute reproduction, meme partielle, est interdite sans autorisation prealable ecrite.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>Contact</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Pour toute question : <a href="mailto:contact@eluformation.fr" style={{ color: "#373b94" }}>contact@eluformation.fr</a>
        </p>
      </main>
      <footer style={{ textAlign: "center", padding: "24px", fontSize: 13, color: "#9ca3af" }}>
        © {new Date().getFullYear()} Elu Formation — Tous droits reserves
      </footer>
    </div>
  );
}
