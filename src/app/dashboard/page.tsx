'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock,
  Plus,
  Users,
  TrendingUp,
  LogOut,
  ChevronRight,
  Star,
  MapPin
} from 'lucide-react'

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
          pending: apps?.filter(a => a.status === 'pending').length || 0,
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
        let pendingApps = 0

        if (eventIds.length > 0) {
          const { data: apps } = await supabase
            .from('applications')
            .select('status')
            .in('event_id', eventIds)

          totalApps = apps?.length || 0
          validatedApps = apps?.filter(a => a.status === 'validated').length || 0
          pendingApps = apps?.filter(a => a.status === 'pending').length || 0
        }

        setStats({ events: events?.length || 0, totalApps, validatedApps, pendingApps })
      }

      setLoading(false)
    }
    getData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">

      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-semibold text-slate-900">PlaceMarket</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:block">
              {profile?.full_name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/auth')
              }}
              className="text-slate-500 hover:text-slate-900 gap-2"
            >
              <LogOut size={16} />
              <span className="hidden md:block">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* PAGE HEADER */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-slate-900">
            Bonjour, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {profile?.role === 'exposant' ? 'Espace Exposant' : 'Espace Organisateur'} — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* ========== DASHBOARD EXPOSANT ========== */}
        {profile?.role === 'exposant' && (
          <div className="space-y-6">

            {/* Badge vérifié */}
            {stats.isVerified && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Dossier vérifié</p>
                  <p className="text-xs text-emerald-600">Votre dossier est validé — les organisateurs vous font confiance</p>
                </div>
              </div>
            )}

            {/* BENTO GRID STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Candidatures</span>
                    <FileText size={16} className="text-slate-400" />
                  </div>
                  <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
                  <p className="text-xs text-slate-400 mt-1">au total</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Validées</span>
                    <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-3xl font-semibold text-emerald-600">{stats.validated}</p>
                  <p className="text-xs text-slate-400 mt-1">acceptées</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">En attente</span>
                    <Clock size={16} className="text-amber-500" />
                  </div>
                  <p className="text-3xl font-semibold text-amber-600">{stats.pending}</p>
                  <p className="text-xs text-slate-400 mt-1">en cours</p>
                </CardContent>
              </Card>

              <Card className={`shadow-none ${stats.plan === 'pro' ? 'border-slate-900 bg-slate-900' : 'border-slate-200'}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium uppercase tracking-wide ${stats.plan === 'pro' ? 'text-slate-400' : 'text-slate-500'}`}>Plan</span>
                    <Star size={16} className={stats.plan === 'pro' ? 'text-yellow-400' : 'text-slate-400'} />
                  </div>
                  <p className={`text-3xl font-semibold ${stats.plan === 'pro' ? 'text-white' : 'text-slate-900'}`}>
                    {stats.plan === 'pro' ? 'Pro' : 'Free'}
                  </p>
                  <p className={`text-xs mt-1 ${stats.plan === 'pro' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {stats.plan === 'pro' ? 'Illimité' : '1 candidature/mois'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ACTIONS */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card
                className="border-slate-200 shadow-none hover:border-slate-400 transition-colors cursor-pointer group"
                onClick={() => router.push('/dashboard/profil')}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      <FileText size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Mon dossier</p>
                      <p className="text-sm text-slate-500">Documents et informations</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </CardContent>
              </Card>

              <Card
                className="border-slate-200 shadow-none hover:border-slate-400 transition-colors cursor-pointer group"
                onClick={() => router.push('/dashboard/evenements')}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      <MapPin size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Trouver un événement</p>
                      <p className="text-sm text-slate-500">Marchés et festivals disponibles</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </CardContent>
              </Card>
            </div>

            {/* UPGRADE BANNER */}
            {stats.plan !== 'pro' && (
              <Card className="border-slate-900 bg-slate-900 shadow-none">
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">Passez en Pro — 20€/mois</p>
                    <p className="text-sm text-slate-400 mt-1">Candidatures illimitées, badge vérifié, alertes instantanées</p>
                  </div>
                  <Button className="bg-white text-slate-900 hover:bg-slate-100 shrink-0">
                    Upgrader maintenant →
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>
        )}

        {/* ========== DASHBOARD ORGANISATEUR ========== */}
        {profile?.role === 'organisateur' && (
          <div className="space-y-6">

            {/* BENTO GRID STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Événements</span>
                    <Calendar size={16} className="text-slate-400" />
                  </div>
                  <p className="text-3xl font-semibold text-slate-900">{stats.events}</p>
                  <p className="text-xs text-slate-400 mt-1">publiés</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dossiers</span>
                    <Users size={16} className="text-slate-400" />
                  </div>
                  <p className="text-3xl font-semibold text-slate-900">{stats.totalApps}</p>
                  <p className="text-xs text-slate-400 mt-1">reçus</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Validés</span>
                    <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-3xl font-semibold text-emerald-600">{stats.validatedApps}</p>
                  <p className="text-xs text-slate-400 mt-1">acceptés</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">En attente</span>
                    <Clock size={16} className="text-amber-500" />
                  </div>
                  <p className="text-3xl font-semibold text-amber-600">{stats.pendingApps}</p>
                  <p className="text-xs text-slate-400 mt-1">à traiter</p>
                </CardContent>
              </Card>
            </div>

            {/* ACTIONS */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card
                className="border-slate-200 shadow-none hover:border-slate-400 transition-colors cursor-pointer group"
                onClick={() => router.push('/dashboard/creer-evenement')}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                      <Plus size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Créer un événement</p>
                      <p className="text-sm text-slate-500">Publier un marché ou une foire</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </CardContent>
              </Card>

              <Card
                className="border-slate-200 shadow-none hover:border-slate-400 transition-colors cursor-pointer group"
                onClick={() => router.push('/dashboard/candidatures')}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      <TrendingUp size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Gérer les candidatures</p>
                      <p className="text-sm text-slate-500">Valider ou refuser les dossiers</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </CardContent>
              </Card>
            </div>

          </div>
        )}

      </main>
    </div>
  )
}