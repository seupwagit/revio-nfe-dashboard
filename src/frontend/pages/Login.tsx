/**
 * Login Page - Página de Login
 * 
 * Interface de autenticação do usuário
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, User, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos vazios
    if (!username.trim() || !password.trim()) {
      setError('Usuário e senha são obrigatórios')
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(username.trim(), password)
      
      // Aguardar um pouco para garantir que o navegador detecte o login bem-sucedido
      setTimeout(() => {
        // Redirecionar para dashboard após login bem-sucedido
        navigate('/dashboard')
      }, 100)
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-revio-light via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-2xl shadow-revio mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-revio-primary to-revio-secondary bg-clip-text text-transparent">
            SpedRevio
          </h1>
          <p className="text-revio-gray-600 mt-2">
            Sistema de Gerenciamento Fiscal
          </p>
        </div>

        {/* Formulário de Login */}
        <div className="bg-white rounded-2xl shadow-revio-lg border border-revio-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-revio-gray-800 mb-2">
              Fazer Login
            </h2>
            <p className="text-revio-gray-600">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            {/* Campo Usuário */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-revio-gray-700 mb-2">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-revio-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-revio-gray-300 rounded-xl focus:ring-2 focus:ring-revio-primary focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="Digite seu usuário"
                  disabled={loading}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-revio-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-revio-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-revio-gray-300 rounded-xl focus:ring-2 focus:ring-revio-primary focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="Digite sua senha"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full bg-gradient-to-r from-revio-primary to-revio-secondary text-white font-semibold py-3 px-4 rounded-xl hover:shadow-revio-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>

          {/* Informações Adicionais */}
          <div className="mt-8 pt-6 border-t border-revio-gray-200">
            <div className="text-center">
              <p className="text-xs text-revio-gray-500">
                Sistema de autenticação seguro com criptografia JWT
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-revio-gray-600">
            © 2025 <span className="font-semibold text-revio-primary">Revio</span>. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}