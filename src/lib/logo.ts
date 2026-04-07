import fs from "fs";
import path from "path";

let logoBase64Cache: string | null = null;

export function getLogoBase64(): string {
  if (logoBase64Cache) return logoBase64Cache;
  try {
    const logoPath = path.join(process.cwd(), "public", "img", "LOGO_ELU-FORMATION_RVB.png");
    const buffer = fs.readFileSync(logoPath);
    logoBase64Cache = buffer.toString("base64");
    return logoBase64Cache;
  } catch {
    return "";
  }
}

export function getLogoDataUri(): string {
  const b64 = getLogoBase64();
  return b64 ? "data:image/png;base64," + b64 : "";
}
