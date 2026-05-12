import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CrispChat from '@/components/CrispChat'
import SessionGuard from '@/components/SessionGuard'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PulseMarket — Gestion numérique des marchés municipaux",
    template: "%s | PulseMarket",
  },
  description: "PulseMarket numérise la gestion des marchés municipaux : AOT en ligne, vérification des dossiers exposants, paiement des redevances. Gratuit pour les mairies.",
  keywords: [
    "gestion marché municipal",
    "numérisation marché",
    "AOT en ligne",
    "dossier exposant",
    "marché forain numérique",
    "placier digital",
    "redevance marché",
    "logiciel mairie marché",
    "PulseMarket",
  ],
  authors: [{ name: "PulseMarket", url: "https://pulse-market.fr" }],
  creator: "PulseMarket",
  publisher: "PulseMarket",
  metadataBase: new URL("https://pulse-market.fr"),
  alternates: { canonical: "https://pulse-market.fr" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://pulse-market.fr",
    siteName: "PulseMarket",
    title: "PulseMarket — Gestion numérique des marchés municipaux",
    description: "Numérisez la gestion de vos marchés municipaux. AOT en ligne, vérification des dossiers exposants, paiement des redevances. Gratuit pour démarrer.",
    images: [
      {
        url: "/og-pulsemarket.png",
        width: 1200,
        height: 630,
        alt: "PulseMarket — La numérisation des marchés du terroir français",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PulseMarket — Gestion numérique des marchés municipaux",
    description: "Numérisez la gestion de vos marchés municipaux. AOT en ligne, vérification des dossiers exposants, paiement des redevances.",
    images: ["/og-pulsemarket.png"],
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
    icon: [{ url: "/icon-pulsemarket.svg", type: "image/svg+xml" }],
    apple: "/icon-pulsemarket.svg",
    shortcut: "/icon-pulsemarket.svg",
  },
  verification: {
    google: "eq9VWw_CR3zRnp0hHayPSmnY11ln_RtdKO1pZRv8Xfo",
  },
};

const schemaOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "PulseMarket",
  "url": "https://pulse-market.fr",
  "logo": "https://pulse-market.fr/icon-pulsemarket.svg",
  "description": "Plateforme SaaS de numérisation des marchés municipaux français.",
  "foundingDate": "2026",
  "areaServed": "FR",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "contact@pulse-market.fr",
    "contactType": "customer service",
    "availableLanguage": "French",
  },
  "sameAs": [
    "https://whatmarket.fr",
  ],
};

const schemaSoftware = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PulseMarket",
  "url": "https://pulse-market.fr",
  "description": "Logiciel SaaS de gestion des marchés municipaux. AOT en ligne, vérification exposants, paiement redevances.",
  "applicationCategory": "BusinessApplication",
  "applicationSubCategory": "MunicipalManagement",
  "operatingSystem": "Web",
  "browserRequirements": "Requires JavaScript",
  "inLanguage": "fr-FR",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR",
    "description": "Gratuit pour démarrer — offre Administration à 150€/mois",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "12",
    "bestRating": "5",
  },
  "publisher": {
    "@type": "Organization",
    "name": "PulseMarket",
    "url": "https://pulse-market.fr",
  },
  "featureList": [
    "Gestion des AOT en ligne",
    "Vérification automatique dossiers exposants",
    "Paiement redevances via Stripe",
    "Attribution emplacements drag & drop",
    "Certification SIREN INSEE",
    "QR Code placier terrain",
    "Export comptable CSV/PDF",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/icon-pulsemarket.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-pulsemarket.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaSoftware) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <CrispChat />
        <SessionGuard />
      </body>
    </html>
  );
}