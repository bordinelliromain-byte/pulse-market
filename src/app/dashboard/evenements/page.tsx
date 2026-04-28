'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Evenements() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string>('')
  const [userApplications, setUserApplications] = useState<string[]>([])

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)

      // Récupérer les événements publiés
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('start_date', { ascending: true })

      setEvents(eventsData || [])

      // Récupérer les candidatures déjà envoyées
      const { data: applications } = await supabase
        .from('applications')
        .select('event_id')
        .eq('exposant_id', user.id)

      setUserApplications(applications?.map(a => a.event_id) || [])
      setLoading(false)
    }
    getData()
  }, [])

  const handleApply = async (eventId: string) => {
    setApplying(eventId)
    setMessage('')

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          event_id: eventId,
          exposant_id: userId,
          status: 'pending'
        })

      if (error) throw error

      setUserApplications(prev => [...prev, eventId])
      setMessage('✅ Candidature envoyée !')
    } catch (err: any) {
      setMessage('❌ Erreur : ' + err.message)
    }

    setApplying(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Chargement...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Événements disponibles</h1>
            <p className="text-gray-500 text-sm">{events.length} événement(s) trouvé(s)</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:underline">
            ← Retour
          </button>
        </div>

        {message && <p className="text-center font-medium">{message}</p>}

        {events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🗓️</p>
            <p className="text-lg font-medium">Aucun événement disponible</p>
            <p className="text-sm">Revenez bientôt !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold">{event.title}</h2>
                        {event.is_exclusive && (
                          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            ⭐ Exclusif Pro
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mb-2">📍 {event.location_name}</p>
                      <p className="text-gray-500 text-sm mb-2">
                        📅 {formatDate(event.start_date)} → {formatDate(event.end_date)}
                      </p>
                      {event.description && (
                        <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                      )}
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">
                          🏪 {event.available_spots}/{event.total_spots} places
                        </span>
                        <span className="text-gray-500">
                          💶 {event.price_per_spot === 0 ? 'Gratuit' : `${event.price_per_spot}€`}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {userApplications.includes(event.id) ? (
                        <span className="bg-green-100 text-green-700 text-sm px-4 py-2 rounded-lg font-medium">
                          ✅ Candidature envoyée
                        </span>
                      ) : (
                        <Button
                          onClick={() => handleApply(event.id)}
                          disabled={applying === event.id}
                          size="sm"
                        >
                          {applying === event.id ? 'Envoi...' : 'Postuler'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}