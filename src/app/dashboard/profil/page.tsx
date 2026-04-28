'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfilExposant() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [sirenStatus, setSirenStatus] = useState('')
  
  // Champs du formulaire
  const [businessName, setBusinessName] = useState('')
  const [siren, setSiren] = useState('')
  const [standWidth, setStandWidth] = useState('')
  const [standLength, setStandLength] = useState('')
  const [needsElectricity, setNeedsElectricity] = useState(false)
  const [description, setDescription] = useState('')
  
  // Fichiers
  const [kbisFile, setKbisFile] = useState<File | null>(null)
  const [assuranceFile, setAssuranceFile] = useState<File | null>(null)
  const [kbisUrl, setKbisUrl] = useState('')
  const [assuranceUrl, setAssuranceUrl] = useState('')

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

      if (profileData?.role !== 'exposant') {
        router.push('/dashboard')
        return
      }

      setProfile(profileData)

      const { data: exposantData } = await supabase
        .from('exposant_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (exposantData) {
        setBusinessName(exposantData.business_name || '')
        setSiren(exposantData.siren || '')
        setStandWidth(exposantData.stand_width || '')
        setStandLength(exposantData.stand_length || '')
        setNeedsElectricity(exposantData.needs_electricity || false)
        setDescription(exposantData.description || '')
        setKbisUrl(exposantData.kbis_url || '')
        setAssuranceUrl(exposantData.assurance_url || '')
      }

      setLoading(false)
    }
    getData()
  }, [])

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true })
    if (error) throw error
    return data.path
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let finalKbisUrl = kbisUrl
      let finalAssuranceUrl = assuranceUrl

      // Upload Kbis si nouveau fichier
      if (kbisFile) {
        finalKbisUrl = await uploadFile(kbisFile, `${user.id}/kbis.pdf`)
      }

      // Upload Assurance si nouveau fichier
      if (assuranceFile) {
        finalAssuranceUrl = await uploadFile(assuranceFile, `${user.id}/assurance.pdf`)
      }

      // Sauvegarder dans la base
      const { error } = await supabase
        .from('exposant_data')
        .upsert({
          user_id: user.id,
          business_name: businessName,
          siren: siren,
          stand_width: parseFloat(standWidth),
          stand_length: parseFloat(standLength),
          needs_electricity: needsElectricity,
          description: description,
          kbis_url: finalKbisUrl,
          assurance_url: finalAssuranceUrl,
        })

      if (error) throw error
      setMessage('✅ Profil sauvegardé avec succès !')
    } catch (err: any) {
      setMessage('❌ Erreur : ' + err.message)
    }

    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Chargement...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mon Dossier Exposant</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:underline">
            ← Retour
          </button>
        </div>

        {/* Infos entreprise */}
        <Card>
          <CardHeader>
            <CardTitle>🏪 Informations entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
  <Label>Numéro SIREN</Label>
  <div className="flex gap-2">
    <Input 
      placeholder="123 456 789" 
      value={siren} 
      onChange={e => setSiren(e.target.value)} 
    />
    <button
  onClick={async () => {
  if (!siren) return
  setSirenStatus('🔍 Vérification en cours...')

  // Timeout de 10 secondes
  const timer = setTimeout(() => {
    setSirenStatus('❌ SIREN invalide ou introuvable')
  }, 10000)

  try {
    const res = await fetch('/api/verify-siren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siren })
    })
    const data = await res.json()
    clearTimeout(timer)
    setSirenStatus(data.message)

    if (data.valid) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('exposant_data')
          .upsert({ user_id: user.id, is_verified: true })
      }
    }
  } catch {
    clearTimeout(timer)
    setSirenStatus('❌ Erreur de connexion')
  }
}}
  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 whitespace-nowrap"
>
  Vérifier
</button>
  </div>
  {sirenStatus && <p className="text-sm font-medium mt-1">{sirenStatus}</p>}
</div>
            <div>
              <Label>Numéro SIREN</Label>
              <Input placeholder="123 456 789" value={siren} onChange={e => setSiren(e.target.value)} />
            </div>
            <div>
              <Label>Description de votre activité</Label>
              <textarea
                className="w-full border rounded-md p-3 text-sm resize-none h-24"
                placeholder="Burgers artisanaux, cuisine du monde..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Infos stand */}
        <Card>
          <CardHeader>
            <CardTitle>📐 Caractéristiques du stand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Largeur (mètres)</Label>
                <Input type="number" placeholder="3" value={standWidth} onChange={e => setStandWidth(e.target.value)} />
              </div>
              <div>
                <Label>Longueur (mètres)</Label>
                <Input type="number" placeholder="6" value={standLength} onChange={e => setStandLength(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="electricity"
                checked={needsElectricity}
                onChange={e => setNeedsElectricity(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="electricity">J'ai besoin d'électricité</Label>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>📄 Documents administratifs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Kbis ou extrait d'immatriculation (PDF)</Label>
              {kbisUrl && <p className="text-green-600 text-sm mb-1">✅ Document déjà uploadé</p>}
              <Input
                type="file"
                accept=".pdf"
                onChange={e => setKbisFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label>Attestation RC Pro (PDF)</Label>
              {assuranceUrl && <p className="text-green-600 text-sm mb-1">✅ Document déjà uploadé</p>}
              <Input
                type="file"
                accept=".pdf"
                onChange={e => setAssuranceFile(e.target.files?.[0] || null)}
              />
            </div>
          </CardContent>
        </Card>

        {message && <p className="text-center font-medium">{message}</p>}

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder mon dossier'}
        </Button>

      </div>
    </div>
  )
}