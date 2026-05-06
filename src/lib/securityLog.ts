import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type LogAction =
  | 'paiement_initie'
  | 'paiement_confirme'
  | 'candidature_validee'
  | 'candidature_refusee'
  | 'connexion_succes'
  | 'connexion_echec'
  | 'rate_limit_atteint'
  | 'acces_non_autorise'
  | 'upload_document'
  | 'siren_verifie'
  | 'invitation_placier'

export async function securityLog({
  action,
  userId,
  details = {},
  ip,
}: {
  action: LogAction
  userId?: string
  details?: Record<string, any>
  ip?: string
}) {
  try {
    await supabase.from('security_logs').insert({
      user_id: userId || null,
      action,
      details,
      ip: ip || null,
    })
  } catch (err) {
    // Ne jamais faire crasher l'app à cause d'un log
    console.error('Security log error:', err)
  }
}