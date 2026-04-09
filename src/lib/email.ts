@'
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FOOTER = `
  <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">Equipe Elu Formation</p>
    <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">contact@eluformation.fr</p>
  </div>
`;

function emailHeader(): string {
  return `<div style="background-color: #373b94; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px;">ELU FORMATION</h1>
  </div>`;
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  tempPassword: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await resend.emails.send({
    from: "Elu Formation <noreply@eluformation.fr>",
    to,
    subject: "Bienvenue sur Elu Formation - Vos identifiants",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${emailHeader()}
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1f2937;">Bonjour ${firstName},</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            Votre espace de formation en ligne a ete cree. Voici vos identifiants de connexion :
          </p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Email :</strong> ${to}</p>
            <p style="margin: 0; font-size: 14px; color: #4b5563;"><strong>Mot de passe temporaire :</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 15px;">${tempPassword}</code></p>
          </div>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            Lors de votre premiere connexion, vous serez invite a choisir un nouveau mot de passe.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/login" style="background-color: #373b94; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              Acceder a ma formation
            </a>
          </div>
          ${FOOTER}
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("[EMAIL] Erreur envoi:", error);
    return false;
  }
  console.log("[EMAIL] Bienvenue envoye a", to);
  return true;
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetLink: string
) {
  const { error } = await resend.emails.send({
    from: "Elu Formation <noreply@eluformation.fr>",
    to,
    subject: "Elu Formation - Reinitialisation de votre mot de passe",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${emailHeader()}
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1f2937;">Bonjour ${firstName},</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #373b94; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              Reinitialiser mon mot de passe
            </a>
          </div>
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.6;">
            Si vous n'avez pas fait cette demande, ignorez cet email. Ce lien expire dans 1 heure.
          </p>
          ${FOOTER}
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("[EMAIL] Erreur envoi reset:", error);
    return false;
  }
  console.log("[EMAIL] Reset envoye a", to);
  return true;
}
'@ | Out-File -Encoding utf8 -LiteralPath "src/lib/email.ts"
