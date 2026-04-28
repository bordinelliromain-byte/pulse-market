'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreerEvenement() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [locationName, setLocationName] = useState('')
  const [totalSpots, setTotalSpots] = useState('')
  const [pricePerSpot, setPricePerSpot] = useState('')
  const [isExclusive, setIsExclusive] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (data?.role !== 'organisateur') router.push('/dashboard')
    }
    check()
  }, [])

  const handleCreate = async () => {
    if (!title || !startDate || !endDate || !locationName || !totalSpots) {
      setMessage('❌ Remplis tous les champs obligatoires')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('events')
        .insert({
          organisateur_id: user.id,
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          location_name: locationName,
          total_spots: parseInt(totalSpots),
          available_spots: parseInt(totalSpots),
          price_per_spot: parseFloat(pricePerSpot) || 0,
          is_exclusive: isExclusive,
          status: 'published'
        })

      if (error) throw error

      setMessage('✅ Événement créé avec succès !')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: any) {
      setMessage('❌ Erreur : ' + err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Créer un événement</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:underline">
            ← Retour
          </button>
        </div>

        {/* Infos générales */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Titre de l'événement *</Label>
              <Input placeholder="Marché de Noël d'Aubagne" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                className="w-full border rounded-md p-3 text-sm resize-none h-24"
                placeholder="Décrivez votre événement..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Lieu *</Label>
              <Input placeholder="Place de la Mairie, Aubagne" value={locationName} onChange={e => setLocationName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>📅 Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date de début *</Label>
              <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Date de fin *</Label>
              <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Emplacements */}
        <Card>
          <CardHeader>
            <CardTitle>🏪 Emplacements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre de places total *</Label>
              <Input type="number" placeholder="20" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} />
            </div>
            <div>
              <Label>Prix par emplacement (€)</Label>
              <Input type="number" placeholder="0" value={pricePerSpot} onChange={e => setPricePerSpot(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="exclusive"
                checked={isExclusive}
                onChange={e => setIsExclusive(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="exclusive">Événement exclusif (réservé aux abonnés Pro)</Label>
            </div>
          </CardContent>
        </Card>

        {message && <p className="text-center font-medium">{message}</p>}

        <Button className="w-full" onClick={handleCreate} disabled={loading}>
          {loading ? 'Création en cours...' : 'Publier l\'événement'}
        </Button>

      </div>
    </div>
  )
}