'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Landing() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-bold text-[#1E3A5F] text-xl">PlaceMarket</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/auth')}
              className="text-[#1E3A5F] font-medium hover:underline"
            >
              Connexion
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="bg-[#1E3A5F] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#162d4a] transition-colors"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#1E3A5F] px-4 py-2 rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Disponible en Provence-Alpes-Côte d'Azur
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#1E3A5F] leading-tight mb-6">
              La plateforme qui connecte <span className="text-green-600">exposants</span> et <span className="text-green-600">organisateurs</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 leading-relaxed">
              Fini les appels téléphoniques, les emails perdus et les dossiers papier. PlaceMarket digitalise la gestion des marchés, foires et festivals en France.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/auth')}
                className="bg-[#1E3A5F] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#162d4a] transition-colors"
              >
                Je suis exposant →
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="bg-white text-[#1E3A5F] border-2 border-[#1E3A5F] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
              >
                Je suis organisateur →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 px-6 bg-[#1E3A5F]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: '2 min', label: "Pour s'inscrire" },
            { number: '1 clic', label: 'Pour postuler' },
            { number: '10 sec', label: 'Pour vérifier un dossier' },
            { number: '0€', label: 'Pour commencer' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl font-bold text-white mb-1">{stat.number}</p>
              <p className="text-blue-200 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POUR QUI */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1E3A5F] text-center mb-16">
            Une solution pour chaque acteur
          </h2>
          <div className="grid md:grid-cols-2 gap-8">

            {/* Exposants */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-2xl font-bold text-[#1E3A5F] mb-4">Pour les exposants</h3>
              <p className="text-gray-500 mb-6">Food-trucks, artisans, commerçants non-sédentaires</p>
              <ul className="space-y-3">
                {[
                  'Trouvez des événements sur une carte interactive',
                  'Postulez en 1 clic avec votre dossier complet',
                  'Badge "Dossier Vérifié" pour rassurer les mairies',
                  'Alertes instantanées pour les nouveaux événements',
                  'Gérez toutes vos candidatures au même endroit',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/auth')}
                className="mt-8 w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-medium hover:bg-[#162d4a] transition-colors"
              >
                Créer mon compte exposant
              </button>
            </div>

            {/* Organisateurs */}
            <div className="bg-[#1E3A5F] rounded-2xl p-8 shadow-sm">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-2xl font-bold text-white mb-4">Pour les organisateurs</h3>
              <p className="text-blue-200 mb-6">Mairies, comités des fêtes, associations</p>
              <ul className="space-y-3">
                {[
                  'Publiez vos événements en quelques minutes',
                  'Recevez des dossiers complets et vérifiés automatiquement',
                  'Validez ou refusez les candidatures en 1 clic',
                  'Messagerie groupée pour tous vos exposants',
                  'Zéro appel téléphonique, zéro email perdu',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-blue-100">
                    <span className="text-green-400 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/auth')}
                className="mt-8 w-full bg-white text-[#1E3A5F] py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
              >
                Créer mon compte organisateur
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1E3A5F] text-center mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-gray-500 text-center mb-16">3 étapes pour les exposants</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: '📄',
                title: 'Créez votre dossier',
                desc: 'Uploadez votre Kbis et votre RC Pro une seule fois. Notre IA vérifie votre SIREN automatiquement en 10 secondes.'
              },
              {
                step: '02',
                icon: '🗺️',
                title: 'Trouvez des événements',
                desc: 'Parcourez les marchés et festivals disponibles dans votre région. Filtrez par date, lieu et type d\'événement.'
              },
              {
                step: '03',
                icon: '⚡',
                title: 'Postulez en 1 clic',
                desc: 'Votre dossier complet est envoyé automatiquement. Plus besoin de ressaisir vos informations à chaque fois.'
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-sm font-bold text-green-600 mb-2">ÉTAPE {item.step}</div>
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1E3A5F] text-center mb-4">Tarifs simples et transparents</h2>
          <p className="text-gray-500 text-center mb-16">Pour les exposants</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-[#1E3A5F] mb-2">Gratuit</h3>
              <p className="text-4xl font-bold text-[#1E3A5F] mb-6">0€<span className="text-lg text-gray-400 font-normal">/mois</span></p>
              <ul className="space-y-3 mb-8">
                {[
                  'Consultation des événements',
                  'Création de profil',
                  'Upload des documents',
                  '1 candidature par mois',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <span className="text-green-500">✓</span>{item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/auth')}
                className="w-full border-2 border-[#1E3A5F] text-[#1E3A5F] py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
              >
                Commencer gratuitement
              </button>
            </div>
            <div className="bg-[#1E3A5F] rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                LE PLUS POPULAIRE
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <p className="text-4xl font-bold text-white mb-6">20€<span className="text-lg text-blue-200 font-normal">/mois</span></p>
              <ul className="space-y-3 mb-8">
                {[
                  'Candidatures illimitées',
                  'Badge Dossier Vérifié ✅',
                  'Alertes SMS/Push',
                  'Accès événements exclusifs',
                  'Support prioritaire',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-blue-100">
                    <span className="text-green-400">✓</span>{item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/auth')}
                className="w-full bg-white text-[#1E3A5F] py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Passer en Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6 bg-[#1E3A5F]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à rejoindre PlaceMarket ?
          </h2>
          <p className="text-blue-200 text-xl mb-10">
            Rejoignez les exposants et organisateurs qui font confiance à PlaceMarket.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="bg-white text-[#1E3A5F] px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            Créer mon compte gratuitement →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 bg-[#162d4a]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <span className="text-[#1E3A5F] text-xs font-bold">P</span>
            </div>
            <span className="text-white font-bold">PlaceMarket</span>
          </div>
          <p className="text-blue-200 text-sm">© 2026 PlaceMarket — Tous droits réservés</p>
          <div className="flex gap-6 text-blue-200 text-sm">
            <a href="#" className="hover:text-white">Mentions légales</a>
            <a href="#" className="hover:text-white">CGU</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}