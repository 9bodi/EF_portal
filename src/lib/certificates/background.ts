let cache: string | null = null;

/** Serveur (route d'envoi). origin = new URL(req.url).origin */
export async function getBackground(origin: string): Promise<string> {
  if (cache) return cache;
  const res = await fetch(`${origin}/img/certificat-fond.png`);
  if (!res.ok) throw new Error("Fond du certificat introuvable dans /public/img");
  const buf = Buffer.from(await res.arrayBuffer());
  cache = `data:image/png;base64,${buf.toString("base64")}`;
  return cache;
}

/** Client (téléchargement depuis CertificatesPanel) */
export async function getBackgroundClient(): Promise<string> {
  const res = await fetch("/img/certificat-fond.png");
  if (!res.ok) throw new Error("Fond du certificat introuvable");
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("Lecture du fond impossible"));
    fr.readAsDataURL(blob);
  });
}
