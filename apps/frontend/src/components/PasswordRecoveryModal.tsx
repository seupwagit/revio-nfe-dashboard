/**
 * Password Recovery Modal - Modal de Recuperação de Senha
 * 
 * Exibe a página de recuperação de senha externa do SpedRevio em um iframe.
 */

import { ExternalLink } from 'lucide-react';
import React from 'react';
import DANFEModalWindow from './DANFEModalWindow';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose
}) => {
  const recoveryUrl = "https://appnfe.revio.digital/spedrevio/form.jsp?sys=SPE&action=openform&formID=21&mode=-1&goto=-1&filter=&scrolling=yes";
  
  const handleOpenExternal = () => {
    // Abrir em uma janela popup centralizada
    const width = 1000;
    const height = 800;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    window.open(
      recoveryUrl, 
      'SpedRevioRecovery', 
      `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
    );
    onClose();
  };

  return (
    <DANFEModalWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Recuperação de Senha - SpedRevio"
      initialWidth={500}
      initialHeight={450}
    >
      <div className="w-full h-full flex flex-col bg-white p-8 items-center text-center">
        {/* Ícone e Título Interno */}
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <ExternalLink className="h-10 w-10 text-revio-primary" />
        </div>
        
        <h3 className="text-xl font-bold text-revio-gray-800 mb-4">
          Acesso ao Portal de Recuperação
        </h3>
        
        <p className="text-revio-gray-600 mb-8 leading-relaxed">
          Para garantir sua segurança, o portal de recuperação de senha do SpedRevio deve ser acessado em uma janela dedicada. Clique no botão abaixo para prosseguir.
        </p>

        {/* Botão de Ação Principal */}
        <button
          onClick={handleOpenExternal}
          className="w-full py-4 bg-gradient-to-r from-revio-primary to-revio-secondary text-white font-bold rounded-xl shadow-revio-lg hover:shadow-revio-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-3"
        >
          <ExternalLink className="h-5 w-5" />
          <span>Abrir Portal de Recuperação</span>
        </button>

        <p className="mt-8 text-xs text-revio-gray-400">
          Você será redirecionado para o servidor seguro da Revio.
        </p>
      </div>
    </DANFEModalWindow>
  );
};

export default PasswordRecoveryModal;
