'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'exposant' | 'organisateur'>('exposant')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role }
      }
    })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">PlaceMarket</CardTitle>
          <CardDescription>La plateforme des marchés et événements</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            {/* CONNEXION */}
            <TabsContent value="signin" className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="vous@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Mot de passe</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button className="w-full" onClick={handleSignIn} disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </TabsContent>

            {/* INSCRIPTION */}
            <TabsContent value="signup" className="space-y-4">
              <div>
                <Label>Nom complet</Label>
                <Input placeholder="Jean Dupont" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="vous@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Mot de passe</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <Label>Je suis...</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => setRole('exposant')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${role === 'exposant' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200'}`}
                  >
                    🛒 Exposant
                  </button>
                  <button
                    onClick={() => setRole('organisateur')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${role === 'organisateur' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200'}`}
                  >
                    🏛️ Organisateur
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button className="w-full" onClick={handleSignUp} disabled={loading}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}