/**
 * DANFE Cache Hook
 * 
 * React hook for managing DANFE URL cache with intelligent features
 */

import { useCallback, useEffect, useState } from 'react';
import { cacheUtils, intelligentURLCache } from '../services/intelligent-url-cache';

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  hitRate: number;
  memoryUsage: number;
  entryCount: number;
}

interface UseDANFECacheReturn {
  stats: CacheStats;
  preloadDocuments: (documentIds: string[]) => Promise<void>;
  invalidateCache: (pattern: string | RegExp) => number;
  clearCache: () => void;
  optimizeCache: () => void;
  getDetailedInfo: () => any;
  refreshStats: () => void;
}

export const useDANFECache = (): UseDANFECacheReturn => {
  const [stats, setStats] = useState<CacheStats>(() => intelligentURLCache.getStats());

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(intelligentURLCache.getStats());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const preloadDocuments = useCallback(async (documentIds: string[]) => {
    await cacheUtils.preloadDocuments(documentIds);
    setStats(intelligentURLCache.getStats());
  }, []);

  const invalidateCache = useCallback((pattern: string | RegExp) => {
    const removedCount = cacheUtils.invalidate(pattern);
    setStats(intelligentURLCache.getStats());
    return removedCount;
  }, []);

  const clearCache = useCallback(() => {
    cacheUtils.clear();
    setStats(intelligentURLCache.getStats());
  }, []);

  const optimizeCache = useCallback(() => {
    cacheUtils.optimize();
    setStats(intelligentURLCache.getStats());
  }, []);

  const getDetailedInfo = useCallback(() => {
    return cacheUtils.getDetailedInfo();
  }, []);

  const refreshStats = useCallback(() => {
    setStats(intelligentURLCache.getStats());
  }, []);

  return {
    stats,
    preloadDocuments,
    invalidateCache,
    clearCache,
    optimizeCache,
    getDetailedInfo,
    refreshStats
  };
};

/**
 * Hook for cache performance monitoring
 */
export const useDANFECacheMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceData, setPerformanceData] = useState<{
    averageLoadTime: number;
    cacheHitRate: number;
    memoryEfficiency: number;
  }>({
    averageLoadTime: 0,
    cacheHitRate: 0,
    memoryEfficiency: 0
  });

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    const interval = setInterval(() => {
      const stats = intelligentURLCache.getStats();
      
      // Calculate performance metrics
      const memoryEfficiency = stats.entryCount > 0 
        ? (stats.entryCount / (stats.memoryUsage || 1)) * 100 
        : 0;

      setPerformanceData({
        averageLoadTime: 0, // This would need to be tracked separately
        cacheHitRate: stats.hitRate,
        memoryEfficiency
      });
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
    isMonitoring,
    performanceData,
    startMonitoring,
    stopMonitoring
  };
};