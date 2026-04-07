import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  tempPassword: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await resend.emails.send({
    from: "Elu Formation <onboarding@resend.dev>",
    to,
    subject: "Bienvenue sur Elu Formation - Vos identifiants",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0f1f3d; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Elu Formation</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1f2937;">Bonjour ${firstName},</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            Votre compte de formation a ete cree. Voici vos identifiants de connexion :
          </p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Email :</strong> ${to}</p>
            <p style="margin: 0; font-size: 14px; color: #4b5563;"><strong>Mot de passe temporaire :</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 15px;">${tempPassword}</code></p>
          </div>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            Lors de votre premiere connexion, vous serez invite a choisir un nouveau mot de passe.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/login" style="background-color: #0f1f3d; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Acceder a ma formation
            </a>
          </div>
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
            Support : contact@eluformation.fr
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("[EMAIL] Erreur envoi:", error);
    return false;
  }
  console.log("[EMAIL] Envoye a", to);
  return true;
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetLink: string
) {
  const { error } = await resend.emails.send({
    from: "Elu Formation <onboarding@resend.dev>",
    to,
    subject: "Elu Formation - Reinitialisation de votre mot de passe",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0f1f3d; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Elu Formation</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1f2937;">Bonjour ${firstName},</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #0f1f3d; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Reinitialiser mon mot de passe
            </a>
          </div>
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.6;">
            Si vous n'avez pas fait cette demande, ignorez cet email. Ce lien expire dans 1 heure.
          </p>
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
            Support : contact@eluformation.fr
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("[EMAIL] Erreur envoi reset:", error);
    return false;
  }
  return true;
}
