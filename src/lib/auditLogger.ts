// src/lib/auditLogger.ts
import { createClient } from '@supabase/supabase-js'

// ===============================================
// AUDIT LOGGER - Conforme RGPD + Administration FR
// ===============================================
// Rétention: 60 mois (5 ans)
// Loggé: toutes actions importantes
// ===============================================

export type AuditAction =
  // Auth
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'two_fa_enabled'
  | 'two_fa_disabled'
  | 'session_expired'

  // Candidatures
  | 'candidature_view'
  | 'candidature_validate'
  | 'candidature_reject'
  | 'candidature_bulk_validate'
  | 'candidature_export'

  // Événements
  | 'event_create'
  | 'event_update'
  | 'event_delete'
  | 'event_publish'
  | 'event_unpublish'

  // Attribution
  | 'attribution_save'
  | 'attribution_export_pdf'
  | 'attribution_export_excel'

  // Trésorerie
  | 'tresorerie_view'
  | 'tresorerie_export_csv'
  | 'tresorerie_export_pdf'

  // Placiers
  | 'placier_invite'
  | 'placier_activate'
  | 'placier_deactivate'
  | 'placier_delete'
  | 'placier_note_update'

  // Équipe
  | 'team_invite'
  | 'team_role_change'
  | 'team_remove'
  | 'team_ownership_transfer'
  | 'team_invitation_cancel'

  // Paramètres
  | 'settings_organisation_update'
  | 'settings_security_update'
  | 'settings_legal_update'
  | 'settings_logo_upload'

  // RGPD
  | 'rgpd_export_request'
  | 'rgpd_export_completed'
  | 'rgpd_deletion_request'
  | 'rgpd_data_view'

  // Audit
  | 'audit_logs_view'
  | 'audit_logs_export'

  // Système
  | 'data_access_sensitive'
  | 'unauthorized_action'

export type ResourceType =
  | 'candidature'
  | 'event'
  | 'placier'
  | 'team_member'
  | 'invitation'
  | 'settings'
  | 'auth'
  | 'tresorerie'
  | 'attribution'
  | 'rgpd'
  | 'audit'
  | 'system'

interface LogParams {
  mairie_id: string
  actor_id: string
  actor_email?: string
  action: AuditAction
  resource_type?: ResourceType
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

/**
 * Logger une action côté serveur (route API)
 * À utiliser dans les routes API ou Server Actions
 */
export async function logAudit(params: LogParams): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // service role pour bypass RLS
    )

    await supabase.from('audit_logs').insert({
      mairie_id: params.mairie_id,
      actor_id: params.actor_id,
      actor_email: params.actor_email || null,
      action: params.action,
      resource_type: params.resource_type || null,
      resource_id: params.resource_id || null,
      details: params.details || {},
      ip_address: params.ip_address || null,
      user_agent: params.user_agent || null,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    // Ne JAMAIS faire échouer l'action principale à cause du log
    console.error('[Audit Logger] Failed to log:', err)
  }
}

/**
 * Helper côté client - log via API
 */
export async function logAuditClient(action: AuditAction, params: {
  resource_type?: ResourceType
  resource_id?: string
  details?: Record<string, any>
}): Promise<void> {
  try {
    await fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    })
  } catch (err) {
    console.error('[Audit Logger Client] Failed:', err)
  }
}

/**
 * Helper - parse User-Agent en infos lisibles
 */
export function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'desktop'

  if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Edg/i.test(ua)) browser = 'Edge'
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera'

  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac OS/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/iPhone|iPad/i.test(ua)) { os = 'iOS'; device = 'mobile' }
  else if (/Android/i.test(ua)) { os = 'Android'; device = 'mobile' }

  if (/Mobile|Tablet/i.test(ua)) device = 'mobile'

  return { browser, os, device }
}

/**
 * Helper - labels lisibles pour les actions
 */
export const ACTION_LABELS: Record<AuditAction, string> = {
  // Auth
  login_success: 'Connexion réussie',
  login_failed: 'Échec de connexion',
  logout: 'Déconnexion',
  password_change: 'Changement de mot de passe',
  password_reset_request: 'Demande de réinitialisation',
  two_fa_enabled: '2FA activé',
  two_fa_disabled: '2FA désactivé',
  session_expired: 'Session expirée',

  // Candidatures
  candidature_view: 'Consultation candidature',
  candidature_validate: 'Validation candidature',
  candidature_reject: 'Refus candidature',
  candidature_bulk_validate: 'Validation en masse',
  candidature_export: 'Export candidatures',

  // Événements
  event_create: 'Création événement',
  event_update: 'Modification événement',
  event_delete: 'Suppression événement',
  event_publish: 'Publication événement',
  event_unpublish: 'Dépublication événement',

  // Attribution
  attribution_save: 'Sauvegarde plan attribution',
  attribution_export_pdf: 'Export PDF plan',
  attribution_export_excel: 'Export Excel plan',

  // Trésorerie
  tresorerie_view: 'Consultation trésorerie',
  tresorerie_export_csv: 'Export CSV trésorerie',
  tresorerie_export_pdf: 'Export PDF trésorerie',

  // Placiers
  placier_invite: 'Invitation placier',
  placier_activate: 'Activation placier',
  placier_deactivate: 'Désactivation placier',
  placier_delete: 'Suppression placier',
  placier_note_update: 'Modification note placier',

  // Équipe
  team_invite: 'Invitation membre',
  team_role_change: 'Changement de rôle',
  team_remove: 'Retrait membre',
  team_ownership_transfer: 'Transfert de propriété',
  team_invitation_cancel: 'Annulation invitation',

  // Paramètres
  settings_organisation_update: 'Modification organisation',
  settings_security_update: 'Modification sécurité',
  settings_legal_update: 'Modification légal',
  settings_logo_upload: 'Upload logo',

  // RGPD
  rgpd_export_request: 'Demande export RGPD',
  rgpd_export_completed: 'Export RGPD complété',
  rgpd_deletion_request: 'Demande suppression RGPD',
  rgpd_data_view: 'Consultation données RGPD',

  // Audit
  audit_logs_view: 'Consultation des logs',
  audit_logs_export: 'Export des logs',

  // Système
  data_access_sensitive: 'Accès données sensibles',
  unauthorized_action: 'Action non autorisée',
}

/**
 * Catégorisation par criticité
 */
export const ACTION_SEVERITY: Record<AuditAction, 'info' | 'warning' | 'critical'> = {
  // Critical (suppression, transferts, échecs)
  login_failed: 'critical',
  event_delete: 'critical',
  placier_delete: 'critical',
  team_remove: 'critical',
  team_ownership_transfer: 'critical',
  rgpd_deletion_request: 'critical',
  unauthorized_action: 'critical',

  // Warning (modifications importantes)
  password_change: 'warning',
  password_reset_request: 'warning',
  two_fa_disabled: 'warning',
  candidature_reject: 'warning',
  placier_deactivate: 'warning',
  team_invite: 'warning',
  team_role_change: 'warning',
  team_invitation_cancel: 'warning',
  settings_security_update: 'warning',
  settings_legal_update: 'warning',
  rgpd_export_request: 'warning',

  // Info (consultation, créations normales)
  login_success: 'info',
  logout: 'info',
  two_fa_enabled: 'info',
  session_expired: 'info',
  candidature_view: 'info',
  candidature_validate: 'info',
  candidature_bulk_validate: 'info',
  candidature_export: 'info',
  event_create: 'info',
  event_update: 'info',
  event_publish: 'info',
  event_unpublish: 'info',
  attribution_save: 'info',
  attribution_export_pdf: 'info',
  attribution_export_excel: 'info',
  tresorerie_view: 'info',
  tresorerie_export_csv: 'info',
  tresorerie_export_pdf: 'info',
  placier_invite: 'info',
  placier_activate: 'info',
  placier_note_update: 'info',
  settings_organisation_update: 'info',
  settings_logo_upload: 'info',
  rgpd_export_completed: 'info',
  rgpd_data_view: 'info',
  audit_logs_view: 'info',
  audit_logs_export: 'info',
  data_access_sensitive: 'info',
}