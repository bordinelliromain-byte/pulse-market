'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Candidatures() {
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'organisateur') { router.push('/dashboard'); return }

      // Récupérer les événements de l'organisateur
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organisateur_id', user.id)
        .order('start_date', { ascending: true })

      setEvents(eventsData || [])

      // Récupérer toutes les candidatures
      const eventIds = eventsData?.map(e => e.id) || []

      if (eventIds.length > 0) {
        const { data: apps } = await supabase
  .from('applications')
  .select(`
    *,
    profiles:exposant_id (
      full_name,
      email,
      phone
    ),
    events:event_id (
      title,
      start_date
    )
  `)
  .in('event_id', eventIds)
  .order('created_at', { ascending: false })

// Récupérer les exposant_data séparément
const appsWithData = await Promise.all(
  (apps || []).map(async (app) => {
    const { data: expData } = await supabase
      .from('exposant_data')
      .select('*')
      .eq('user_id', app.exposant_id)
      .single()
    return { ...app, exposant_data: expData }
  })
)

setCandidatures(appsWithData)
      }

      setLoading(false)
    }
    getData()
  }, [])

  const handleStatus = async (applicationId: string, newStatus: string) => {
    setUpdating(applicationId)
    setMessage('')

    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId)

    if (error) {
      setMessage('❌ Erreur : ' + error.message)
    } else {
      setCandidatures(prev =>
        prev.map(c => c.id === applicationId ? { ...c, status: newStatus } : c)
      )
      setMessage('✅ Statut mis à jour !')
    }

    setUpdating(null)
  }

  const filteredCandidatures = selectedEvent === 'all'
    ? candidatures
    : candidatures.filter(c => c.event_id === selectedEvent)

  const getStatusBadge = (status: string) => {
    const styles: any = {
      pending: 'bg-yellow-100 text-yellow-700',
      validated: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      paid: 'bg-blue-100 text-blue-700'
    }
    const labels: any = {
      pending: '⏳ En attente',
      validated: '✅ Validé',
      rejected: '❌ Refusé',
      paid: '💶 Payé'
    }
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Chargement...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Candidatures reçues</h1>
            <p className="text-gray-500 text-sm">{filteredCandidatures.length} candidature(s)</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:underline">
            ← Retour
          </button>
        </div>

        {/* Filtre par événement */}
        {events.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedEvent('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedEvent === 'all' ? 'bg-black text-white' : 'bg-white border hover:border-black'}`}
            >
              Tous les événements
            </button>
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedEvent === event.id ? 'bg-black text-white' : 'bg-white border hover:border-black'}`}
              >
                {event.title}
              </button>
            ))}
          </div>
        )}

        {message && <p className="text-center font-medium">{message}</p>}

        {filteredCandidatures.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg font-medium">Aucune candidature reçue</p>
            <p className="text-sm">Publiez un événement pour commencer à recevoir des dossiers</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCandidatures.map(candidature => (
              <Card key={candidature.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="font-bold text-lg">
                          {candidature.exposant_data?.business_name || candidature.profiles?.full_name}
                        </h2>
                        {candidature.exposant_data?.is_verified && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            ✅ Dossier vérifié
                          </span>
                        )}
                        {getStatusBadge(candidature.status)}
                      </div>
                      <p className="text-gray-500 text-sm">📧 {candidature.profiles?.email}</p>
                      <p className="text-gray-500 text-sm">🎪 {candidature.events?.title}</p>
                    </div>
                  </div>

                  {/* Infos stand */}
                  {candidature.exposant_data && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3 text-sm">
                      {candidature.exposant_data.siren && (
                        <p><span className="text-gray-400">SIREN :</span> {candidature.exposant_data.siren}</p>
                      )}
                      {candidature.exposant_data.stand_width && (
                        <p><span className="text-gray-400">Stand :</span> {candidature.exposant_data.stand_width}m × {candidature.exposant_data.stand_length}m</p>
                      )}
                      {candidature.exposant_data.needs_electricity && (
                        <p>⚡ Besoin d'électricité</p>
                      )}
                      {candidature.exposant_data.description && (
                        <p className="col-span-2"><span className="text-gray-400">Activité :</span> {candidature.exposant_data.description}</p>
                      )}
                    </div>
                  )}

                  {/* Documents */}
                  <div className="flex gap-3 mb-4">
                    {candidature.exposant_data?.kbis_url && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                        📄 Kbis fourni
                      </span>
                    )}
                    {candidature.exposant_data?.assurance_url && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                        📄 Assurance fournie
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {candidature.status === 'pending' && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleStatus(candidature.id, 'validated')}
                        disabled={updating === candidature.id}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        ✅ Valider
                      </Button>
                      <Button
                        onClick={() => handleStatus(candidature.id, 'rejected')}
                        disabled={updating === candidature.id}
                        variant="destructive"
                        size="sm"
                      >
                        ❌ Refuser
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}