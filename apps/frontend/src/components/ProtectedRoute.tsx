/**
 * ProtectedRoute - Componente de Rota Protegida
 * 
 * Verifica autenticação antes de permitir acesso às rotas
 */

import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading, user } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-revio-light via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-revio-primary mx-auto mb-4" />
          <p className="text-revio-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar se requer permissões administrativas
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-revio-light via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-revio-lg border border-revio-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-revio-gray-800 mb-2">
            Acesso Negado
          </h2>
          <p className="text-revio-gray-600 mb-6">
            Você não tem permissões administrativas necessárias para acessar esta página.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-revio-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-revio-primary/90 transition-colors"
            >
              Voltar
            </button>
            <p className="text-sm text-revio-gray-500">
              Usuário: {user?.usrNome} ({user?.usrLogin})
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar componente filho se todas as verificações passaram
  return <>{children}</>
}