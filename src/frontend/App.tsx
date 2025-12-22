import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { NFProvider } from './contexts/NFContext'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider, useNotify } from './contexts/NotificationContext'
import { ErrorHandler } from './services/errorHandler'
import { validateEnv } from './config/env'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NotasFiscais from './pages/NotasFiscais'
import DocumentosFiscais from './pages/DocumentosFiscais'
import Detalhes from './pages/Detalhes'
import DebugAPI from './pages/DebugAPI'
import TestHeaders from './pages/TestHeaders'
import TestRealRequest from './pages/TestRealRequest'
import TestDelphiFormat from './pages/TestDelphiFormat'
import TestDownload from './pages/TestDownload'
import Analytics from './pages/Analytics'
import { ErrorHandlingExample } from './examples/ErrorHandlingExample'
import { StorageSecurityExample } from './examples/StorageSecurityExample'

// Validar variáveis de ambiente ao iniciar
validateEnv()

/**
 * Componente interno que configura o ErrorHandler
 * Precisa estar dentro do NotificationProvider para ter acesso ao useNotify
 */
function AppContent() {
  const notify = useNotify()

  useEffect(() => {
    // Configurar ErrorHandler para usar o sistema de notificações
    ErrorHandler.setNotifyFunction((type, message, options) => {
      notify[type](message, options)
    })
  }, [notify])

  return (
    <AuthProvider>
      <NFProvider>
        <BrowserRouter>
          <Routes>
            {/* Rota de Login (não protegida) */}
            <Route path="/login" element={<Login />} />
            
            {/* Rotas de Debug (não protegidas para desenvolvimento) */}
            <Route path="/debug" element={<DebugAPI />} />
            <Route path="/test-headers" element={<TestHeaders />} />
            <Route path="/test-real" element={<TestRealRequest />} />
            <Route path="/test-delphi" element={<TestDelphiFormat />} />
            <Route path="/test-download" element={<TestDownload />} />
            <Route path="/test-errors" element={<ErrorHandlingExample />} />
            <Route path="/test-storage" element={<StorageSecurityExample />} />
            
            {/* Rotas Protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="notas" element={<DocumentosFiscais />} />
              <Route path="notas-cards" element={<NotasFiscais />} />
              <Route path="notas/:id" element={<Detalhes />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NFProvider>
    </AuthProvider>
  )
}

function App() {
  return (
    <NotificationProvider position="top-right">
      <AppContent />
    </NotificationProvider>
  )
}

export default App
