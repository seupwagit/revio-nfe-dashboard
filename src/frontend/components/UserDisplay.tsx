/**
 * UserDisplay - Componente de Exibição do Usuário
 * 
 * Exibe informações do usuário autenticado e opções de logout
 */

import { useState } from 'react'
import { LogOut, Settings, User, Database, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function UserDisplay() {
  const [userMenuAberto, setUserMenuAberto] = useState(false)
  const { user, database, isAdmin, logout } = useAuth()

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
      // O redirecionamento será feito automaticamente pelo AuthContext
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, limpar sessão local
      window.location.href = '/login'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setUserMenuAberto(!userMenuAberto)}
        className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-revio-light transition-all duration-200"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-revio-gray-800">
            {user.usrNome}
          </p>
          <div className="flex items-center space-x-1">
            <Database className="h-3 w-3 text-revio-gray-500" />
            <p className="text-xs text-revio-gray-500">
              {database || 'N/A'}
            </p>
            {isAdmin && (
              <>
                <span className="text-revio-gray-400">•</span>
                <Shield className="h-3 w-3 text-revio-primary" />
                <span className="text-xs text-revio-primary font-medium">Admin</span>
              </>
            )}
          </div>
        </div>
      </button>

      {userMenuAberto && (
        <>
          {/* Overlay para fechar menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setUserMenuAberto(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-revio-lg border border-revio-gray-200 py-2 z-20">
            {/* Informações do usuário */}
            <div className="px-4 py-3 border-b border-revio-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-revio-gray-800 truncate">
                    {user.usrNome}
                  </p>
                  <p className="text-xs text-revio-gray-500 truncate">
                    {user.usrLogin}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Database className="h-3 w-3 text-revio-gray-400" />
                    <p className="text-xs text-revio-gray-500 truncate">
                      {database || 'Base não definida'}
                    </p>
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <div className="mt-2 px-2 py-1 bg-revio-light rounded-md">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3 text-revio-primary" />
                    <span className="text-xs text-revio-primary font-medium">
                      Privilégios Administrativos
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Opções do menu */}
            <div className="py-1">
              <button 
                className="w-full px-4 py-2 text-left text-sm text-revio-gray-700 hover:bg-revio-light flex items-center space-x-2 transition-colors"
                onClick={() => setUserMenuAberto(false)}
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </button>
              
              <div className="border-t border-revio-gray-100 my-1" />
              
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>

            {/* Informações técnicas */}
            <div className="border-t border-revio-gray-100 px-4 py-2">
              <div className="text-xs text-revio-gray-400 space-y-1">
                <div>Código: {user.usrCodigo}</div>
                <div>Sessão: Ativa</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}