import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Menu, X } from 'lucide-react'
import { useState } from 'react'
import RAHAssistant from './RAHAssistant'
import UserDisplay from './UserDisplay'
import DownloadNotification from './DownloadNotification'

export default function Layout() {
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-revio-light via-white to-blue-50">
      {/* Header Moderno */}
      <header className="bg-white/80 backdrop-blur-lg shadow-revio border-b border-revio-gray-200 sticky top-0 z-50">
        <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo e Título */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-xl flex items-center justify-center shadow-revio">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-revio-primary to-revio-secondary bg-clip-text text-transparent">
                    SpedRevio
                  </h1>
                  <p className="text-xs text-revio-gray-500 font-medium">Dashboard NF-e</p>
                </div>
              </div>
            </div>

            {/* User Menu Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <UserDisplay />
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMenuAberto(!menuAberto)}
              className="md:hidden p-2 rounded-lg hover:bg-revio-light transition-colors"
            >
              {menuAberto ? (
                <X className="h-6 w-6 text-revio-primary" />
              ) : (
                <Menu className="h-6 w-6 text-revio-primary" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Moderna */}
          <aside className={`${menuAberto ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
            <nav className="card p-6 space-y-2">
              <div className="mb-6">
                <h2 className="text-xs font-bold text-revio-gray-500 uppercase tracking-wider mb-3">
                  Menu Principal
                </h2>
              </div>
              
              <Link
                to="/dashboard"
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive('/dashboard')
                    ? 'bg-gradient-to-r from-revio-primary to-revio-secondary text-white shadow-revio'
                    : 'text-revio-gray-700 hover:bg-revio-light hover:text-revio-primary'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  isActive('/dashboard')
                    ? 'bg-white/20'
                    : 'bg-revio-light group-hover:bg-white'
                }`}>
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className="font-semibold">Dashboard</span>
              </Link>

              <Link
                to="/analytics"
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive('/analytics')
                    ? 'bg-gradient-to-r from-revio-primary to-revio-secondary text-white shadow-revio'
                    : 'text-revio-gray-700 hover:bg-revio-light hover:text-revio-primary'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  isActive('/analytics')
                    ? 'bg-white/20'
                    : 'bg-revio-light group-hover:bg-white'
                }`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">Analytics</span>
                  <span className="text-xs opacity-70">MongoDB Direto</span>
                </div>
              </Link>

              <Link
                to="/notas"
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive('/notas')
                    ? 'bg-gradient-to-r from-revio-primary to-revio-secondary text-white shadow-revio'
                    : 'text-revio-gray-700 hover:bg-revio-light hover:text-revio-primary'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  isActive('/notas')
                    ? 'bg-white/20'
                    : 'bg-revio-light group-hover:bg-white'
                }`}>
                  <FileText className="h-5 w-5" />
                </div>
                <span className="font-semibold">Notas Fiscais</span>
              </Link>

              {/* Info Card */}
              <div className="mt-8 p-4 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-xl text-white">
                <h3 className="font-bold text-sm mb-2">💡 Dica</h3>
                <p className="text-xs opacity-90">
                  Use os filtros e o botão "Mostrar Filtros" para análises avançadas com filtros nos cabeçalhos e congelamento de colunas.
                </p>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-revio-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-revio-gray-600">
              © 2025 <span className="font-semibold text-revio-primary">Revio</span>. Todos os direitos reservados.
            </div>
            <div className="flex items-center space-x-6 text-sm text-revio-gray-600">
              <a href="https://revio.global" target="_blank" rel="noopener noreferrer" className="hover:text-revio-primary transition-colors">
                Site Oficial
              </a>
              <span>•</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* RAH - Assistente IA */}
      <RAHAssistant />

      {/* Notificações Globais de Download */}
      <DownloadNotification />
    </div>
  )
}
