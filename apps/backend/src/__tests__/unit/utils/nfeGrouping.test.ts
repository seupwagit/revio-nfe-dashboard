/**
 * NFE Grouping Utilities Tests
 * Unit tests for CHV_NFE grouping functionality
 */

import {
    createGroupingFilter,
    getGroupingConfig,
    getValidatedGroupingConfig,
    isValidGroupingKey,
    normalizeChvNfe
} from '../../../utils/nfeGrouping'

// Mock environment variables
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const originalEnv = process.env

beforeEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv }
})

afterAll(() => {
  process.env = originalEnv
})

describe('NFE Grouping Utilities', () => {
  describe('getGroupingConfig', () => {
    it('should return disabled config when VITE_NFE_GROUPING_KEYS is empty', () => {
      process.env.VITE_NFE_GROUPING_KEYS = ''
      
      const config = getGroupingConfig()
      
      expect(config.enabled).toBe(false)
      expect(config.keys).toEqual([])
    })

    it('should return disabled config when VITE_NFE_GROUPING_KEYS is undefined', () => {
      delete process.env.VITE_NFE_GROUPING_KEYS
      
      const config = getGroupingConfig()
      
      expect(config.enabled).toBe(false)
      expect(config.keys).toEqual([])
    })

    it('should return enabled config with single key', () => {
      process.env.VITE_NFE_GROUPING_KEYS = 'CHV_NFE'
      
      const config = getGroupingConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.keys).toEqual(['CHV_NFE'])
    })

    it('should return enabled config with multiple keys', () => {
      process.env.VITE_NFE_GROUPING_KEYS = 'CHV_NFE,CHV_CTE,CHV_CFE'
      
      const config = getGroupingConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.keys).toEqual(['CHV_NFE', 'CHV_CTE', 'CHV_CFE'])
    })

    it('should handle keys with spaces', () => {
      process.env.VITE_NFE_GROUPING_KEYS = ' CHV_NFE , CHV_CTE , CHV_CFE '
      
      const config = getGroupingConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.keys).toEqual(['CHV_NFE', 'CHV_CTE', 'CHV_CFE'])
    })

    it('should filter out empty keys', () => {
      process.env.VITE_NFE_GROUPING_KEYS = 'CHV_NFE,,CHV_CTE,'
      
      const config = getGroupingConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.keys).toEqual(['CHV_NFE', 'CHV_CTE'])
    })
  })

  describe('normalizeChvNfe', () => {
    it('should remove NFe prefix from CHV_NFE', () => {
      const chave = 'NFe35251106239190000857550000044025071115620267'
      const normalized = normalizeChvNfe(chave)
      
      expect(normalized).toBe('35251106239190000857550000044025071115620267')
    })

    it('should remove nfe prefix (lowercase)', () => {
      const chave = 'nfe35251106239190000857550000044025071115620267'
      const normalized = normalizeChvNfe(chave)
      
      expect(normalized).toBe('35251106239190000857550000044025071115620267')
    })

    it('should not modify chave without NFe prefix', () => {
      const chave = '35251106239190000857550000044025071115620267'
      const normalized = normalizeChvNfe(chave)
      
      expect(normalized).toBe('35251106239190000857550000044025071115620267')
    })

    it('should handle null values', () => {
      const normalized = normalizeChvNfe(null as any)
      
      expect(normalized).toBe(null)
    })

    it('should handle undefined values', () => {
      const normalized = normalizeChvNfe(undefined as any)
      
      expect(normalized).toBe(undefined)
    })

    it('should handle empty string', () => {
      const normalized = normalizeChvNfe('')
      
      expect(normalized).toBe('')
    })

    it('should handle non-string values', () => {
      const normalized = normalizeChvNfe(123 as any)
      
      expect(normalized).toBe(123)
    })

    it('should handle short strings (less than 3 chars)', () => {
      const normalized = normalizeChvNfe('AB')
      
      expect(normalized).toBe('AB')
    })
  })

  describe('createGroupingFilter', () => {
    it('should return original filter when grouping is disabled', () => {
      const originalFilter = { DT_DOC: { $gte: '2024-01-01' } }
      const groupingConfig = { enabled: false, keys: [] }
      
      const result = createGroupingFilter(originalFilter, groupingConfig)
      
      expect(result).toEqual(originalFilter)
    })

    it('should return original filter when no grouping keys configured', () => {
      const originalFilter = { DT_DOC: { $gte: '2024-01-01' } }
      const groupingConfig = { enabled: true, keys: [] }
      
      const result = createGroupingFilter(originalFilter, groupingConfig)
      
      expect(result).toEqual(originalFilter)
    })

    it('should return original filter when no grouping key filters present', () => {
      const originalFilter = { DT_DOC: { $gte: '2024-01-01' } }
      const groupingConfig = { enabled: true, keys: ['CHV_NFE'] }
      
      const result = createGroupingFilter(originalFilter, groupingConfig)
      
      expect(result).toEqual(originalFilter)
    })

    it('should create $in filter for CHV_NFE string value', () => {
      const originalFilter = { 
        CHV_NFE: 'NFe35251106239190000857550000044025071115620267',
        DT_DOC: { $gte: '2024-01-01' }
      }
      const groupingConfig = { enabled: true, keys: ['CHV_NFE'] }
      
      const result = createGroupingFilter(originalFilter, groupingConfig)
      
      expect(result.DT_DOC).toEqual({ $gte: '2024-01-01' })
      expect(result.CHV_NFE).toEqual({
        $in: [
          'NFe35251106239190000857550000044025071115620267', // Original
          '35251106239190000857550000044025071115620267',    // Sem prefixo
          'NFe35251106239190000857550000044025071115620267', // Com NFe
          'nfe35251106239190000857550000044025071115620267', // Com nfe
          'NFE35251106239190000857550000044025071115620267'  // Com NFE
        ]
      })
    })

    it('should handle CHV_NFE without prefix', () => {
      const originalFilter = { 
        CHV_NFE: '35251106239190000857550000044025071115620267'
      }
      const groupingConfig = { enabled: true, keys: ['CHV_NFE'] }
      
      const result = createGroupingFilter(originalFilter, groupingConfig)
      
      expect(result.CHV_NFE).toEqual({
        $in: [
          '35251106239190000857550000044025071115620267',    // Original
          '35251106239190000857550000044025071115620267',    // Sem prefixo (mesmo)
          'NFe35251106239190000857550000044025071115620267', // Com NFe
          'nfe35251106239190000857550000044025071115620267', // Com nfe
          'NFE35251106239190000857550000044025071115620267'  // Com NFE
        ]
      })
    })

    it('should preserve complex MongoDB queries', () => {
      const originalFilter = { 
        CHV_NFE: { $regex: /^NFe/ },
        DT_DOC: { $gte: '2024-01-01' }
      }
      const groupingConfig = { enabled: true, keys: ['CHV_NFE'] }
      
      const result = createGroupingFilter(originalFilter, groupingConfig)
      
      expect(result.CHV_NFE).toEqual({ $regex: /^NFe/ })
      expect(result.DT_DOC).toEqual({ $gte: '2024-01-01' })
    })

    it('should handle multiple grouping keys', () => {
      const originalFilter = { 
        CHV_NFE: 'NFe123',
        CHV_CTE: 'CTE456'
      }
      const groupingConfig = { enabled: true, keys: ['CHV_NFE', 'CHV_CTE'] }
      
      const result = createGroupingFilter(originalFilter, groupingConfig)
      
      expect(result.CHV_NFE).toEqual({
        $in: ['NFe123', '123', 'NFe123', 'nfe123', 'NFE123']
      })
      expect(result.CHV_CTE).toEqual({
        $in: ['CTE456', 'CTE456', 'NFeCTE456', 'nfeCTE456', 'NFECTE456']
      })
    })
  })

  describe('isValidGroupingKey', () => {
    it('should return true for valid keys', () => {
      expect(isValidGroupingKey('CHV_NFE')).toBe(true)
      expect(isValidGroupingKey('CHV_CTE')).toBe(true)
      expect(isValidGroupingKey('CHV_CFE')).toBe(true)
      expect(isValidGroupingKey('CHV')).toBe(true)
    })

    it('should return false for invalid keys', () => {
      expect(isValidGroupingKey('INVALID_KEY')).toBe(false)
      expect(isValidGroupingKey('CHV_INVALID')).toBe(false)
      expect(isValidGroupingKey('')).toBe(false)
      expect(isValidGroupingKey('chv_nfe')).toBe(false)
    })
  })

  describe('getValidatedGroupingConfig', () => {
    it('should return disabled config when no valid keys', () => {
      process.env.VITE_NFE_GROUPING_KEYS = 'INVALID_KEY,ANOTHER_INVALID'
      
      const config = getValidatedGroupingConfig()
      
      expect(config.enabled).toBe(false)
      expect(config.keys).toEqual([])
    })

    it('should filter out invalid keys and keep valid ones', () => {
      process.env.VITE_NFE_GROUPING_KEYS = 'CHV_NFE,INVALID_KEY,CHV_CTE'
      
      const config = getValidatedGroupingConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.keys).toEqual(['CHV_NFE', 'CHV_CTE'])
    })

    it('should return all valid keys when all are valid', () => {
      process.env.VITE_NFE_GROUPING_KEYS = 'CHV_NFE,CHV_CTE,CHV_CFE'
      
      const config = getValidatedGroupingConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.keys).toEqual(['CHV_NFE', 'CHV_CTE', 'CHV_CFE'])
    })
  })
})