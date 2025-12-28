/**
 * AuthContext - Contexto de Autenticação
 * 
 * Gerencia estado de autenticação, sessão e dados do usuário
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { httpService } from '../services/httpService'
import { storageService } from '../services/storageService'
import { downloadMonitor } from '../services/DownloadMonitorService'

export interface User {
  usrCodigo: string
  usrNome: string
  usrLogin: string
  bancoDeDados: string
  isAdmin: boolean
  empresa?: string
  cnpj?: string
}

interface LoginResponse {
  user: User
  token: string
}

export interface AuthContextType {
  user: User | null
  database: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Verifica se há token válido no localStorage de forma segura
   */
  const checkAuth = (): boolean => {
    try {
      // Verificar se token está expirado
      if (storageService.isTokenExpired()) {
        console.log('Token expirado, limpando sessão')
        clearSession()
        return false
      }

      // Restaurar dados do usuário
      const userData = storageService.getUserData()
      if (userData) {
        setUser(userData)
        return true
      }

      return false
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      clearSession()
      return false
    }
  }

  /**
   * Realiza login do usuário
   */
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true)

      console.log('🔐 DEBUG: Iniciando login:', { username, passwordLength: password.length })

      const response = await httpService.post<LoginResponse>('/api/auth/login', {
        username,
        password
      }, { includeAuth: false })

      console.log('🔐 DEBUG: Resposta do login:', response)

      if (!response.success || !response.data) {
        console.error('🔐 DEBUG: Erro na resposta do login:', response.error)
        throw new Error(response.error || 'Erro ao fazer login')
      }

      console.log('🔐 DEBUG: Login bem-sucedido, salvando dados...')

      // Armazenar token e dados do usuário de forma segura
      if (!storageService.setAuthToken(response.data.token)) {
        throw new Error('Erro ao salvar token de autenticação')
      }
      
      if (!storageService.setUserData(response.data.user)) {
        throw new Error('Erro ao salvar dados do usuário')
      }

      // Atualizar estado
      setUser(response.data.user)

      console.log('🔐 DEBUG: Dados salvos, inicializando monitoramento...')

      // Inicializar monitoramento de downloads
      try {
        console.log('[Auth] Testando criação do worker antes da inicialização...')
        
        // Testar se o worker pode ser criado
        const testResult = await downloadMonitor.testWorkerCreation()
        if (!testResult.success) {
          console.error('[Auth] Falha no teste do worker:', testResult.error)
          throw new Error(`Falha no teste do worker: ${testResult.error}`)
        }
        
        console.log('[Auth] Teste do worker bem-sucedido, inicializando...')
        
        await downloadMonitor.initialize(
          response.data.user.usrCodigo,
          response.data.token,
          httpService.baseURL
        )
        
        // Iniciar monitoramento
        downloadMonitor.startMonitoring()
        
        // Verificar downloads pendentes
        await downloadMonitor.checkPendingDownloads()
        
        console.log('[Auth] Monitoramento de downloads inicializado')
      } catch (error) {
        console.error('[Auth] Erro ao inicializar monitoramento de downloads:', error)
        // Não falhar o login por causa disso
      }

    } catch (error) {
      console.error('❌ DEBUG: Erro no login:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Realiza logout do usuário
   */
  const logout = async (): Promise<void> => {
    try {
      // Encerrar monitoramento de downloads
      try {
        downloadMonitor.shutdown()
        console.log('[Auth] Monitoramento de downloads encerrado')
      } catch (error) {
        console.error('[Auth] Erro ao encerrar monitoramento:', error)
      }

      // Tentar chamar API de logout se houver token
      const token = storageService.getAuthToken()
      if (token) {
        try {
          await httpService.post('/api/auth/logout')
        } catch (error) {
          // Ignorar erro da API, continuar com logout local
          console.warn('Erro ao chamar API de logout:', error)
        }
      }
    } finally {
      // Sempre limpar sessão local
      clearSession()
    }
  }

  /**
   * Limpa dados de sessão de forma segura
   */
  const clearSession = (): void => {
    storageService.clearAuthData()
    setUser(null)
    
    // Encerrar monitoramento se ainda estiver ativo
    try {
      downloadMonitor.shutdown()
    } catch (error) {
      console.error('[Auth] Erro ao encerrar monitoramento na limpeza de sessão:', error)
    }
  }

  /**
   * Verifica autenticação ao carregar componente
   */
  useEffect(() => {
    const isAuth = checkAuth()
    setLoading(false)
    
    // Se não autenticado e não estiver na página de login, redirecionar
    if (!isAuth && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }, [])

  /**
   * Intercepta erros 401 globalmente
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('Token inválido ou expirado, redirecionando para login')
      clearSession()
      window.location.href = '/login'
    }

    window.addEventListener('auth:unauthorized' as any, handleUnauthorized)
    
    return () => {
      window.removeEventListener('auth:unauthorized' as any, handleUnauthorized)
    }
  }, [])

  const contextValue: AuthContextType = {
    user,
    database: user?.bancoDeDados || null,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    loading,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}