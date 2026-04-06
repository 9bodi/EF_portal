import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elu Formation - Espace de formation",
  description: "Plateforme de formation pour les elus locaux",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full m-0 p-0">{children}</body>
    </html>
  );
}
