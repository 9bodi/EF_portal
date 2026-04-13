export default function Confidentialite() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ background: "#373b94", padding: "16px 24px", textAlign: "center" }}>
  <a href="/login">
    <img src="/img/LOGO_ELU-FORMATION_BLANC100.png" alt="Élu Formation" style={{ height: 48, objectFit: "contain" }} />
  </a>
</header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#373b94", marginBottom: 32 }}>Politique de confidentialite</h1>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>1. Responsable du traitement</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Le responsable du traitement des donnees est la societe PLACE DE LA REPUBLIQUE (SAS), 1 Avenue Victor Hugo, 27200 Vernon, SIRET 892 385 949 00029. Contact : contact@eluformation.fr.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>2. Donnees collectees</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Dans le cadre de l utilisation de la plateforme, nous collectons les donnees suivantes : nom et prenom, adresse email, numero de telephone (facultatif), code postal, commune (facultatif), type de financement, nom du groupe (facultatif), donnees de progression (statut des modules, temps passe, scores obtenus, dates d acces).
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>3. Finalites du traitement</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Les donnees sont collectees pour : la gestion des comptes utilisateurs et l authentification, le suivi pedagogique et la progression dans la formation, l etablissement de certificats de formation, le respect des obligations legales liees a la formation professionnelle, la communication relative au service (identifiants, reinitialisation de mot de passe).
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>4. Base legale</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Le traitement est fonde sur l execution du contrat de formation liant l utilisateur a PLACE DE LA REPUBLIQUE, ainsi que sur le respect des obligations legales en matiere de formation professionnelle.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>5. Destinataires des donnees</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Les donnees sont accessibles uniquement aux administrateurs de la plateforme Elu Formation. Elles sont hebergees par Supabase Inc. (base de donnees) et Vercel Inc. (hebergement applicatif). Les emails transactionnels sont envoyes via Resend. Aucune donnee n est transmise a des tiers a des fins commerciales.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>6. Duree de conservation</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Les donnees sont conservees pendant la duree de la relation contractuelle et au maximum 3 ans apres la derniere connexion de l utilisateur, sauf obligation legale de conservation plus longue.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>7. Droits des utilisateurs</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Conformement au RGPD, vous disposez des droits suivants : droit d acces, de rectification, d effacement, de limitation du traitement, de portabilite et d opposition. Pour exercer ces droits, adressez votre demande a : contact@eluformation.fr. Vous disposez egalement du droit d introduire une reclamation aupres de la CNIL (www.cnil.fr).
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginTop: 28, marginBottom: 12 }}>8. Securite</h2>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8 }}>
          Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees pour proteger vos donnees : chiffrement des communications (HTTPS/TLS), authentification securisee, controle d acces par role (Row Level Security), mots de passe chiffres.
        </p>

        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 40 }}>Derniere mise a jour : avril 2026</p>
      </main>
      <footer style={{ textAlign: "center", padding: "24px", fontSize: 13, color: "#9ca3af" }}>
        © {new Date().getFullYear()} Elu Formation — Tous droits reserves
      </footer>
    </div>
  );
}
