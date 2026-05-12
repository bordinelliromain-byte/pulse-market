import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whatmarket — Découvrez les marchés locaux près de chez vous",
  description: "Trouvez les marchés, producteurs et artisans autour de vous. Whatmarket répertorie tous les marchés locaux en France avec horaires, exposants et itinéraires.",
  keywords: [
    "marché local",
    "marché près de moi",
    "marché producteurs",
    "marché artisanat",
    "brocante près de moi",
    "marché forain",
    "marchés PACA",
    "Whatmarket",
    "marché du terroir"
  ],
  metadataBase: new URL("https://whatmarket.fr"),
  alternates: {
    canonical: "https://whatmarket.fr",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://whatmarket.fr",
    siteName: "Whatmarket",
    title: "Whatmarket — Découvrez les marchés locaux près de chez vous",
    description: "Trouvez les marchés, producteurs et artisans autour de vous. Géolocalisation, horaires et itinéraires.",
    images: [
      {
        url: "/og-whatmarket.png",
        width: 1200,
        height: 630,
        alt: "Whatmarket — Les marchés locaux près de chez vous",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Whatmarket — Découvrez les marchés locaux",
    description: "Trouvez les marchés, producteurs et artisans autour de vous.",
    images: ["/og-whatmarket.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon-whatmarket.svg", type: "image/svg+xml" }],
    apple: "/icon-whatmarket.svg",
    shortcut: "/icon-whatmarket.svg",
  },
};

export default function WhatmarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Schema.org — Application mobile/web B2C */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Whatmarket",
            "url": "https://whatmarket.fr",
            "description": "Découvrez les marchés locaux, producteurs et artisans près de chez vous. Géolocalisation, itinéraires et bons plans.",
            "applicationCategory": "LifestyleApplication",
            "operatingSystem": "Web, iOS, Android",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR"
            },
            "publisher": {
              "@type": "Organization",
              "name": "PulseMarket",
              "url": "https://pulse-market.fr"
            },
            "featureList": [
              "Géolocalisation des marchés",
              "Itinéraires Google Maps",
              "Exposants et producteurs locaux",
              "Bons plans commerçants",
              "Alertes marchés près de vous"
            ]
          })
        }}
      />
      {children}
    </>
  );
}