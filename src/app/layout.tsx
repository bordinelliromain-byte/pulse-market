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
  // ✅ Title élargi avec mot-clé "logiciel" en tête
  title: {
    default: "PulseMarket — Logiciel français de gestion des marchés municipaux",
    template: "%s | PulseMarket",
  },
  // ✅ Description optimisée 155 caractères (limite Google)
  description: "Logiciel français pour digitaliser vos marchés municipaux : AOT en ligne, validation automatique des dossiers, QR code placier. Conforme CGPPP et RGPD.",
  // ✅ Keywords étendus avec longue traîne
  keywords: [
    // Mots-clés primaires
    "logiciel marché municipal",
    "gestion marché municipal",
    "logiciel mairie marché",
    "plateforme marché municipal",
    // AOT
    "AOT en ligne",
    "autorisation occupation temporaire",
    "AOT mairie",
    "AOT conforme CGPPP",
    // Métiers
    "logiciel placier",
    "logiciel placier mairie",
    "QR code AOT",
    "scanner AOT placier",
    // Cibles
    "digitalisation marché forain",
    "numérisation marché communal",
    "marché forain digital",
    "logiciel comité des fêtes",
    // Concurrents (longue traîne)
    "alternative Berger-Levrault marché",
    "alternative Cegid marché",
    // Géo
    "logiciel mairie France",
    "GovTech France",
    "SaaS collectivité territoriale",
    // Pratique
    "redevance occupation domaine public",
    "gestion exposants marché",
    "vérification SIREN mairie",
    "PulseMarket",
    "Rupture Agency",
  ],
  authors: [{ name: "PulseMarket SAS", url: "https://pulse-market.fr" }],
  creator: "PulseMarket SAS",
  publisher: "PulseMarket SAS",
  metadataBase: new URL("https://pulse-market.fr"),
  alternates: {
    canonical: "https://pulse-market.fr",
    languages: { "fr-FR": "https://pulse-market.fr" },
  },
  // ✅ Catégorie business
  category: "Business Software",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://pulse-market.fr",
    siteName: "PulseMarket",
    title: "PulseMarket — La GovTech française des marchés municipaux",
    description: "Digitalisez vos marchés municipaux en 7 jours. AOT auto, QR code placier, encaissement Stripe. Conforme CGPPP et RGPD. Hébergement 100% France.",
    images: [
      {
        url: "/og-pulsemarket.png",
        width: 1200,
        height: 630,
        alt: "PulseMarket — La numérisation des marchés du terroir français",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PulseMarket — Logiciel marchés municipaux",
    description: "Plateforme française. AOT auto. QR code placier. Conforme CGPPP. Hébergé en France.",
    images: ["/og-pulsemarket.png"],
    creator: "@pulsemarket_fr",
    site: "@pulsemarket_fr",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
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
  // ✅ Données structurées additionnelles
  applicationName: "PulseMarket",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

// ═══════════════════════════════════════════════════════════
// ✅ SCHEMA.ORG — Données structurées enrichies
// ═══════════════════════════════════════════════════════════

// 1. Organisation (avec SIREN, adresse, fondateur)
const schemaOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://pulse-market.fr/#organization",
  "name": "PulseMarket",
  "legalName": "PulseMarket SAS",
  "alternateName": "Rupture Agency",
  "url": "https://pulse-market.fr",
  "logo": {
    "@type": "ImageObject",
    "url": "https://pulse-market.fr/icon-pulsemarket.svg",
    "width": "512",
    "height": "512",
  },
  "image": "https://pulse-market.fr/og-pulsemarket.png",
  "description": "Éditeur français de la plateforme SaaS PulseMarket — logiciel de gestion des marchés municipaux. Conforme CGPPP et RGPD.",
  "foundingDate": "2026-05-23",
  "founder": {
    "@type": "Person",
    "name": "Romain Villeprat",
    "jobTitle": "Fondateur & Président",
  },
  // ✅ Identifiants légaux (boost crédibilité Google)
  "identifier": "105506554",
  "vatID": "FR8302105506554",
  "naics": "541512",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "661 Carreirade des Adrets",
    "postalCode": "83640",
    "addressLocality": "Plan-d'Aups-Sainte-Baume",
    "addressRegion": "Provence-Alpes-Côte d'Azur",
    "addressCountry": "FR",
  },
  "areaServed": [
    { "@type": "Country", "name": "France" },
    { "@type": "AdministrativeArea", "name": "Provence-Alpes-Côte d'Azur" },
  ],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "email": "contact@pulse-market.fr",
      "contactType": "customer service",
      "areaServed": "FR",
      "availableLanguage": ["French"],
    },
    {
      "@type": "ContactPoint",
      "email": "contact@pulse-market.fr",
      "contactType": "sales",
      "areaServed": "FR",
      "availableLanguage": ["French"],
    },
  ],
  "sameAs": [
    "https://whatmarket.fr",
  ],
  "knowsAbout": [
    "Gestion des marchés municipaux",
    "Autorisation d'occupation temporaire",
    "Code Général de la Propriété des Personnes Publiques",
    "Digitalisation des collectivités territoriales",
  ],
};

// 2. Application logicielle (avec features et offres détaillées)
const schemaSoftware = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://pulse-market.fr/#software",
  "name": "PulseMarket",
  "url": "https://pulse-market.fr",
  "description": "Logiciel SaaS français de gestion des marchés municipaux. AOT auto-générée, vérification SIREN INSEE, QR code placier, encaissement Stripe. Conforme CGPPP article L. 2122-1.",
  "applicationCategory": "BusinessApplication",
  "applicationSubCategory": "MunicipalManagement",
  "operatingSystem": "Web, iOS, Android",
  "browserRequirements": "Requires JavaScript. Modern browser (Chrome, Safari, Firefox, Edge).",
  "softwareVersion": "1.0",
  "datePublished": "2026-06-19",
  "inLanguage": "fr-FR",
  "isAccessibleForFree": true,
  "screenshot": "https://pulse-market.fr/og-pulsemarket.png",
  // ✅ Offre avec gamme tarifaire (Google adore)
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "0",
    "highPrice": "1200",
    "offerCount": "3",
    "description": "Gratuit pour les exposants. Tarif sur devis pour les administrations selon la taille de la commune.",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "12",
    "bestRating": "5",
    "worstRating": "1",
  },
  "publisher": {
    "@id": "https://pulse-market.fr/#organization",
  },
  "creator": {
    "@id": "https://pulse-market.fr/#organization",
  },
  "featureList": [
    "Génération automatique des AOT au format arrêté municipal",
    "QR code de contrôle unique par autorisation",
    "Vérification automatique des dossiers exposants",
    "Certification SIREN via API INSEE",
    "OCR documents Kbis et RC Pro",
    "Encaissement redevances via Stripe",
    "Attribution emplacements en drag & drop",
    "Tableau de bord temps réel",
    "Export comptable CSV/PDF",
    "Application mobile placier",
    "Notification email automatique",
    "Conforme RGPD et hébergement France",
  ],
  "softwareHelp": {
    "@type": "CreativeWork",
    "url": "https://pulse-market.fr/#faq",
  },
};

// 3. Site web (boost SEO + search box dans Google)
const schemaWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://pulse-market.fr/#website",
  "url": "https://pulse-market.fr",
  "name": "PulseMarket",
  "description": "Logiciel français de gestion des marchés municipaux",
  "publisher": {
    "@id": "https://pulse-market.fr/#organization",
  },
  "inLanguage": "fr-FR",
  "copyrightYear": "2026",
  "copyrightHolder": {
    "@id": "https://pulse-market.fr/#organization",
  },
};

// 4. FAQ (apparition riche dans Google = clic +30%)
const schemaFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://pulse-market.fr/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Mes données sont-elles hébergées en France ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui. PulseMarket héberge l'ensemble des données sur des serveurs situés en Union européenne (France et Irlande). Nous sommes 100% conformes au RGPD et nous fournissons un Accord de Traitement des Données (DPA) en annexe de tous nos contrats.",
      },
    },
    {
      "@type": "Question",
      "name": "Les AOT générées sont-elles juridiquement valables ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui. Chaque AOT générée par PulseMarket respecte les articles L. 2122-1 et suivants du Code Général de la Propriété des Personnes Publiques (CGPPP), ainsi que l'article L. 2212-2 du CGCT relatif aux pouvoirs de police du maire.",
      },
    },
    {
      "@type": "Question",
      "name": "Nous avons déjà un logiciel comptable (Berger-Levrault, Cegid). PulseMarket peut-il s'y intégrer ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolument. PulseMarket ne remplace pas votre logiciel de gestion comptable. Notre solution se concentre exclusivement sur la gestion opérationnelle des marchés. Nous exportons automatiquement les données financières au format CSV/PDF compatibles avec votre logiciel comptable.",
      },
    },
    {
      "@type": "Question",
      "name": "Combien de temps prend la mise en place ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Entre 7 et 15 jours en moyenne. Nous prenons en charge la configuration du compte mairie, le paramétrage des marchés, la formation des équipes (1h30) et l'accompagnement lors du premier marché digital.",
      },
    },
    {
      "@type": "Question",
      "name": "Combien coûte PulseMarket pour une mairie ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le tarif est sur devis et adapté à la taille de la commune et au nombre de marchés. Les forfaits démarrent à 150€/mois pour les petites communes et peuvent aller jusqu'à 1200€/mois pour les grandes villes. Aucun engagement de durée minimum.",
      },
    },
    {
      "@type": "Question",
      "name": "Comment fonctionne le contrôle des exposants sur le terrain ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le placier scanne le QR code présent sur l'autorisation d'occupation (AOT) de chaque exposant avec son téléphone. En 1 seconde, il sait si l'exposant est en règle : son emplacement, son activité, et la validité de son autorisation.",
      },
    },
  ],
};

// 5. Breadcrumb (pour les pages internes)
const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Accueil",
      "item": "https://pulse-market.fr",
    },
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

        {/* ✅ Preconnect pour performance (boost Google PageSpeed) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ✅ DNS prefetch pour Supabase + Stripe + Resend */}
        <link rel="dns-prefetch" href="https://dsifomufsayshvgtlnju.supabase.co" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://api.resend.com" />

        {/* ✅ Theme color (mobile address bar) */}
        <meta name="theme-color" content="#4F46E5" />
        <meta name="msapplication-TileColor" content="#4F46E5" />

        {/* ✅ Viewport renforcé */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* ✅ Schema.org — 5 entités structurées */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaSoftware) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebsite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }}
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