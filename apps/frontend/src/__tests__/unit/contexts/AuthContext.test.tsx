/**
 * Unit Tests: AuthContext
 * 
 * Testa o comportamento do contexto de autenticação:
 * - Verificação de token expirado
 * - Interceptação de eventos unauthorized
 * - Limpeza de sessão
 * - Redirecionamento
 * 
 * Feature: authentication-authorization-system
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../../../contexts/AuthContext'
import { httpService } from '../../../services/httpService'
import { storageService } from '../../../services/storageService'

// Mock dos serviços
vi.mock('../../../services/storageService')
vi.mock('../../../services/httpService')
vi.mock('../../../services/DownloadMonitorService', () => ({
  downloadMonitor: {
    initialize: vi.fn(),
    startMonitoring: vi.fn(),
    checkPendingDownloads: vi.fn(),
    shutdown: vi.fn()
  }
}))

// Mock do window.location
delete (window as any).location
window.location = {
  href: '',
  pathname: '/',
  search: '',
  hash: ''
} as any

describe('AuthContext - Token Expiration and Redirect', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.location.href = ''
    window.location.pathname = '/'
  })

  describe('checkAuth()', () => {
    it('should return false when token is expired', async () => {
      // Mock token expirado
      ;(storageService.isTokenExpired as any).mockReturnValue(true)
      ;(storageService.getUserData as any).mockReturnValue(null)
      ;(storageService.clearAuthData as any).mockImplementation(() => {})
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
      })
      
      // Verificar se clearSession foi chamado
      expect(storageService.clearAuthData).toHaveBeenCalled()
    })

    it('should return true when token is valid', async () => {
      const mockUser = {
        usrCodigo: '1',
        usrNome: 'Test User',
        usrLogin: 'test',
        bancoDeDados: 'testdb',
        isAdmin: false
      }
      
      // Mock token válido
      ;(storageService.isTokenExpired as any).mockReturnValue(false)
      ;(storageService.getUserData as any).mockReturnValue(mockUser)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.user).toEqual(mockUser)
      })
    })

    it('should clear session on error', async () => {
      // Mock erro ao verificar token
      ;(storageService.isTokenExpired as any).mockImplementation(() => {
        throw new Error('Storage error')
      })
      ;(storageService.clearAuthData as any).mockImplementation(() => {})
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
      })
      
      expect(storageService.clearAuthData).toHaveBeenCalled()
    })
  })

  describe('login()', () => {
    it('should authenticate user and store token', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-token',
          user: {
            usrCodigo: '1',
            usrNome: 'Test User',
            usrLogin: 'test',
            bancoDeDados: 'testdb',
            isAdmin: false
          }
        }
      }
      
      ;(httpService.post as any).mockResolvedValue(mockResponse)
      ;(storageService.setAuthToken as any).mockReturnValue(true)
      ;(storageService.setUserData as any).mockReturnValue(true)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.login('test', 'password')
      })
      
      expect(httpService.post).toHaveBeenCalledWith(
        '/api/auth/login',
        { username: 'test', password: 'password' },
        { includeAuth: false }
      )
      
      expect(storageService.setAuthToken).toHaveBeenCalledWith('mock-token')
      expect(storageService.setUserData).toHaveBeenCalledWith(mockResponse.data.user)
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })
    })

    it('should throw error when login fails', async () => {
      ;(httpService.post as any).mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await expect(
        act(async () => {
          await result.current.login('test', 'wrong-password')
        })
      ).rejects.toThrow()
    })
  })

  describe('logout()', () => {
    it('should clear session and call API', async () => {
      ;(storageService.getAuthToken as any).mockReturnValue('mock-token')
      ;(httpService.post as any).mockResolvedValue({ success: true })
      ;(storageService.clearAuthData as any).mockImplementation(() => {})
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.logout()
      })
      
      expect(httpService.post).toHaveBeenCalledWith('/api/auth/logout')
      expect(storageService.clearAuthData).toHaveBeenCalled()
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
      })
    })

    it('should clear session even if API call fails', async () => {
      ;(storageService.getAuthToken as any).mockReturnValue('mock-token')
      ;(httpService.post as any).mockRejectedValue(new Error('API error'))
      ;(storageService.clearAuthData as any).mockImplementation(() => {})
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.logout()
      })
      
      expect(storageService.clearAuthData).toHaveBeenCalled()
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
      })
    })
  })

  describe('auth:unauthorized event', () => {
    it('should handle unauthorized event and redirect', async () => {
      ;(storageService.clearAuthData as any).mockImplementation(() => {})
      
      renderHook(() => useAuth(), { wrapper })
      
      // Simular evento unauthorized
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', {
          detail: {
            status: 401,
            code: 'INVALID_TOKEN',
            message: 'Token inválido'
          }
        }))
      })
      
      await waitFor(() => {
        expect(storageService.clearAuthData).toHaveBeenCalled()
        expect(window.location.href).toBe('/login')
      })
    })

    it('should handle unauthorized event without detail', async () => {
      ;(storageService.clearAuthData as any).mockImplementation(() => {})
      
      renderHook(() => useAuth(), { wrapper })
      
      // Simular evento sem detail
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      })
      
      await waitFor(() => {
        expect(storageService.clearAuthData).toHaveBeenCalled()
        expect(window.location.href).toBe('/login')
      })
    })
  })

  describe('Initial redirect', () => {
    it('should redirect to login with returnUrl when not authenticated', async () => {
      window.location.pathname = '/dashboard'
      
      ;(storageService.isTokenExpired as any).mockReturnValue(true)
      ;(storageService.getUserData as any).mockReturnValue(null)
      ;(storageService.clearAuthData as any).mockImplementation(() => {})
      
      renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(window.location.href).toContain('/login')
        expect(window.location.href).toContain('returnUrl=%2Fdashboard')
      })
    })

    it('should not redirect when already on login page', async () => {
      window.location.pathname = '/login'
      
      ;(storageService.isTokenExpired as any).mockReturnValue(true)
      ;(storageService.getUserData as any).mockReturnValue(null)
      
      renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(window.location.href).not.toContain('returnUrl')
      })
    })
  })
})
