/**
 * Analytics Response Interface
 */

import { AnalyticsData } from './analytics-data.interface';

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
  executionTime: number;
}