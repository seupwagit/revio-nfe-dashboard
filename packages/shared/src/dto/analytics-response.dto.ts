export interface AnalyticsResponseDTO {
  success: boolean;
  data?: {
    totalDocuments: number;
    documentsThisMonth: number;
    documentsToday: number;
    averageProcessingTime: number;
  };
  error?: {
    code: string;
    message: string;
  };
}