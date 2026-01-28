// Serviço de conectividade conforme steering rules
import { API_ENDPOINTS } from '@fiscal/shared/constants/api-endpoints';

class ConnectivityService {
  private isOnline = navigator.onLine;
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000; // 30 segundos
  private healthStatus = true;
  
  constructor() {
    // Monitorar eventos de conectividade
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyConnectivityChange();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.healthStatus = false;
      this.notifyConnectivityChange();
    });
  }

  async isConnected(): Promise<boolean> {
    if (!this.isOnline) return false;
    
    // Health check inteligente - não agressivo
    const now = Date.now();
    if (now - this.lastHealthCheck > this.healthCheckInterval) {
      await this.checkBackendHealth();
      this.lastHealthCheck = now;
    }
    
    return this.healthStatus;
  }

  private async checkBackendHealth(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(API_ENDPOINTS.HEALTH, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.healthStatus = response.ok;
    } catch {
      this.healthStatus = false;
    }
  }

  private notifyConnectivityChange(): void {
    // Emitir evento para componentes interessados
    window.dispatchEvent(new CustomEvent('connectivityChange', {
      detail: { isOnline: this.isOnline, isHealthy: this.healthStatus }
    }));
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      isHealthy: this.healthStatus
    };
  }
}

export const connectivityService = new ConnectivityService();