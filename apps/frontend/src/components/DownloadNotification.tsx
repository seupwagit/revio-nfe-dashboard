/**
 * DownloadNotification - Componente de Notificação Global de Downloads
 * 
 * Exibe notificações quando downloads estão prontos ou em processamento
 */

import { useState, useEffect } from 'react'
import { Download, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import { downloadMonitor } from '../services/DownloadMonitorService'
import { autoDownloadService } from '../services/AutoDownloadService'

interface Notification {
  id: string
  type: 'download_ready' | 'download_processing' | 'download_success' | 'download_error'
  title: string
  message: string
  downloadId?: number
  link?: string
  autoHide?: boolean
  timestamp: Date
}

export default function DownloadNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Callback para download pronto
    const handleDownloadReady = async (download: {
      downloadId: number
      link: string
      totalChaves: number
      processadas: number
    }) => {
      console.log('[DownloadNotification] Download pronto recebido:', download)

      // Adicionar notificação de processamento
      const processingNotification: Notification = {
        id: `processing_${download.downloadId}`,
        type: 'download_processing',
        title: 'Download Iniciando',
        message: `Iniciando download de ${download.totalChaves} documentos...`,
        downloadId: download.downloadId,
        timestamp: new Date()
      }

      setNotifications(prev => [...prev, processingNotification])

      // Processar download automático
      try {
        const result = await autoDownloadService.processAutoDownload(download)

        // Remover notificação de processamento
        setNotifications(prev => prev.filter(n => n.id !== processingNotification.id))

        if (result.success) {
          // Adicionar notificação de sucesso
          const successNotification: Notification = {
            id: `success_${download.downloadId}`,
            type: 'download_success',
            title: 'Download Iniciado',
            message: `Download de ${download.totalChaves} documentos foi iniciado com sucesso!`,
            downloadId: download.downloadId,
            autoHide: true,
            timestamp: new Date()
          }

          setNotifications(prev => [...prev, successNotification])

          // Auto-remover após 5 segundos
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== successNotification.id))
          }, 5000)

        } else {
          // Adicionar notificação de erro
          const errorNotification: Notification = {
            id: `error_${download.downloadId}`,
            type: 'download_error',
            title: 'Erro no Download',
            message: result.error || 'Erro desconhecido ao processar download',
            downloadId: download.downloadId,
            timestamp: new Date()
          }

          setNotifications(prev => [...prev, errorNotification])
        }

      } catch (error) {
        console.error('[DownloadNotification] Erro ao processar download:', error)

        // Remover notificação de processamento
        setNotifications(prev => prev.filter(n => n.id !== processingNotification.id))

        // Adicionar notificação de erro
        const errorNotification: Notification = {
          id: `error_${download.downloadId}`,
          type: 'download_error',
          title: 'Erro no Download',
          message: 'Erro interno ao processar download automático',
          downloadId: download.downloadId,
          timestamp: new Date()
        }

        setNotifications(prev => [...prev, errorNotification])
      }
    }

    // Callback para erros do monitor
    const handleMonitorError = (error: { message: string; timestamp: string }) => {
      console.error('[DownloadNotification] Erro do monitor:', error)

      const errorNotification: Notification = {
        id: `monitor_error_${Date.now()}`,
        type: 'download_error',
        title: 'Erro no Monitoramento',
        message: error.message,
        autoHide: true,
        timestamp: new Date()
      }

      setNotifications(prev => [...prev, errorNotification])

      // Auto-remover após 8 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== errorNotification.id))
      }, 8000)
    }

    // Registrar callbacks
    downloadMonitor.onDownloadReady(handleDownloadReady)
    downloadMonitor.onError(handleMonitorError)

    // Cleanup
    return () => {
      downloadMonitor.removeDownloadReadyCallback(handleDownloadReady)
      downloadMonitor.removeErrorCallback(handleMonitorError)
    }
  }, [])

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'download_ready':
        return <Download className="h-5 w-5 text-blue-600" />
      case 'download_processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'download_success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'download_error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Download className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'download_ready':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'download_processing':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'download_success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'download_error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            flex items-start space-x-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm
            transform transition-all duration-300 ease-in-out
            ${getNotificationStyles(notification.type)}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">
              {notification.title}
            </h4>
            <p className="text-sm opacity-90 mt-1">
              {notification.message}
            </p>
            {notification.downloadId && (
              <p className="text-xs opacity-70 mt-1">
                ID: {notification.downloadId}
              </p>
            )}
          </div>

          <button
            onClick={() => dismissNotification(notification.id)}
            className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}