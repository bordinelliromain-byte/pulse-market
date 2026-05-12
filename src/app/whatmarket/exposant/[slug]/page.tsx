// src/app/whatmarket/forain/[slug]/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { toSlug, extractVille, altExposant, altMarche, titleForain, descriptionForain } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const supabase = createClient()

  const { data: exposant } = await supabase
    .from('exposant_data')
    .select('nom_commercial, produits, ville, profiles(full_name)')
    .eq('slug', params.slug)
    .single()

  if (!exposant) return { title: 'Exposant introuvable | Whatmarket' }

  const nom = exposant.nom_commercial || (exposant.profiles as any)?.full_name || 'Exposant'
  const ville = exposant.ville || ''
  const villeSlug = toSlug(ville)

  return {
    title: titleForain(nom, ville),
    description: descriptionForain(nom, exposant.produits, ville),
    alternates: {
      canonical: `https://whatmarket.fr/forain/${params.slug}`,
    },
    openGraph: {
      title: titleForain(nom, ville),
      description: descriptionForain(nom, exposant.produits, ville),
      url: `https://whatmarket.fr/forain/${params.slug}`,
      images: [{ url: '/og-whatmarket.png', width: 1200, height: 630 }],
    },
  }
}

export default async function ForainPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createClient()

  const { data: exposant } = await supabase
    .from('exposant_data')
    .select('*, profiles(full_name, email)')
    .eq('slug', params.slug)
    .single()

  if (!exposant) notFound()

  const nom = exposant.nom_commercial || (exposant.profiles as any)?.full_name || 'Exposant'
  const ville = exposant.ville || ''
  const villeSlug = toSlug(ville)
  const villeFormatted = ville.replace(/\b\w/g, (c: string) => c.toUpperCase())

  // Récupérer les marchés auxquels il participe
  const { data: participations } = await supabase
    .from('applications')
    .select('*, events(title, start_date, location_name, cover_image)')
    .eq('exposant_id', exposant.user_id)
    .in('status', ['paid', 'present'])
    .order('created_at', { ascending: false })
    .limit(5)

  const schemaLocalBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": nom,
    "description": descriptionForain(nom, exposant.produits, ville),
    "url": `https://whatmarket.fr/forain/${params.slug}`,
    "image": exposant.photo_url || "https://whatmarket.fr/og-whatmarket.png",
    ...(ville ? {
      "address": {
        "@type": "PostalAddress",
        "addressLocality": villeFormatted,
        "addressCountry": "FR",
      }
    } : {}),
    "hasMap": villeSlug
      ? `https://whatmarket.fr/marche/${villeSlug}`
      : "https://whatmarket.fr",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaLocalBusiness) }}
      />

      <main style={{
        maxWidth: 430, margin: '0 auto', minHeight: '100vh',
        background: '#F9F8F6', fontFamily: '"DM Sans",system-ui,sans-serif',
        padding: '0 0 80px',
      }}>
        {/* Header exposant */}
        <div style={{ background: '#111827', padding: '48px 20px 28px' }}>
          {exposant.photo_url ? (
            <img
              src={exposant.photo_url}
              alt={altExposant(nom, ville, exposant.produits)}
              width={80}
              height={80}
              style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: 16, border: '3px solid rgba(255,255,255,0.1)' }}
            />
          ) : (
            <div style={{ width: 80, height: 80, background: '#4F46E5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 28, fontWeight: 700, color: 'white' }}>
              {nom.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 6 }}>
            {nom}
          </h1>
          {exposant.produits && (
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>{exposant.produits}</p>
          )}
        </div>

        <div style={{ padding: '20px 16px' }}>

          {/* ✅ Maillage interne — lien vers la page ville */}
          {ville && villeSlug && (
            <a
              href={`/whatmarket/marche/${villeSlug}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'white', border: '1px solid #E5E7EB',
                borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                  Marché de {villeFormatted}
                </p>
                <p style={{ fontSize: 12, color: '#6B7280' }}>
                  Voir tous les marchés de cette ville →
                </p>
              </div>
            </a>
          )}

          {/* Participations passées */}
          {participations && participations.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                Présent sur ces marchés
              </h2>
              {participations.map((p: any) => {
                const eventVille = extractVille(p.events?.location_name || '')
                const eventVilleSlug = toSlug(eventVille)
                return (
                  <a
                    key={p.id}
                    href={eventVilleSlug ? `/whatmarket/marche/${eventVilleSlug}` : '#'}
                    style={{
                      display: 'block', background: 'white',
                      border: '1px solid #E5E7EB', borderRadius: 12,
                      overflow: 'hidden', marginBottom: 10, textDecoration: 'none',
                    }}
                  >
                    {p.events?.cover_image && (
                      <img
                        src={p.events.cover_image}
                        alt={altMarche(p.events?.title || 'Marché', eventVille)}
                        width={400}
                        height={150}
                        style={{ width: '100%', height: 120, objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                        {p.events?.title}
                      </p>
                      <p style={{ fontSize: 12, color: '#6B7280' }}>
                        📅 {new Date(p.events?.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        {eventVille ? ` · 📍 ${eventVille}` : ''}
                      </p>
                    </div>
                  </a>
                )
              })}
            </>
          )}
        </div>
      </main>
    </>
  )
}