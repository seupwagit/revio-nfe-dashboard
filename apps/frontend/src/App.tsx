import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

// Configure PDF.js worker BEFORE any other imports that might use it
import './utils/pdfWorkerConfig'

import Layout from './components/Layout'
import PDFTestComponent from './components/PDFTestComponent'
import ProtectedRoute from './components/ProtectedRoute'
import { validateEnv } from './config/env'
import { AuthProvider } from './contexts/AuthContext'
import { NFProvider } from './contexts/NFContext'
import { NotificationProvider, useNotify } from './contexts/NotificationContext'
import Analytics from './pages/Analytics'
import Dashboard from './pages/Dashboard'
import DebugAPI from './pages/DebugAPI'
import Detalhes from './pages/Detalhes'
import DocumentosFiscais from './pages/DocumentosFiscais'
import Login from './pages/Login'
import NotasFiscais from './pages/NotasFiscais'
import TailwindTest from './pages/TailwindTest'
import TestDelphiFormat from './pages/TestDelphiFormat'
import TestDownload from './pages/TestDownload'
import TestHeaders from './pages/TestHeaders'
import TestRealRequest from './pages/TestRealRequest'
import { ErrorHandler } from './services/errorHandler'

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
            <Route path="/pdf-test" element={<PDFTestComponent />} />
            <Route path="/test-headers" element={<TestHeaders />} />
            <Route path="/test-real" element={<TestRealRequest />} />
            <Route path="/test-delphi" element={<TestDelphiFormat />} />
            <Route path="/test-download" element={<TestDownload />} />
            <Route path="/tailwind-test" element={<TailwindTest />} />
            
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
