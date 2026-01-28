/**
 * State Persistence Utilities
 * Handles secure storage and retrieval of worker state using localStorage
 */

import { EnhancedWorkerState } from '../types/worker-state.interface';
import { createDefaultWorkerState, migrateWorkerState, validateWorkerState } from './state-validation';

/**
 * Storage key for worker state in localStorage
 */
const STORAGE_KEY = 'fiscal_worker_state';

/**
 * Encryption key storage key
 */
const ENCRYPTION_KEY_STORAGE = 'fiscal_worker_encryption_key';

/**
 * State persistence manager
 */
export class StatePersistenceManager {
  private encryptionKey: string | null = null;

  constructor() {
    this.initializeEncryptionKey();
  }

  /**
   * Saves worker state to localStorage with optional encryption
   */
  async saveState(state: EnhancedWorkerState): Promise<void> {
    try {
      // Update persistence metadata
      const stateToSave = {
        ...state,
        persistence: {
          ...state.persistence,
          lastSaved: Date.now(),
          expiresAt: Date.now() + state.config.maxStateAge
        }
      };

      let dataToStore: string;

      if (state.config.stateEncryption && this.encryptionKey) {
        // Encrypt the state data
        dataToStore = await this.encryptData(JSON.stringify(stateToSave));
      } else {
        dataToStore = JSON.stringify(stateToSave);
      }

      localStorage.setItem(STORAGE_KEY, dataToStore);
      
      // Store metadata separately for quick access
      const metadata = {
        encrypted: state.config.stateEncryption,
        version: state.persistence.version,
        lastSaved: stateToSave.persistence.lastSaved,
        expiresAt: stateToSave.persistence.expiresAt,
        workerId: state.workerId
      };
      
      localStorage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify(metadata));
      
    } catch (error) {
      console.error('[StatePersistence] Failed to save state:', error);
      throw new Error(`Failed to save worker state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads worker state from localStorage with decryption if needed
   */
  async loadState(): Promise<EnhancedWorkerState | null> {
    try {
      // Check metadata first
      const metadataStr = localStorage.getItem(`${STORAGE_KEY}_meta`);
      if (!metadataStr) {
        return null;
      }

      const metadata = JSON.parse(metadataStr);
      
      // Check if state has expired
      if (Date.now() > metadata.expiresAt) {
        console.warn('[StatePersistence] Stored state has expired, removing');
        this.clearState();
        return null;
      }

      // Load the actual state data
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (!storedData) {
        return null;
      }

      let stateData: string;

      if (metadata.encrypted && this.encryptionKey) {
        // Decrypt the state data
        stateData = await this.decryptData(storedData);
      } else {
        stateData = storedData;
      }

      const parsedState = JSON.parse(stateData);

      // Validate the loaded state
      const validation = validateWorkerState(parsedState);
      
      if (!validation.isValid) {
        console.error('[StatePersistence] Invalid state loaded:', validation.errors);
        this.clearState();
        return null;
      }

      // Migrate if needed
      let finalState = parsedState;
      if (validation.migrationNeeded) {
        console.info('[StatePersistence] Migrating state to current version');
        finalState = migrateWorkerState(parsedState);
        // Save the migrated state
        await this.saveState(finalState);
      }

      return finalState as EnhancedWorkerState;

    } catch (error) {
      console.error('[StatePersistence] Failed to load state:', error);
      // Clear corrupted state
      this.clearState();
      return null;
    }
  }

  /**
   * Updates specific fields in the stored state
   */
  async updateState(updates: Partial<EnhancedWorkerState>): Promise<void> {
    const currentState = await this.loadState();
    if (!currentState) {
      throw new Error('No existing state to update');
    }

    const updatedState: EnhancedWorkerState = {
      ...currentState,
      ...updates,
      lastUpdated: Date.now()
    };

    await this.saveState(updatedState);
  }

  /**
   * Clears stored state from localStorage
   */
  clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}_meta`);
    } catch (error) {
      console.error('[StatePersistence] Failed to clear state:', error);
    }
  }

  /**
   * Checks if stored state exists and is valid
   */
  async hasValidState(): Promise<boolean> {
    try {
      const metadataStr = localStorage.getItem(`${STORAGE_KEY}_meta`);
      if (!metadataStr) {
        return false;
      }

      const metadata = JSON.parse(metadataStr);
      
      // Check expiration
      if (Date.now() > metadata.expiresAt) {
        return false;
      }

      // Check if actual data exists
      const storedData = localStorage.getItem(STORAGE_KEY);
      return !!storedData;

    } catch (error) {
      console.error('[StatePersistence] Error checking state validity:', error);
      return false;
    }
  }

  /**
   * Gets state metadata without loading full state
   */
  getStateMetadata(): any | null {
    try {
      const metadataStr = localStorage.getItem(`${STORAGE_KEY}_meta`);
      return metadataStr ? JSON.parse(metadataStr) : null;
    } catch (error) {
      console.error('[StatePersistence] Error getting state metadata:', error);
      return null;
    }
  }

  /**
   * Initializes encryption key for secure storage
   */
  private initializeEncryptionKey(): void {
    try {
      // Try to load existing key
      let key = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
      
      if (!key) {
        // Generate new key
        key = this.generateEncryptionKey();
        localStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('[StatePersistence] Failed to initialize encryption key:', error);
      this.encryptionKey = null;
    }
  }

  /**
   * Generates a new encryption key
   */
  private generateEncryptionKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypts data using simple XOR cipher (for basic obfuscation)
   * Note: This is not cryptographically secure, just basic obfuscation
   */
  private async encryptData(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const dataBytes = encoder.encode(data);
    const keyBytes = encoder.encode(this.encryptionKey);
    
    const encrypted = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...encrypted));
  }

  /**
   * Decrypts data using simple XOR cipher
   */
  private async decryptData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }

    try {
      // Decode from base64
      const encrypted = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const encoder = new TextEncoder();
      const keyBytes = encoder.encode(this.encryptionKey);
      
      const decrypted = new Uint8Array(encrypted.length);
      
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
      }
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
      
    } catch (error) {
      throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cleanup expired states and perform maintenance
   */
  async performMaintenance(): Promise<void> {
    try {
      const metadata = this.getStateMetadata();
      
      if (metadata && Date.now() > metadata.expiresAt) {
        console.info('[StatePersistence] Cleaning up expired state');
        this.clearState();
      }
      
      // Could add more maintenance tasks here like:
      // - Compacting storage
      // - Removing old encryption keys
      // - Cleaning up orphaned data
      
    } catch (error) {
      console.error('[StatePersistence] Error during maintenance:', error);
    }
  }
}

/**
 * Global instance for state persistence
 */
export const statePersistenceManager = new StatePersistenceManager();

/**
 * Utility functions for common operations
 */
export const StateUtils = {
  /**
   * Creates or loads worker state
   */
  async getOrCreateState(): Promise<EnhancedWorkerState> {
    const existingState = await statePersistenceManager.loadState();
    return existingState || createDefaultWorkerState();
  },

  /**
   * Safely saves state with error handling
   */
  async saveStateSafely(state: EnhancedWorkerState): Promise<boolean> {
    try {
      await statePersistenceManager.saveState(state);
      return true;
    } catch (error) {
      console.error('[StateUtils] Failed to save state safely:', error);
      return false;
    }
  },

  /**
   * Checks if persistence is available
   */
  isPersistenceAvailable(): boolean {
    try {
      const testKey = 'test_persistence';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
};