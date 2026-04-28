'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      if (profileData?.role === 'exposant') {
        const { data: apps } = await supabase
          .from('applications')
          .select('status')
          .eq('exposant_id', user.id)

        const { data: expData } = await supabase
          .from('exposant_data')
          .select('plan, is_verified')
          .eq('user_id', user.id)
          .single()

        setStats({
          total: apps?.length || 0,
          validated: apps?.filter(a => a.status === 'validated').length || 0,
          plan: expData?.plan || 'gratuit',
          isVerified: expData?.is_verified || false
        })
      }

      if (profileData?.role === 'organisateur') {
        const { data: events } = await supabase
          .from('events')
          .select('id')
          .eq('organisateur_id', user.id)

        const eventIds = events?.map(e => e.id) || []

        let totalApps = 0
        let validatedApps = 0

        if (eventIds.length > 0) {
          const { data: apps } = await supabase
            .from('applications')
            .select('status')
            .in('event_id', eventIds)

          totalApps = apps?.length || 0
          validatedApps = apps?.filter(a => a.status === 'validated').length || 0
        }

        setStats({
          events: events?.length || 0,
          totalApps,
          validatedApps
        })
      }

      setLoading(false)
    }
    getData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Chargement...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Bonjour {profile?.full_name || 'utilisateur'} 👋
            </h1>
            <p className="text-gray-500 capitalize">
              Espace {profile?.role}
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/auth')
            }}
            className="text-sm text-red-500 hover:underline"
          >
            Se déconnecter
          </button>
        </div>

        {/* Dashboard Exposant */}
        {profile?.role === 'exposant' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <p className="text-gray-500 text-sm">Candidatures envoyées</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <p className="text-gray-500 text-sm">Candidatures validées</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{stats.validated}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <p className="text-gray-500 text-sm">Mon plan</p>
                <p className={`text-3xl font-bold mt-1 ${stats.plan === 'pro' ? 'text-yellow-500' : 'text-blue-600'}`}>
                  {stats.plan === 'pro' ? '⭐ Pro' : 'Gratuit'}
                </p>
              </div>
            </div>

            {/* Badge vérifié */}
            {stats.isVerified && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-blue-700">Dossier vérifié</p>
                  <p className="text-blue-600 text-sm">Votre dossier est validé — les mairies vous font confiance</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => router.push('/dashboard/profil')}
                className="bg-white rounded-xl p-6 shadow-sm border hover:border-blue-500 transition-all text-left"
              >
                <p className="text-2xl mb-2">📄</p>
                <p className="font-semibold">Mon dossier exposant</p>
                <p className="text-gray-500 text-sm">Gérer mes documents et infos</p>
              </button>
              <button
                onClick={() => router.push('/dashboard/evenements')}
                className="bg-white rounded-xl p-6 shadow-sm border hover:border-blue-500 transition-all text-left"
              >
                <p className="text-2xl mb-2">🗺️</p>
                <p className="font-semibold">Trouver un événement</p>
                <p className="text-gray-500 text-sm">Parcourir les marchés disponibles</p>
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Organisateur */}
        {profile?.role === 'organisateur' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <p className="text-gray-500 text-sm">Événements créés</p>
                <p className="text-3xl font-bold mt-1">{stats.events}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <p className="text-gray-500 text-sm">Candidatures reçues</p>
                <p className="text-3xl font-bold mt-1">{stats.totalApps}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <p className="text-gray-500 text-sm">Exposants validés</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{stats.validatedApps}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => router.push('/dashboard/creer-evenement')}
                className="bg-white rounded-xl p-6 shadow-sm border hover:border-blue-500 transition-all text-left"
              >
                <p className="text-2xl mb-2">➕</p>
                <p className="font-semibold">Créer un événement</p>
                <p className="text-gray-500 text-sm">Publier un marché ou une foire</p>
              </button>
              <button
                onClick={() => router.push('/dashboard/candidatures')}
                className="bg-white rounded-xl p-6 shadow-sm border hover:border-blue-500 transition-all text-left"
              >
                <p className="text-2xl mb-2">📋</p>
                <p className="font-semibold">Gérer les candidatures</p>
                <p className="text-gray-500 text-sm">Valider ou refuser les dossiers</p>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}