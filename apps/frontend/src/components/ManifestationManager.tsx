/**
 * ManifestationManager - Componente de Gerenciamento de Manifestações
 * 
 * Permite selecionar o tipo de manifestação e agendar para os documentos selecionados.
 */

import { AlertCircle, CheckCircle, FileText, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useSelection } from '../hooks/useSelection';
import { manifestationService } from '../services/manifestationService';
import { ManifestationTypeSelector } from './ManifestationTypeSelector';

interface ManifestationManagerProps {
  className?: string;
}

export default function ManifestationManager({ className = '' }: ManifestationManagerProps) {
  const { selectionCount, getSelectedChaves, clearSelection } = useSelection();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Não exibir se não há seleção
  if (selectionCount === 0) {
    return null;
  }

  const handleManifestation = async () => {
    if (!selectedType) {
      setMessage({
        type: 'error',
        text: 'Selecione um tipo de manifestação'
      });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      const chaves = getSelectedChaves();
      
      if (chaves.length === 0) {
        setMessage({
          type: 'error',
          text: 'Nenhum documento selecionado'
        });
        return;
      }

      // Agendar manifestação
      const result = await manifestationService.scheduleManifestations(selectedType, chaves);

      // Sucesso
      setMessage({
        type: 'success',
        text: `${result.scheduledCount} manifestações agendadas com sucesso!`
      });

      // Limpar seleção após 3 segundos
      setTimeout(() => {
        clearSelection();
        setMessage(null);
        setSelectedType(null);
      }, 3000);

    } catch (error: any) {
      console.error('[ManifestationManager] Erro ao agendar manifestação:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao agendar manifestação'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dismissMessage = () => {
    setMessage(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Container de Manifestação */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-xl shadow-revio border border-revio-gray-200 gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-10 h-10 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-revio-gray-800">
              {selectionCount} documento{selectionCount !== 1 ? 's' : ''} selecionado{selectionCount !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-revio-gray-500">
              Selecione o tipo e agende a manifestação
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <ManifestationTypeSelector
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            disabled={isLoading}
          />

          <button
            onClick={handleManifestation}
            disabled={isLoading || !selectedType}
            className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-revio-primary to-revio-secondary text-white rounded-lg hover:shadow-revio transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Agendando...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Confirmar Manifestação</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {message && (
        <div className={`flex items-center justify-between p-4 rounded-xl border animate-in slide-in-from-top-2 duration-200 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800'
            : message.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center space-x-3">
            {message.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {message.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            {message.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600" />}
            <span className="font-medium">{message.text}</span>
          </div>
          
          <button
            onClick={dismissMessage}
            className="p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Dica */}
      <div className="text-xs text-revio-gray-500 bg-revio-light p-3 rounded-lg border border-revio-gray-100">
        <p>
          💡 <strong>Nota:</strong> As manifestações agendadas são processadas por robôs externos. 
          O status será atualizado conforme o processamento for concluído.
        </p>
      </div>
    </div>
  );
}
