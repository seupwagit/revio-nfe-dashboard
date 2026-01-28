import { AlertCircle, XCircle, RefreshCw, Key } from 'lucide-react'

interface ErrorAlertProps {
  error: {
    status?: number
    message: string
    data?: any
  }
  onRetry?: () => void
}

export default function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  const getErrorInfo = () => {
    if (error.status === 401) {
      return {
        icon: Key,
        title: 'Token de Autenticação Inválido',
        message: 'O token de acesso expirou ou está inválido. Entre em contato com o administrador para obter um novo token.',
        color: 'red',
        details: error.data?.mensagem || 'Acesso negado'
      }
    }

    if (error.status === 403) {
      return {
        icon: XCircle,
        title: 'Acesso Negado',
        message: 'Você não tem permissão para acessar este recurso.',
        color: 'red',
        details: error.data?.mensagem
      }
    }

    if (error.status === 404) {
      return {
        icon: AlertCircle,
        title: 'Recurso Não Encontrado',
        message: 'O recurso solicitado não foi encontrado. Verifique os parâmetros da consulta.',
        color: 'yellow',
        details: error.data?.mensagem
      }
    }

    if (error.status === 500) {
      return {
        icon: XCircle,
        title: 'Erro no Servidor',
        message: 'Ocorreu um erro no servidor. Tente novamente mais tarde.',
        color: 'red',
        details: error.data?.mensagem
      }
    }

    if (error.message?.includes('Network Error')) {
      return {
        icon: AlertCircle,
        title: 'Erro de Conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
        color: 'yellow',
        details: 'Verifique se o servidor está acessível'
      }
    }

    return {
      icon: AlertCircle,
      title: 'Erro Desconhecido',
      message: error.message || 'Ocorreu um erro inesperado.',
      color: 'red',
      details: error.data?.mensagem
    }
  }

  const info = getErrorInfo()
  const Icon = info.icon

  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      text: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      text: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    }
  }

  const colors = colorClasses[info.color as keyof typeof colorClasses]

  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 ${colors.bg} rounded-lg`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${colors.title} mb-2`}>
            {info.title}
          </h3>
          <p className={`${colors.text} mb-2`}>
            {info.message}
          </p>
          {info.details && (
            <div className={`mt-3 p-3 bg-white rounded-lg border ${colors.border}`}>
              <p className="text-sm font-mono text-gray-700">
                {info.details}
              </p>
            </div>
          )}
          {error.status === 401 && (
            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">💡 Como Resolver:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Solicite um novo token de acesso ao administrador</li>
                <li>Atualize o arquivo <code className="bg-blue-100 px-1 rounded">.env</code></li>
                <li>Altere a variável <code className="bg-blue-100 px-1 rounded">VITE_API_BEARER_TOKEN</code></li>
                <li>Reinicie o servidor (<code className="bg-blue-100 px-1 rounded">npm run dev</code>)</li>
              </ol>
            </div>
          )}
          {onRetry && error.status !== 401 && (
            <button
              onClick={onRetry}
              className={`mt-4 flex items-center gap-2 px-4 py-2 ${colors.button} text-white rounded-lg transition-colors`}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
