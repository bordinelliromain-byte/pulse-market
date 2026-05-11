import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Whatmarket — Découvrez les marchés près de chez vous",
  description: "Trouvez les marchés locaux, producteurs et artisans autour de vous.",
  icons: {
    icon: [{ url: '/icon-whatmarket.svg', type: 'image/svg+xml' }],
    apple: '/icon-whatmarket.svg',
  },
}

export default function WhatmarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}