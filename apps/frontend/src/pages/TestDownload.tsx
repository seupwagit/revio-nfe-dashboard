/**
 * TestDownload - Página de Teste do Sistema de Downloads
 * 
 * Página para testar o sistema completo de seleção e download
 */

import { useState } from 'react'
import { FileText } from 'lucide-react'
import SelectionCheckbox, { SelectionHeader } from '../components/SelectionCheckbox'
import DownloadManager from '../components/DownloadManager'
import { useSelection } from '../hooks/useSelection'

// Dados de exemplo para teste
const mockDocuments = [
  {
    chave: '35200114200166000187550010000000001123456789',
    numero: '000000001',
    serie: '001',
    emitente: 'Empresa Teste LTDA',
    valor: 1500.00,
    data: '2024-12-22'
  },
  {
    chave: '35200114200166000187550010000000002123456789',
    numero: '000000002',
    serie: '001',
    emitente: 'Fornecedor ABC LTDA',
    valor: 2300.50,
    data: '2024-12-22'
  },
  {
    chave: '35200114200166000187550010000000003123456789',
    numero: '000000003',
    serie: '001',
    emitente: 'Distribuidora XYZ S/A',
    valor: 890.75,
    data: '2024-12-21'
  },
  {
    chave: '35200114200166000187550010000000004123456789',
    numero: '000000004',
    serie: '001',
    emitente: 'Comercial 123 LTDA',
    valor: 3200.00,
    data: '2024-12-21'
  },
  {
    chave: '35200114200166000187550010000000005123456789',
    numero: '000000005',
    serie: '001',
    emitente: 'Indústria DEF S/A',
    valor: 5500.25,
    data: '2024-12-20'
  }
]

export default function TestDownload() {
  const { selectionCount, getSelectionStats } = useSelection()
  const [showStats, setShowStats] = useState(false)

  const stats = getSelectionStats()
  const allChaves = mockDocuments.map(doc => doc.chave)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-revio-gray-800">
            Teste do Sistema de Downloads
          </h1>
          <p className="text-revio-gray-600 mt-1">
            Página para testar seleção e agendamento de downloads
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 text-sm bg-revio-light text-revio-primary rounded-lg hover:bg-revio-primary hover:text-white transition-colors"
          >
            {showStats ? 'Ocultar' : 'Mostrar'} Estatísticas
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      {showStats && (
        <div className="bg-white rounded-xl shadow-revio border border-revio-gray-200 p-6">
          <h3 className="font-semibold text-revio-gray-800 mb-4">Estatísticas de Seleção</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-revio-light p-4 rounded-lg">
              <div className="text-2xl font-bold text-revio-primary">{stats.total}</div>
              <div className="text-sm text-revio-gray-600">Documentos Selecionados</div>
            </div>
            <div className="bg-revio-light p-4 rounded-lg">
              <div className="text-2xl font-bold text-revio-primary">{mockDocuments.length}</div>
              <div className="text-sm text-revio-gray-600">Total de Documentos</div>
            </div>
            <div className="bg-revio-light p-4 rounded-lg">
              <div className="text-sm font-medium text-revio-gray-600">Última Atualização</div>
              <div className="text-xs text-revio-gray-500">
                {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('pt-BR') : 'Nunca'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Documentos */}
      <div className="bg-white rounded-xl shadow-revio border border-revio-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-revio-gray-200">
          <h2 className="font-semibold text-revio-gray-800 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Notas Fiscais ({mockDocuments.length})</span>
            {selectionCount > 0 && (
              <span className="px-2 py-1 bg-revio-primary text-white text-xs rounded-full">
                {selectionCount} selecionados
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-revio-light">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-revio-gray-500 uppercase tracking-wider">
                  <SelectionHeader chaves={allChaves} />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-revio-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-revio-gray-500 uppercase tracking-wider">
                  Emitente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-revio-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-revio-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-revio-gray-500 uppercase tracking-wider">
                  Chave
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-revio-gray-200">
              {mockDocuments.map((doc) => (
                <tr key={doc.chave} className="hover:bg-revio-light/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <SelectionCheckbox chave={doc.chave} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-revio-gray-900">
                      {doc.numero}
                    </div>
                    <div className="text-sm text-revio-gray-500">
                      Série {doc.serie}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-revio-gray-900 max-w-xs truncate">
                      {doc.emitente}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-revio-gray-900">
                      R$ {doc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-revio-gray-900">
                      {new Date(doc.data).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs font-mono text-revio-gray-500 max-w-xs truncate">
                      {doc.chave}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Manager */}
      <DownloadManager />

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-3">Como Testar</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>1. <strong>Selecione documentos:</strong> Use os checkboxes para selecionar documentos individuais ou o checkbox do cabeçalho para selecionar todos.</p>
          <p>2. <strong>Confirme o download:</strong> Quando houver documentos selecionados, aparecerá o botão "Confirmar Download" abaixo da tabela.</p>
          <p>3. <strong>Monitore o progresso:</strong> Após agendar, o sistema monitorará automaticamente o status do download em background.</p>
          <p>4. <strong>Download automático:</strong> Quando o arquivo estiver pronto, será iniciado automaticamente e você receberá uma notificação.</p>
          <p>5. <strong>Persistência:</strong> A seleção é mantida mesmo ao navegar entre páginas ou recarregar o navegador.</p>
        </div>
      </div>
    </div>
  )
}