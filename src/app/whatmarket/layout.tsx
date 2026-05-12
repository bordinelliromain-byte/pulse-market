import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Whatmarket — Marchés locaux près de chez vous",
    template: "%s | Whatmarket",
  },
  description: "Trouvez les marchés, producteurs et artisans autour de vous. Horaires, itinéraires et bons plans en temps réel.",
  keywords: [
    "marché local",
    "marché près de moi",
    "marché producteurs",
    "brocante près de moi",
    "marché forain",
    "marchés PACA",
    "Whatmarket",
  ],
  metadataBase: new URL("https://whatmarket.fr"),
  alternates: { canonical: "https://whatmarket.fr" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://whatmarket.fr",
    siteName: "Whatmarket",
    title: "Whatmarket — Marchés locaux près de chez vous",
    description: "Trouvez les marchés, producteurs et artisans autour de vous. Horaires, itinéraires et bons plans.",
    images: [{ url: "/og-whatmarket.png", width: 1200, height: 630, alt: "Whatmarket — Les marchés locaux près de chez vous" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Whatmarket — Marchés locaux près de chez vous",
    description: "Trouvez les marchés, producteurs et artisans autour de vous.",
    images: ["/og-whatmarket.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon-whatmarket.svg", type: "image/svg+xml" }],
    apple: "/icon-whatmarket.svg",
  },
};

export default function WhatmarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}