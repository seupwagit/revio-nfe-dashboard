/**
 * Interface para resultado de interceptação de consulta
 */
export interface InterceptionResult {
  success: boolean;
  data: any[];
  metadata: {
    grouped: boolean;
    groupCount: number;
    totalDocuments: number;
    processingTime: number;
    cacheUsed?: boolean;
    normalizationApplied?: boolean;
    fallbackUsed?: boolean;
    interceptId?: string;
    queryId?: string;
    breakdown?: {
      configTime: number;
      pipelineTime: number;
      aggregationTime: number;
      transformTime: number;
    };
  };
}