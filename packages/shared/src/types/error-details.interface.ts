// Error types
export interface ErrorDetails {
  code: string;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
}