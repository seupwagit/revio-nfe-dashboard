/**
 * FloatingManifestationButton - Botão de Manifestação Flutuante
 * 
 * Componente que aparece quando há seleção na grid e permite agendar manifestações.
 * Fica fixo (sticky) no topo da área de conteúdo.
 */

import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2, Send, X } from 'lucide-react';
import { useState } from 'react';
import { useSelection } from '../hooks/useSelection';
import { manifestationService } from '../services/manifestationService';

interface FloatingManifestationButtonProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  className?: string;
  stickyTop?: boolean;
  topOffset?: number;
}

export default function FloatingManifestationButton({ 
  selectedType,
  onTypeChange,
  className = '', 
  stickyTop = false, 
  topOffset = 0 
}: FloatingManifestationButtonProps) {
  const { selectionCount, getSelectedChaves, clearSelection } = useSelection();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Só exibe se houver documentos selecionados E um tipo de manifestação escolhido
  if (selectionCount === 0 || !selectedType) {
    return null;
  }

  const handleManifestar = async () => {
    if (!selectedType || selectionCount === 0) return;

    try {
      setIsProcessing(true);
      setFeedback(null);
      
      const chaves = getSelectedChaves();
      const result = await manifestationService.scheduleManifestations(
        selectedType,
        chaves
      );

      setFeedback({
        type: 'success',
        message: `${result.scheduledCount} manifestações agendadas com sucesso!`
      });
      
      // Limpar seleção de documentos após agendamento bem sucedido
      setTimeout(() => {
        clearSelection();
        setFeedback(null);
        // O usuário quer desmarcar o tipo de manifestação após sucesso
        onTypeChange(null);
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao agendar manifestação:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Ocorreu um erro ao agendar a manifestação.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stickyStyles = stickyTop ? {
    position: 'sticky' as const,
    top: `${topOffset}px`,
    zIndex: 40
  } : {};

  return (
    <div 
      className={`card overflow-hidden border-2 border-revio-primary shadow-revio-lg transition-all duration-300 ${className}`}
      style={stickyStyles}
    >
      <div className="bg-gradient-to-r from-revio-primary to-revio-secondary p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2.5 rounded-xl shadow-inner">
              <Send className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white leading-none">
                  {selectionCount} {selectionCount === 1 ? 'documento selecionado' : 'documentos selecionados'}
                </h3>
                <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                  Agendamento de Manifestação
                </span>
              </div>
              <p className="text-white/80 text-sm mt-1">
                Clique para confirmar o agendamento da manifestação escolhida.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:flex p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              title={isExpanded ? "Recolher detalhes" : "Ver detalhes"}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            <button
              onClick={handleManifestar}
              disabled={isProcessing}
              className={`
                flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 
                rounded-xl font-bold transition-all duration-200 shadow-lg min-w-[200px]
                ${isProcessing 
                  ? 'bg-white/20 text-white cursor-not-allowed' 
                  : 'bg-white text-revio-primary hover:bg-revio-light hover:scale-105 active:scale-95'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Confirmar Manifestação</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                clearSelection();
                onTypeChange(null);
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              title="Limpar seleção"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Área de Detalhes e Feedback */}
      {(isExpanded || feedback) && (
        <div className="bg-white border-t border-revio-gray-100 p-4 animate-in slide-in-from-top duration-300">
          {feedback ? (
            <div className={`
              flex items-center space-x-3 p-4 rounded-xl border
              ${feedback.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'}
            `}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-bold text-sm">{feedback.type === 'success' ? 'Sucesso!' : 'Erro'}</p>
                <p className="text-sm opacity-90">{feedback.message}</p>
              </div>
              <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start space-x-3">
              <div className="bg-blue-100 p-1.5 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold mb-1">Informações importantes:</p>
                <ul className="list-disc list-inside space-y-1 opacity-90">
                  <li>As manifestações são processadas externamente pelo bot.</li>
                  <li>O status pode levar algumas horas para ser atualizado no sistema.</li>
                  <li>Esta ação agendará a manifestação para <strong>{selectionCount}</strong> documentos selecionados.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
