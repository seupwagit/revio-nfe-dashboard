/**
 * Exemplo de Uso do Sistema de Tratamento de Erros
 * 
 * Este arquivo demonstra como integrar e usar o sistema de notificações
 * e tratamento de erros em componentes React
 */

import React, { useEffect } from 'react';
import { NotificationProvider, useNotify } from '../contexts/NotificationContext';
import { ErrorHandler } from '../services/errorHandler';
import { httpService } from '../services/httpService';
import { ErrorAlert, SuccessAlert, WarningAlert, InfoAlert } from '../components/ui/Alert';
import { ErrorModal } from '../components/ui/Modal';

// Componente principal que deve envolver toda a aplicação
export const AppWithNotifications: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider position="top-right">
      <AppContent>
        {children}
      </AppContent>
    </NotificationProvider>
  );
};

// Componente que configura o error handler
const AppContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notify = useNotify();

  useEffect(() => {
    // Configurar o error handler com a função de notificação
    ErrorHandler.setNotifyFunction((type, message, options) => {
      notify[type](message, options);
    });
  }, [notify]);

  return <>{children}</>;
};

// Exemplo de componente que usa o sistema de notificações
export const ErrorHandlingExample: React.FC = () => {
  const notify = useNotify();
  const [showModal, setShowModal] = React.useState(false);

  // Exemplo de uso direto das notificações
  const handleDirectNotifications = () => {
    notify.success('Operação realizada com sucesso!');
    notify.error('Erro ao processar dados', { persistent: true });
    notify.warning('Atenção: dados podem estar desatualizados');
    notify.info('Nova funcionalidade disponível');
  };

  // Exemplo de requisição HTTP com tratamento automático de erros
  const handleApiCall = async () => {
    // Requisição com tratamento automático de erros
    const response = await httpService.get('/api/users', {
      errorContext: 'Carregamento de usuários'
    });

    if (response.success) {
      notify.success('Usuários carregados com sucesso!');
      console.log('Dados:', response.data);
    }
    // Erros são tratados automaticamente pelo httpService + ErrorHandler
  };

  // Exemplo de requisição sem notificação automática
  const handleSilentApiCall = async () => {
    const response = await httpService.get('/api/data', {
      showErrorNotification: false // Desabilita notificação automática
    });

    if (!response.success) {
      // Tratar erro manualmente
      notify.error(`Erro personalizado: ${response.error}`);
    }
  };

  // Exemplo de upload com feedback
  const handleFileUpload = async (file: File) => {
    const response = await httpService.uploadFile('/api/upload', file, {}, {
      errorContext: 'Upload de arquivo'
    });

    if (response.success) {
      notify.success('Arquivo enviado com sucesso!', {
        title: 'Upload Concluído'
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Sistema de Tratamento de Erros
      </h1>

      {/* Exemplos de Alertas Inline */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Alertas Inline</h2>
        
        <SuccessAlert
          title="Sucesso"
          message="Operação concluída com êxito!"
          onClose={() => console.log('Alert fechado')}
        />
        
        <ErrorAlert
          title="Erro"
          message="Falha ao processar a requisição. Tente novamente."
          actions={
            <button className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded">
              Tentar Novamente
            </button>
          }
        />
        
        <WarningAlert
          message="Alguns dados podem estar desatualizados."
        />
        
        <InfoAlert
          title="Informação"
          message="Nova funcionalidade disponível na próxima atualização."
        />
      </div>

      {/* Botões de Teste */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Testes de Notificação</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDirectNotifications}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Notificações Diretas
          </button>
          
          <button
            onClick={handleApiCall}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Requisição HTTP
          </button>
          
          <button
            onClick={handleSilentApiCall}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Requisição Silenciosa
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Modal de Erro
          </button>
        </div>
      </div>

      {/* Input de Upload */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upload de Arquivo</h2>
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(file);
            }
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Modal de Erro */}
      <ErrorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Erro Crítico"
        actions={
          <div className="space-x-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                notify.info('Tentando novamente...');
                setShowModal(false);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        }
      >
        <div className="text-sm text-gray-600">
          <p>Ocorreu um erro crítico no sistema. Detalhes técnicos:</p>
          <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
            Error: Connection timeout after 30 seconds
            <br />
            Code: CONNECTION_TIMEOUT
            <br />
            Timestamp: {new Date().toISOString()}
          </div>
        </div>
      </ErrorModal>
    </div>
  );
};

// Exemplo de como usar em um hook personalizado
export const useApiWithNotifications = () => {
  const notify = useNotify();

  const fetchData = async (endpoint: string, options?: any) => {
    const response = await httpService.get(endpoint, {
      errorContext: options?.context || 'Carregamento de dados',
      ...options
    });

    if (response.success && options?.showSuccessMessage) {
      notify.success(options.successMessage || 'Dados carregados com sucesso!');
    }

    return response;
  };

  const saveData = async (endpoint: string, data: any, options?: any) => {
    const response = await httpService.post(endpoint, data, {
      errorContext: options?.context || 'Salvamento de dados',
      ...options
    });

    if (response.success) {
      notify.success(options?.successMessage || 'Dados salvos com sucesso!');
    }

    return response;
  };

  return {
    fetchData,
    saveData,
    notify
  };
};