export default function CGU() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ background: "#373b94", padding: "16px 24px", textAlign: "center" }}>
  <a href="/login">
    <img src="/img/LOGO_ELU-FORMATION_BLANC100.png" alt="Élu Formation" style={{ height: 48, objectFit: "contain" }} />
  </a>
</header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#373b94", marginBottom: 32 }}>Conditions generales d utilisation</h1>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>1. Objet</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Les presentes Conditions Generales d Utilisation (CGU) regissent l acces et l utilisation de la plateforme de formation en ligne Elu Formation, editee par la societe PLACE DE LA REPUBLIQUE (SAS), accessible a l adresse campus.eluformation.fr.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>2. Acces a la plateforme</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          L acces a la plateforme est reserve aux utilisateurs disposant d un compte cree par l administrateur. Chaque utilisateur recoit un identifiant (adresse email) et un mot de passe temporaire qu il doit modifier lors de sa premiere connexion. L utilisateur s engage a ne pas communiquer ses identifiants a des tiers.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>3. Utilisation du service</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          La plateforme permet aux elus locaux d acceder a des modules de formation en ligne. L utilisateur s engage a utiliser le service conformement a sa destination et a ne pas tenter d acceder a des donnees qui ne lui sont pas destinees. Toute utilisation abusive ou frauduleuse pourra entrainer la suspension ou la suppression du compte.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>4. Propriete intellectuelle</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          L ensemble des contenus de formation (textes, videos, images, modules interactifs) sont proteges par le droit de la propriete intellectuelle. Ils sont la propriete exclusive de PLACE DE LA REPUBLIQUE ou de ses partenaires. Toute reproduction, diffusion ou exploitation, meme partielle, sans autorisation ecrite prealable, est strictement interdite.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>5. Donnees personnelles</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Les donnees personnelles collectees (nom, prenom, email, code postal, progression de formation) sont necessaires au fonctionnement du service et au suivi pedagogique. Elles sont traitees conformement a notre <a href="/confidentialite" style={{ color: "#373b94" }}>Politique de confidentialite</a> et au Reglement General sur la Protection des Donnees (RGPD).
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>6. Responsabilite</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          PLACE DE LA REPUBLIQUE met tout en oeuvre pour assurer la disponibilite de la plateforme mais ne saurait etre tenue responsable en cas d interruption temporaire du service pour des raisons techniques, de maintenance ou de force majeure. Les contenus de formation sont fournis a titre informatif et pedagogique.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>7. Modification des CGU</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          PLACE DE LA REPUBLIQUE se reserve le droit de modifier les presentes CGU a tout moment. Les utilisateurs seront informes de toute modification substantielle. L utilisation continue de la plateforme apres modification vaut acceptation des nouvelles conditions.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>8. Droit applicable</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Les presentes CGU sont soumises au droit francais. En cas de litige, les tribunaux competents seront ceux du ressort du siege social de la societe, apres tentative de resolution amiable.
        </p>

        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 40 }}>Derniere mise a jour : avril 2026</p>
      </main>
      <footer style={{ textAlign: "center", padding: "24px", fontSize: 13, color: "#9ca3af" }}>
        © {new Date().getFullYear()} Elu Formation — Tous droits reserves
      </footer>
    </div>
  );
}
