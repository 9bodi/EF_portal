import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Élu Formation - Espace de formation",
  description: "Plateforme de formation pour les élus locaux",
  icons: {
    icon: "/img/LOGO_ELU-FORMATION_favicon.png",
    shortcut: "/img/LOGO_ELU-FORMATION_favicon.png",
    apple: "/img/LOGO_ELU-FORMATION_favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full m-0 p-0">{children}</body>
    </html>
  );
}
