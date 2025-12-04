/**
 * Gerenciador de Reconexão MongoDB
 * 
 * Implementa estratégia de reconexão automática com backoff exponencial.
 * Quando a conexão falha, tenta reconectar automaticamente com delays crescentes
 * entre as tentativas para evitar sobrecarregar o servidor.
 * 
 * Fórmula do backoff exponencial:
 * delay(n) = min(baseDelay * backoffMultiplier^n, maxDelay)
 * 
 * Exemplo com baseDelay=1000ms, backoffMultiplier=2:
 * - Tentativa 1: 1000ms (1s)
 * - Tentativa 2: 2000ms (2s)
 * - Tentativa 3: 4000ms (4s)
 * - Tentativa 4: 8000ms (8s)
 * - Tentativa 5: 16000ms (16s)
 * - Tentativa 6+: 30000ms (30s - maxDelay)
 * 
 * @module reconnectionManager
 */

import { MongoConnectionService } from './mongoConnection';

/**
 * Configuração do gerenciador de reconexão
 */
export interface ReconnectionConfig {
  /** Número máximo de tentativas de reconexão */
  maxRetries: number;
  /** Delay inicial em milissegundos */
  baseDelay: number;
  /** Delay máximo em milissegundos */
  maxDelay: number;
  /** Multiplicador para backoff exponencial */
  backoffMultiplier: number;
}

/**
 * Configuração padrão de reconexão
 * 
 * - 10 tentativas máximas
 * - Delay inicial de 1 segundo
 * - Delay máximo de 30 segundos
 * - Multiplicador de 2 (dobra a cada tentativa)
 */
export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  maxRetries: 10,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
};

/**
 * Gerenciador de Reconexão MongoDB
 * 
 * Gerencia tentativas de reconexão automática com backoff exponencial.
 * 
 * @example
 * ```typescript
 * const manager = new ReconnectionManager(connectionService);
 * 
 * try {
 *   await manager.reconnect();
 *   console.log('Reconectado com sucesso!');
 * } catch (error) {
 *   console.error('Falha ao reconectar após todas tentativas');
 * }
 * ```
 */
export class ReconnectionManager {
  private retries: number = 0;
  private config: ReconnectionConfig;
  private connection: MongoConnectionService;
  private isReconnecting: boolean = false;

  /**
   * Cria um novo gerenciador de reconexão
   * 
   * @param connection Serviço de conexão MongoDB
   * @param config Configuração de reconexão (opcional)
   */
  constructor(
    connection: MongoConnectionService,
    config: Partial<ReconnectionConfig> = {}
  ) {
    this.connection = connection;
    this.config = {
      ...DEFAULT_RECONNECTION_CONFIG,
      ...config
    };
  }

  /**
   * Tenta reconectar ao MongoDB com backoff exponencial
   * 
   * Executa múltiplas tentativas de reconexão com delays crescentes
   * entre cada tentativa. Se todas as tentativas falharem, lança erro.
   * 
   * @throws {Error} Se todas as tentativas de reconexão falharem
   * 
   * @example
   * ```typescript
   * try {
   *   await reconnectionManager.reconnect();
   * } catch (error) {
   *   console.error('Não foi possível reconectar:', error);
   * }
   * ```
   */
  public async reconnect(): Promise<void> {
    if (this.isReconnecting) {
      console.log('⏳ MongoDB: Reconexão já em andamento...');
      return;
    }

    this.isReconnecting = true;
    this.retries = 0;

    console.group('🔄 MongoDB: Iniciando processo de reconexão');

    try {
      while (this.retries < this.config.maxRetries) {
        const delay = this.calculateDelay();
        
        console.log(`📊 Tentativa ${this.retries + 1}/${this.config.maxRetries}`);
        console.log(`⏱️ Aguardando ${delay}ms antes de tentar...`);
        
        await this.sleep(delay);

        try {
          await this.connection.connect();
          
          // Verifica se a conexão está realmente saudável
          const isHealthy = await this.connection.isHealthy();
          
          if (isHealthy) {
            this.retries = 0;
            this.isReconnecting = false;
            console.log('✅ MongoDB: Reconexão bem-sucedida!');
            console.groupEnd();
            return;
          } else {
            throw new Error('Conexão estabelecida mas health check falhou');
          }
        } catch (error) {
          this.retries++;
          this.logRetry(error);

          if (this.retries >= this.config.maxRetries) {
            throw new Error(
              `Falha ao reconectar após ${this.config.maxRetries} tentativas: ${
                error instanceof Error ? error.message : 'Erro desconhecido'
              }`
            );
          }
        }
      }
    } finally {
      this.isReconnecting = false;
      console.groupEnd();
    }
  }

  /**
   * Calcula o delay para a próxima tentativa usando backoff exponencial
   * 
   * Fórmula: delay = min(baseDelay * backoffMultiplier^retries, maxDelay)
   * 
   * @returns Delay em milissegundos
   * 
   * @example
   * ```typescript
   * // Com baseDelay=1000, backoffMultiplier=2, retries=3
   * const delay = manager.calculateDelay(); // 8000ms (8 segundos)
   * ```
   */
  private calculateDelay(): number {
    const delay = this.config.baseDelay * Math.pow(
      this.config.backoffMultiplier,
      this.retries
    );
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Aguarda um período de tempo
   * 
   * @param ms Milissegundos para aguardar
   * @returns Promise que resolve após o delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Loga informações sobre a tentativa de reconexão
   * 
   * @param error Erro que causou a falha na reconexão
   */
  private logRetry(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    console.group(`❌ Tentativa ${this.retries} falhou`);
    console.error('Erro:', errorMessage);
    
    if (this.retries < this.config.maxRetries) {
      const nextDelay = this.calculateDelay();
      console.log(`⏭️ Próxima tentativa em ${nextDelay}ms`);
    } else {
      console.error('🚫 Número máximo de tentativas atingido');
    }
    
    console.groupEnd();
  }

  /**
   * Reseta o contador de tentativas
   * 
   * Útil quando a conexão é restaurada manualmente.
   */
  public reset(): void {
    this.retries = 0;
    this.isReconnecting = false;
    console.log('🔄 MongoDB: Contador de reconexão resetado');
  }

  /**
   * Obtém o número atual de tentativas
   * 
   * @returns Número de tentativas realizadas
   */
  public getRetries(): number {
    return this.retries;
  }

  /**
   * Verifica se está em processo de reconexão
   * 
   * @returns true se está reconectando, false caso contrário
   */
  public isReconnectingNow(): boolean {
    return this.isReconnecting;
  }

  /**
   * Atualiza a configuração de reconexão
   * 
   * @param config Nova configuração (parcial)
   * 
   * @example
   * ```typescript
   * manager.updateConfig({
   *   maxRetries: 15,
   *   baseDelay: 2000
   * });
   * ```
   */
  public updateConfig(config: Partial<ReconnectionConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    console.log('⚙️ MongoDB: Configuração de reconexão atualizada', this.config);
  }
}

/**
 * Cria um gerenciador de reconexão com configuração padrão
 * 
 * @param connection Serviço de conexão MongoDB
 * @returns Gerenciador de reconexão configurado
 * 
 * @example
 * ```typescript
 * import { mongoConnectionService } from './mongoConnection';
 * import { createReconnectionManager } from './reconnectionManager';
 * 
 * const manager = createReconnectionManager(mongoConnectionService);
 * await manager.reconnect();
 * ```
 */
export function createReconnectionManager(
  connection: MongoConnectionService,
  config?: Partial<ReconnectionConfig>
): ReconnectionManager {
  return new ReconnectionManager(connection, config);
}
