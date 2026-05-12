import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

// ── Génération des métadonnées dynamiques par ville ─────────────────────
export async function generateMetadata({
  params,
}: {
  params: { ville: string }
}): Promise<Metadata> {
  const villeFormatted = decodeURIComponent(params.ville)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    title: `Marché de ${villeFormatted} — Horaires, exposants et infos | Whatmarket`,
    description: `Découvrez le marché de ${villeFormatted} : horaires d'ouverture, liste des exposants, producteurs locaux et artisans. Itinéraire et informations pratiques.`,
    keywords: [
      `marché ${villeFormatted}`,
      `marché de ${villeFormatted} horaires`,
      `marché forain ${villeFormatted}`,
      `producteurs locaux ${villeFormatted}`,
      `brocante ${villeFormatted}`,
    ],
    alternates: {
      canonical: `https://whatmarket.fr/marche/${params.ville}`,
    },
    openGraph: {
      title: `Marché de ${villeFormatted} — Horaires et exposants`,
      description: `Tout sur le marché de ${villeFormatted} : horaires, exposants, producteurs et artisans locaux.`,
      url: `https://whatmarket.fr/marche/${params.ville}`,
      images: [{ url: '/og-whatmarket.png', width: 1200, height: 630 }],
    },
  }
}

// ── Génération statique des pages villes ────────────────────────────────
export async function generateStaticParams() {
  // Liste des villes PACA prioritaires
  // Tu peux remplacer par une requête Supabase quand tu as des événements
  const villes = [
    'aubagne', 'cassis', 'la-ciotat', 'marseille', 'aix-en-provence',
    'toulon', 'nice', 'arles', 'avignon', 'salon-de-provence',
    'martigues', 'istres', 'vitrolles', 'marignane', 'gardanne',
    'roquevaire', 'auriol', 'gemenos', 'cuges-les-pins', 'ceyreste',
  ]
  return villes.map((ville) => ({ ville }))
}

// ── Schéma Event pour Google ─────────────────────────────────────────────
function buildEventSchema(ville: string, events: any[]) {
  return events.map((event) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": event.description || `Marché de ${ville} — exposants locaux, producteurs et artisans`,
    "startDate": event.start_date,
    "endDate": event.end_date || event.start_date,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": event.location_name || `Marché de ${ville}`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": ville,
        "addressCountry": "FR",
      },
      ...(event.latitude && event.longitude ? {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": event.latitude,
          "longitude": event.longitude,
        }
      } : {}),
    },
    "organizer": {
      "@type": "Organization",
      "name": "Whatmarket",
      "url": "https://whatmarket.fr",
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "url": `https://whatmarket.fr/marche/${ville.toLowerCase().replace(/ /g, '-')}`,
    },
    "image": event.cover_image || "https://whatmarket.fr/og-whatmarket.png",
  }))
}

// ── Page ville ───────────────────────────────────────────────────────────
export default async function MarcheVillePage({
  params,
}: {
  params: { ville: string }
}) {
  const villeSlug = params.ville
  const villeFormatted = decodeURIComponent(villeSlug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  // Récupérer les événements de cette ville depuis Supabase
  const supabase = createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .ilike('location_name', `%${villeFormatted}%`)
    .order('start_date', { ascending: true })
    .limit(10)

  const eventSchemas = buildEventSchema(villeFormatted, events || [])

  return (
    <>
      {/* Schema.org Event — injecté en head */}
      {eventSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Schema LocalBusiness pour la ville */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": `Marché de ${villeFormatted}`,
            "description": `Retrouvez tous les marchés de ${villeFormatted} : producteurs locaux, artisans, brocantes et marchés alimentaires.`,
            "url": `https://whatmarket.fr/marche/${villeSlug}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": villeFormatted,
              "addressCountry": "FR",
            },
            "image": "https://whatmarket.fr/og-whatmarket.png",
          })
        }}
      />

      <main style={{
        maxWidth: 430, margin: '0 auto', minHeight: '100vh',
        background: '#F9F8F6', fontFamily: '"DM Sans",system-ui,sans-serif',
        padding: '0 0 80px',
      }}>
        {/* Header ville */}
        <div style={{ background: '#111827', padding: '48px 20px 28px' }}>
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
            Marchés locaux
          </p>
          <h1 style={{
            fontFamily: '"Playfair Display",Georgia,serif',
            fontSize: 32, fontWeight: 700, color: 'white',
            lineHeight: 1.2, marginBottom: 8,
          }}>
            Marché de {villeFormatted}
          </h1>
          <p style={{ fontSize: 14, color: '#9CA3AF' }}>
            Horaires, exposants et informations pratiques
          </p>
        </div>

        <div style={{ padding: '20px 16px' }}>
          {events && events.length > 0 ? (
            <>
              <h2 style={{
                fontSize: 16, fontWeight: 600, color: '#111827',
                marginBottom: 16,
              }}>
                {events.length} marché{events.length > 1 ? 's' : ''} à venir
              </h2>
              {events.map((event) => (
                <div key={event.id} style={{
                  background: 'white', borderRadius: 16,
                  border: '1px solid #E5E7EB', padding: '16px',
                  marginBottom: 12,
                }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                    {event.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
                    📅 {new Date(event.start_date).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                    📍 {event.location_name}
                  </p>
                  {event.latitude && event.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#111827', color: 'white',
                        padding: '8px 14px', borderRadius: 10,
                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      🗺️ Itinéraire
                    </a>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                Pas encore de marché répertorié à {villeFormatted}
              </p>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                Vous organisez un marché à {villeFormatted} ?
              </p>
              <a
                href="https://pulse-market.fr/auth/mairie"
                style={{
                  display: 'inline-block', marginTop: 16,
                  background: '#4F46E5', color: 'white',
                  padding: '12px 24px', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}
              >
                Référencer mon marché →
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  )
}