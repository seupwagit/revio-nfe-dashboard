/**
 * Property-Based Tests for SelectionService
 * Using fast-check for property-based testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { SelectionService } from './SelectionService';
import { CollectionType } from './collectionKeyMapping';

describe('SelectionService', () => {
  let service: SelectionService;

  beforeEach(() => {
    service = new SelectionService();
  });

  describe('Property-Based Tests', () => {
    // Arbitrary for CollectionType
    const collectionTypeArb = fc.constantFrom<CollectionType>('NFE', 'CTE', 'CFE');
    
    // Arbitrary for document keys (44-character strings representing fiscal document keys)
    const documentKeyArb = fc.string({ minLength: 44, maxLength: 44 });

    /**
     * Feature: document-download-system, Property 1: Selection toggle consistency
     * 
     * For any document and current selection state, clicking the checkbox should toggle 
     * the selection state (selected becomes unselected, unselected becomes selected)
     * 
     * Validates: Requirements 1.2
     */
    it('Property 1: Selection toggle consistency', () => {
      fc.assert(
        fc.property(
          collectionTypeArb,
          documentKeyArb,
          (collectionType, key) => {
            // Start with a fresh service
            const testService = new SelectionService();
            
            // Initial state: not selected
            const initiallySelected = testService.isSelected(collectionType, key);
            expect(initiallySelected).toBe(false);
            
            // First toggle: add selection
            testService.addSelection(collectionType, key);
            const afterFirstToggle = testService.isSelected(collectionType, key);
            expect(afterFirstToggle).toBe(true);
            
            // Second toggle: remove selection
            testService.removeSelection(collectionType, key);
            const afterSecondToggle = testService.isSelected(collectionType, key);
            expect(afterSecondToggle).toBe(false);
            
            // Third toggle: add again
            testService.addSelection(collectionType, key);
            const afterThirdToggle = testService.isSelected(collectionType, key);
            expect(afterThirdToggle).toBe(true);
            
            // Property holds: toggle always changes state
            return true;
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    /**
     * Unit test: Verify selection count increases when adding
     */
    it('should increase selection count when adding a document', () => {
      expect(service.getSelectionCount()).toBe(0);
      
      service.addSelection('NFE', 'key1');
      expect(service.getSelectionCount()).toBe(1);
      
      service.addSelection('NFE', 'key2');
      expect(service.getSelectionCount()).toBe(2);
      
      service.addSelection('CTE', 'key3');
      expect(service.getSelectionCount()).toBe(3);
    });

    /**
     * Unit test: Verify selection count decreases when removing
     */
    it('should decrease selection count when removing a document', () => {
      service.addSelection('NFE', 'key1');
      service.addSelection('NFE', 'key2');
      expect(service.getSelectionCount()).toBe(2);
      
      service.removeSelection('NFE', 'key1');
      expect(service.getSelectionCount()).toBe(1);
      
      service.removeSelection('NFE', 'key2');
      expect(service.getSelectionCount()).toBe(0);
    });

    /**
     * Unit test: Verify duplicate prevention
     */
    it('should prevent duplicate selections', () => {
      service.addSelection('NFE', 'key1');
      service.addSelection('NFE', 'key1');
      service.addSelection('NFE', 'key1');
      
      expect(service.getSelectionCount()).toBe(1);
      expect(service.isSelected('NFE', 'key1')).toBe(true);
    });

    /**
     * Unit test: Verify clearSelections removes all
     */
    it('should clear all selections', () => {
      service.addSelection('NFE', 'key1');
      service.addSelection('CTE', 'key2');
      service.addSelection('CFE', 'key3');
      
      expect(service.getSelectionCount()).toBe(3);
      
      service.clearSelections();
      
      expect(service.getSelectionCount()).toBe(0);
      expect(service.isSelected('NFE', 'key1')).toBe(false);
      expect(service.isSelected('CTE', 'key2')).toBe(false);
      expect(service.isSelected('CFE', 'key3')).toBe(false);
    });

    /**
     * Unit test: Verify getSelectedKeys returns correct structure
     */
    it('should return selected keys organized by collection type', () => {
      service.addSelection('NFE', 'nfe-key-1');
      service.addSelection('NFE', 'nfe-key-2');
      service.addSelection('CTE', 'cte-key-1');
      
      const selectedKeys = service.getSelectedKeys();
      
      expect(selectedKeys.size).toBe(2);
      expect(selectedKeys.get('NFE')?.size).toBe(2);
      expect(selectedKeys.get('NFE')?.has('nfe-key-1')).toBe(true);
      expect(selectedKeys.get('NFE')?.has('nfe-key-2')).toBe(true);
      expect(selectedKeys.get('CTE')?.size).toBe(1);
      expect(selectedKeys.get('CTE')?.has('cte-key-1')).toBe(true);
    });

    /**
     * Unit test: Verify getCollectionSelectionCount
     */
    it('should return correct count for specific collection', () => {
      service.addSelection('NFE', 'key1');
      service.addSelection('NFE', 'key2');
      service.addSelection('CTE', 'key3');
      
      expect(service.getCollectionSelectionCount('NFE')).toBe(2);
      expect(service.getCollectionSelectionCount('CTE')).toBe(1);
      expect(service.getCollectionSelectionCount('CFE')).toBe(0);
    });

    /**
     * Unit test: Verify getCollectionSelectedKeys
     */
    it('should return selected keys for specific collection', () => {
      service.addSelection('NFE', 'key1');
      service.addSelection('NFE', 'key2');
      service.addSelection('CTE', 'key3');
      
      const nfeKeys = service.getCollectionSelectedKeys('NFE');
      expect(nfeKeys.size).toBe(2);
      expect(nfeKeys.has('key1')).toBe(true);
      expect(nfeKeys.has('key2')).toBe(true);
      
      const cteKeys = service.getCollectionSelectedKeys('CTE');
      expect(cteKeys.size).toBe(1);
      expect(cteKeys.has('key3')).toBe(true);
      
      const cfeKeys = service.getCollectionSelectedKeys('CFE');
      expect(cfeKeys.size).toBe(0);
    });

    /**
     * Unit test: Verify removing non-existent key doesn't cause errors
     */
    it('should handle removing non-existent keys gracefully', () => {
      expect(() => {
        service.removeSelection('NFE', 'non-existent-key');
      }).not.toThrow();
      
      expect(service.getSelectionCount()).toBe(0);
    });

    /**
     * Unit test: Verify isSelected returns false for non-existent keys
     */
    it('should return false for non-selected keys', () => {
      service.addSelection('NFE', 'key1');
      
      expect(service.isSelected('NFE', 'key1')).toBe(true);
      expect(service.isSelected('NFE', 'key2')).toBe(false);
      expect(service.isSelected('CTE', 'key1')).toBe(false);
    });
  });
});
