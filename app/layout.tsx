import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "Dashboard COCO — Coralie de Almeida",
  description: "CRM de prospection pour graphiste/DA spécialisée secteur animalier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${bricolage.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
