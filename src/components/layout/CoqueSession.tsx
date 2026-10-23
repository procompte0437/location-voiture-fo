import type { ReactNode } from 'react'
import { AdminShell } from '../admin/AdminShell'
import { CoqueEspaceClient } from '../client/CoqueEspaceClient'
import { CoquePartenaire } from '../partenaire/CoquePartenaire'
import { useAuth } from '../../context/AuthContext'

type PropsCoqueSession = {
  /** Contenu affiché dans le menu de l’espace du compte connecté. */
  children: ReactNode
  /** Même parcours pour un visiteur, avec la barre du site public. */
  visiteur: ReactNode
}

function espacePartenaire(role: string) {
  return role === 'partner' || role === 'partner_agent' || role === 'finance_manager'
}

/**
 * Le parcours de réservation reste dans l’interface du compte ouvert
 * (client, partenaire ou admin). Un visiteur garde le site public.
 */
export function CoqueSession({ children, visiteur }: PropsCoqueSession) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-sand-50">{children}</div>
  }

  if (!user) return <>{visiteur}</>

  if (user.role === 'super_admin' || user.role === 'admin') {
    return <AdminShell>{children}</AdminShell>
  }

  if (espacePartenaire(user.role)) {
    return <CoquePartenaire>{children}</CoquePartenaire>
  }

  return <CoqueEspaceClient>{children}</CoqueEspaceClient>
}
