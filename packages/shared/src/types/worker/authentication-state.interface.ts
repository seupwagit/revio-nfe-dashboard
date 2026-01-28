/**
 * Authentication State Interface
 */

export interface AuthenticationState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  
  /** Token expiration timestamp */
  tokenExpiry?: number;
  
  /** Last token refresh */
  lastTokenRefresh?: number;
  
  /** Token refresh attempts */
  refreshAttempts: number;
  
  /** Whether auto-refresh is enabled */
  autoRefresh: boolean;
}