/**
 * Persistence State Interface
 */

export interface PersistenceState {
  /** Whether state should persist across sessions */
  enabled: boolean;
  
  /** Encryption key for stored data */
  encryptionKey?: string;
  
  /** Last successful save timestamp */
  lastSaved: number;
  
  /** State version for migration */
  version: string;
  
  /** Expiration timestamp */
  expiresAt: number;
}