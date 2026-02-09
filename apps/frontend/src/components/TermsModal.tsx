import { FileText, ShieldCheck, X } from 'lucide-react';
import React from 'react';
/**
 * Terms of Use Modal - Modal de Termos de Uso
 * 
 * Exibe os termos de uso obrigatórios para o usuário.
 * Armazena o aceite no localStorage.
 */

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-revio-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-revio-gray-200 overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-revio-primary to-revio-secondary p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Termos de Uso e Privacidade</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            Leia atentamente os termos de uso antes de continuar.
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-revio-gray-700 leading-relaxed text-sm scrollbar-thin scrollbar-thumb-revio-gray-200 scrollbar-track-transparent">
          <section>
            <h3 className="font-bold text-revio-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-revio-primary" />
              1. Aceitação dos Termos
            </h3>
            <p>
              Ao utilizar a plataforma SpedRevio, você concorda expressamente com os presentes Termos de Uso e Política de Privacidade. Este dashboard é ferramenta de uso profissional para gestão de documentos fiscais eletrônicos.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-revio-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-revio-primary" />
              2. Uso dos Dados
            </h3>
            <p>
              O sistema processa informações extraídas de NF-e, CT-e e CF-e armazenadas no banco de dados da sua organização. O usuário é responsável por manter o sigilo de suas credenciais de acesso e pela legalidade das consultas realizadas.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-revio-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-revio-primary" />
              3. Responsabilidades
            </h3>
            <p>
              A Revio garante a disponibilidade das funcionalidades descritas, mas não se responsabiliza por inconsistências nos dados originários da SEFAZ ou de outros órgãos emissores. O uso das informações contidas aqui é de inteira responsabilidade do cliente.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-revio-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-revio-primary" />
              4. Privacidade
            </h3>
            <p>
              Seguimos rigorosamente a LGPD (Lei Geral de Proteção de Dados). Nenhum dado fiscal carregado nesta ferramenta é compartilhado com terceiros sem autorização expressa do contratante, sendo utilizado exclusivamente para os fins de auditoria e gestão previstos no contrato de licença.
            </p>
          </section>

          <section className="bg-revio-light/50 p-4 rounded-xl border border-revio-light">
            <p className="font-medium text-revio-primary">
              Este documento serve como base legal para o uso do sistema SpedRevio.
            </p>
          </section>
        </div>

        {/* Action Button */}
        <div className="p-6 bg-revio-gray-50 border-t border-revio-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-revio-primary to-revio-secondary text-white font-bold rounded-xl shadow-revio hover:shadow-revio-lg hover:scale-[1.01] transition-all duration-200"
          >
            <span>Entendido</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
