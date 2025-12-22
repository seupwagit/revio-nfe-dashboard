/**
 * Handler Centralizado de Erros HTTP
 * 
 * Processa erros HTTP e exibe mensagens amigáveis ao usuário
 * Integra com o sistema de notificações para feedback visual
 */

import { HttpResponse } from './httpService';

export interface ErrorInfo {
  code: string;
  message: string;
  title?: string;
  type: 'error' | 'warning' | 'info';
  showToast?: boolean;
  showModal?: boolean;
  persistent?: boolean;
}

// Mapeamento de códigos de erro para mensagens amigáveis
const errorMessages: Record<string, ErrorInfo> = {
  // Erros de Autenticação
  'HTTP_401': {
    code: 'HTTP_401',
    title: 'Sessão Expirada',
    message: 'Sua sessão expirou. Você será redirecionado para o login.',
    type: 'warning',
    showToast: true
  },
  'AUTH_ERROR': {
    code: 'AUTH_ERROR',
    title: 'Erro de Autenticação',
    message: 'Credenciais inválidas. Verifique seu usuário e senha.',
    type: 'error',
    showToast: true
  },
  'TOKEN_EXPIRED': {
    code: 'TOKEN_EXPIRED',
    title: 'Token Expirado',
    message: 'Sua sessão expirou. Faça login novamente.',
    type: 'warning',
    showToast: true
  },

  // Erros de Autorização
  'HTTP_403': {
    code: 'HTTP_403',
    title: 'Acesso Negado',
    message: 'Você não tem permissão para acessar este recurso.',
    type: 'error',
    showToast: true
  },
  'AUTHORIZATION_ERROR': {
    code: 'AUTHORIZATION_ERROR',
    title: 'Sem Permissão',
    message: 'Você não tem permissão para realizar esta ação.',
    type: 'error',
    showToast: true
  },

  // Erros de Validação
  'HTTP_400': {
    code: 'HTTP_400',
    title: 'Dados Inválidos',
    message: 'Os dados enviados são inválidos. Verifique as informações e tente novamente.',
    type: 'error',
    showToast: true
  },
  'VALIDATION_ERROR': {
    code: 'VALIDATION_ERROR',
    title: 'Erro de Validação',
    message: 'Alguns campos contêm informações inválidas.',
    type: 'error',
    showToast: true
  },

  // Erros de Recurso
  'HTTP_404': {
    code: 'HTTP_404',
    title: 'Não Encontrado',
    message: 'O recurso solicitado não foi encontrado.',
    type: 'error',
    showToast: true
  },
  'HTTP_409': {
    code: 'HTTP_409',
    title: 'Conflito',
    message: 'Já existe um registro com essas informações.',
    type: 'warning',
    showToast: true
  },

  // Erros de Servidor
  'HTTP_500': {
    code: 'HTTP_500',
    title: 'Erro do Servidor',
    message: 'Ocorreu um erro interno no servidor. Tente novamente em alguns instantes.',
    type: 'error',
    showToast: true,
    persistent: true
  },
  'HTTP_502': {
    code: 'HTTP_502',
    title: 'Serviço Indisponível',
    message: 'O serviço está temporariamente indisponível. Tente novamente em alguns instantes.',
    type: 'error',
    showToast: true
  },
  'HTTP_503': {
    code: 'HTTP_503',
    title: 'Serviço em Manutenção',
    message: 'O serviço está em manutenção. Tente novamente mais tarde.',
    type: 'warning',
    showToast: true,
    persistent: true
  },

  // Erros de Conexão
  'CONNECTION_ERROR': {
    code: 'CONNECTION_ERROR',
    title: 'Erro de Conexão',
    message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
    type: 'error',
    showToast: true,
    persistent: true
  },
  'REQUEST_TIMEOUT': {
    code: 'REQUEST_TIMEOUT',
    title: 'Tempo Esgotado',
    message: 'A requisição demorou muito para responder. Tente novamente.',
    type: 'warning',
    showToast: true
  },
  'NETWORK_ERROR': {
    code: 'NETWORK_ERROR',
    title: 'Erro de Rede',
    message: 'Problema de conectividade. Verifique sua conexão e tente novamente.',
    type: 'error',
    showToast: true
  },

  // Erros de Upload/Download
  'UPLOAD_ERROR': {
    code: 'UPLOAD_ERROR',
    title: 'Erro no Upload',
    message: 'Não foi possível enviar o arquivo. Verifique o formato e tamanho.',
    type: 'error',
    showToast: true
  },
  'FILE_TOO_LARGE': {
    code: 'FILE_TOO_LARGE',
    title: 'Arquivo Muito Grande',
    message: 'O arquivo é muito grande. O tamanho máximo permitido é 10MB.',
    type: 'warning',
    showToast: true
  },
  'INVALID_FILE_TYPE': {
    code: 'INVALID_FILE_TYPE',
    title: 'Tipo de Arquivo Inválido',
    message: 'Tipo de arquivo não suportado. Use apenas PDF, Excel ou imagens.',
    type: 'warning',
    showToast: true
  },

  // Erros de Base de Dados
  'DATABASE_ERROR': {
    code: 'DATABASE_ERROR',
    title: 'Erro na Base de Dados',
    message: 'Erro ao acessar a base de dados. Tente novamente em alguns instantes.',
    type: 'error',
    showToast: true
  },
  'DATABASE_UNAVAILABLE': {
    code: 'DATABASE_UNAVAILABLE',
    title: 'Base de Dados Indisponível',
    message: 'A base de dados está temporariamente indisponível.',
    type: 'error',
    showToast: true,
    persistent: true
  }
};

export class ErrorHandler {
  private static notifyFunction: ((type: 'success' | 'error' | 'warning' | 'info', message: string, options?: any) => void) | null = null;

  /**
   * Configura a função de notificação
   */
  static setNotifyFunction(notifyFn: (type: 'success' | 'error' | 'warning' | 'info', message: string, options?: any) => void) {
    this.notifyFunction = notifyFn;
  }

  /**
   * Processa erro HTTP e exibe notificação apropriada
   */
  static handleHttpError(response: HttpResponse, context?: string): ErrorInfo {
    const code = response.code || 'UNKNOWN_ERROR';
    const errorInfo = this.getErrorInfo(code, response.error);

    // Adicionar contexto se fornecido
    if (context) {
      errorInfo.message = `${context}: ${errorInfo.message}`;
    }

    // Exibir notificação se configurado
    if (this.notifyFunction && errorInfo.showToast) {
      this.notifyFunction(errorInfo.type, errorInfo.message, {
        title: errorInfo.title,
        persistent: errorInfo.persistent,
        duration: errorInfo.persistent ? 0 : undefined
      });
    }

    return errorInfo;
  }

  /**
   * Obtém informações do erro baseado no código
   */
  static getErrorInfo(code: string, customMessage?: string): ErrorInfo {
    const errorInfo = errorMessages[code];
    
    if (errorInfo) {
      return {
        ...errorInfo,
        message: customMessage || errorInfo.message
      };
    }

    // Erro desconhecido
    return {
      code: 'UNKNOWN_ERROR',
      title: 'Erro Inesperado',
      message: customMessage || 'Ocorreu um erro inesperado. Tente novamente.',
      type: 'error',
      showToast: true
    };
  }

  /**
   * Trata erros de validação de formulário
   */
  static handleValidationErrors(errors: Record<string, string[]>): void {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');

    if (this.notifyFunction) {
      this.notifyFunction('error', errorMessages, {
        title: 'Erro de Validação',
        persistent: true
      });
    }
  }

  /**
   * Exibe mensagem de sucesso
   */
  static showSuccess(message: string, title?: string): void {
    if (this.notifyFunction) {
      this.notifyFunction('success', message, { title });
    }
  }

  /**
   * Exibe mensagem de aviso
   */
  static showWarning(message: string, title?: string): void {
    if (this.notifyFunction) {
      this.notifyFunction('warning', message, { title });
    }
  }

  /**
   * Exibe mensagem informativa
   */
  static showInfo(message: string, title?: string): void {
    if (this.notifyFunction) {
      this.notifyFunction('info', message, { title });
    }
  }

  /**
   * Registra novo tipo de erro
   */
  static registerErrorType(code: string, errorInfo: ErrorInfo): void {
    errorMessages[code] = errorInfo;
  }
}

// Função utilitária para usar em componentes
export const handleApiError = (response: HttpResponse, context?: string) => {
  return ErrorHandler.handleHttpError(response, context);
};