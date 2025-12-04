import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { NFProvider } from './contexts/NFContext'
import { validateEnv } from './config/env'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NotasFiscais from './pages/NotasFiscais'
import DocumentosFiscais from './pages/DocumentosFiscais'
import Detalhes from './pages/Detalhes'
import DebugAPI from './pages/DebugAPI'
import TestHeaders from './pages/TestHeaders'
import TestRealRequest from './pages/TestRealRequest'
import TestDelphiFormat from './pages/TestDelphiFormat'
import Analytics from './pages/Analytics'

// Validar variáveis de ambiente ao iniciar
validateEnv()

function App() {
  return (
    <NFProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/debug" element={<DebugAPI />} />
          <Route path="/test-headers" element={<TestHeaders />} />
          <Route path="/test-real" element={<TestRealRequest />} />
          <Route path="/test-delphi" element={<TestDelphiFormat />} />
          <Route path="/" element={<Layout />}>
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
  )
}

export default App
