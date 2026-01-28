/**
 * Abort Controller Manager Service
 * 
 * Manages request cancellation lifecycle using AbortController.
 * Ensures old requests are cancelled when new ones start.
 * 
 * Validates: Requirements 3.2, 3.5
 * Properties: 5 (Request Cancellation and Cleanup)
 */

export interface AbortControllerManagerInterface {
  create(key: string): AbortSignal;
  abort(key: string): void;
  abortAll(): void;
  isAborted(key: string): boolean;
  cleanup(): void;
  getActiveCount(): number;
}

export class AbortControllerManager implements AbortControllerManagerInterface {
  private controllers: Map<string, AbortController> = new Map();
  private abortedKeys: Set<string> = new Set();

  /**
   * Create a new AbortController for the given key
   * If a controller already exists for this key, it will be aborted first
   */
  create(key: string): AbortSignal {
    // Abort existing controller if it exists
    if (this.controllers.has(key)) {
      this.abort(key);
    }

    // Create new controller
    const controller = new AbortController();
    this.controllers.set(key, controller);
    
    // Remove from aborted keys if it was there
    this.abortedKeys.delete(key);

    // Add event listener to clean up when aborted
    controller.signal.addEventListener('abort', () => {
      this.abortedKeys.add(key);
      // Clean up after a short delay to allow error handling
      setTimeout(() => {
        this.controllers.delete(key);
        this.abortedKeys.delete(key);
      }, 100);
    }, { once: true });

    return controller.signal;
  }

  /**
   * Abort the controller for the given key
   */
  abort(key: string): void {
    const controller = this.controllers.get(key);
    if (controller && !controller.signal.aborted) {
      controller.abort();
    }
  }

  /**
   * Abort all active controllers
   */
  abortAll(): void {
    for (const [, controller] of this.controllers.entries()) {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }
  }

  /**
   * Check if a controller for the given key is aborted
   */
  isAborted(key: string): boolean {
    const controller = this.controllers.get(key);
    return controller ? controller.signal.aborted : this.abortedKeys.has(key);
  }

  /**
   * Check if a controller exists for the given key
   */
  hasController(key: string): boolean {
    return this.controllers.has(key);
  }

  /**
   * Get the AbortSignal for a key without creating a new one
   */
  getSignal(key: string): AbortSignal | null {
    const controller = this.controllers.get(key);
    return controller ? controller.signal : null;
  }

  /**
   * Get the number of active (non-aborted) controllers
   */
  getActiveCount(): number {
    let activeCount = 0;
    for (const controller of this.controllers.values()) {
      if (!controller.signal.aborted) {
        activeCount++;
      }
    }
    return activeCount;
  }

  /**
   * Get all active controller keys
   */
  getActiveKeys(): string[] {
    const activeKeys: string[] = [];
    for (const [key, controller] of this.controllers.entries()) {
      if (!controller.signal.aborted) {
        activeKeys.push(key);
      }
    }
    return activeKeys;
  }

  /**
   * Clean up aborted controllers and internal state
   */
  cleanup(): void {
    // Remove aborted controllers
    for (const [key, controller] of this.controllers.entries()) {
      if (controller.signal.aborted) {
        this.controllers.delete(key);
      }
    }

    // Clear aborted keys set
    this.abortedKeys.clear();
  }

  /**
   * Get statistics about the manager state
   */
  getStats(): {
    totalControllers: number;
    activeControllers: number;
    abortedControllers: number;
    abortedKeysCount: number;
  } {
    let abortedCount = 0;
    for (const controller of this.controllers.values()) {
      if (controller.signal.aborted) {
        abortedCount++;
      }
    }

    return {
      totalControllers: this.controllers.size,
      activeControllers: this.getActiveCount(),
      abortedControllers: abortedCount,
      abortedKeysCount: this.abortedKeys.size
    };
  }

  /**
   * Create an AbortSignal that will be aborted when any of the provided signals are aborted
   */
  static combineSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    // If any signal is already aborted, abort immediately
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        return controller.signal;
      }
    }

    // Listen for abort on any signal
    const abortHandler = () => {
      controller.abort();
      // Clean up listeners
      for (const signal of signals) {
        signal.removeEventListener('abort', abortHandler);
      }
    };

    for (const signal of signals) {
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    return controller.signal;
  }

  /**
   * Create an AbortSignal that will be aborted after a timeout
   */
  static createTimeoutSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // Clean up timeout if signal is aborted early
    controller.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
    }, { once: true });

    return controller.signal;
  }
}

/**
 * Singleton instance for global use
 */
export const abortControllerManager = new AbortControllerManager();

/**
 * Utility function to create a fetch with automatic abort on new requests
 */
export function createAbortableFetch(key: string) {
  return async function abortableFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // Create abort signal for this request
    const signal = abortControllerManager.create(key);
    
    // Combine with any existing signal from init
    const combinedSignal = init?.signal 
      ? AbortControllerManager.combineSignals(signal, init.signal)
      : signal;

    // Make the fetch request
    return fetch(input, {
      ...init,
      signal: combinedSignal
    });
  };
}

/**
 * Decorator for methods that should be abortable
 */
export function Abortable(key?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const abortKey = key || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      // Create abort signal for this method call
      const signal = abortControllerManager.create(abortKey);
      
      try {
        // Call original method with signal as first argument
        return await method.call(this, signal, ...args);
      } catch (error) {
        // If aborted, don't throw the error
        if (error instanceof Error && error.name === 'AbortError') {
          return null;
        }
        throw error;
      }
    };

    return descriptor;
  };
}