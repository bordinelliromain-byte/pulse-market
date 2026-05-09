import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>PM</span>
          </div>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>PulseMarket</span>
        </div>

        {/* 404 */}
        <div style={{
          fontSize: 120,
          fontWeight: 800,
          color: 'transparent',
          backgroundImage: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          lineHeight: 1,
          marginBottom: 24,
          letterSpacing: '-0.04em',
        }}>
          404
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 12, letterSpacing: '-0.02em' }}>
          Page introuvable
        </h1>

        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 36 }}>
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            background: '#4F46E5',
            color: 'white',
            padding: '11px 24px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}>
            Retour à l'accueil
          </Link>
          <Link href="/auth" style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#94A3B8',
            padding: '11px 24px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            Se connecter
          </Link>
        </div>

      </div>
    </div>
  )
}