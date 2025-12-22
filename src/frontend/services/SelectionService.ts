/**
 * SelectionService
 * Manages document selection state across grid components
 * 
 * This service maintains an in-memory Map of selected document keys,
 * organized by collection type. It ensures:
 * - No duplicate keys per collection
 * - Immediate removal when deselected
 * - Efficient lookup and deletion operations
 */

import { CollectionType } from './collectionKeyMapping';

/**
 * Service for managing document selection state
 */
export class SelectionService {
  private selections: Map<CollectionType, Set<string>>;

  constructor() {
    this.selections = new Map<CollectionType, Set<string>>();
  }

  /**
   * Add a document key to the selection
   * Prevents duplicates automatically using Set
   * 
   * @param collectionType - The type of collection (NFE, CTE, or CFE)
   * @param key - The document key to add
   */
  addSelection(collectionType: CollectionType, key: string): void {
    if (!this.selections.has(collectionType)) {
      this.selections.set(collectionType, new Set<string>());
    }
    
    const collectionSet = this.selections.get(collectionType)!;
    collectionSet.add(key);
  }

  /**
   * Remove a document key from the selection
   * Removes the key from memory immediately
   * 
   * @param collectionType - The type of collection (NFE, CTE, or CFE)
   * @param key - The document key to remove
   */
  removeSelection(collectionType: CollectionType, key: string): void {
    const collectionSet = this.selections.get(collectionType);
    if (collectionSet) {
      collectionSet.delete(key);
      
      // Clean up empty sets to keep memory efficient
      if (collectionSet.size === 0) {
        this.selections.delete(collectionType);
      }
    }
  }

  /**
   * Get all selected keys organized by collection type
   * 
   * @returns A Map of collection types to Sets of selected keys
   */
  getSelectedKeys(): Map<CollectionType, Set<string>> {
    // Return a copy to prevent external modification
    const copy = new Map<CollectionType, Set<string>>();
    
    for (const [collectionType, keys] of this.selections.entries()) {
      copy.set(collectionType, new Set(keys));
    }
    
    return copy;
  }

  /**
   * Clear all selections from memory
   * Removes all document keys from all collections
   */
  clearSelections(): void {
    this.selections.clear();
  }

  /**
   * Get the total count of selected documents across all collections
   * 
   * @returns The total number of selected documents
   */
  getSelectionCount(): number {
    let count = 0;
    
    for (const keys of this.selections.values()) {
      count += keys.size;
    }
    
    return count;
  }

  /**
   * Check if a specific document key is selected
   * 
   * @param collectionType - The type of collection (NFE, CTE, or CFE)
   * @param key - The document key to check
   * @returns true if the key is selected, false otherwise
   */
  isSelected(collectionType: CollectionType, key: string): boolean {
    const collectionSet = this.selections.get(collectionType);
    return collectionSet ? collectionSet.has(key) : false;
  }

  /**
   * Get the count of selected documents for a specific collection
   * 
   * @param collectionType - The type of collection (NFE, CTE, or CFE)
   * @returns The number of selected documents in that collection
   */
  getCollectionSelectionCount(collectionType: CollectionType): number {
    const collectionSet = this.selections.get(collectionType);
    return collectionSet ? collectionSet.size : 0;
  }

  /**
   * Get all selected keys for a specific collection
   * 
   * @param collectionType - The type of collection (NFE, CTE, or CFE)
   * @returns A Set of selected keys for that collection
   */
  getCollectionSelectedKeys(collectionType: CollectionType): Set<string> {
    const collectionSet = this.selections.get(collectionType);
    return collectionSet ? new Set(collectionSet) : new Set<string>();
  }
}

// Export a singleton instance for use across the application
export const selectionService = new SelectionService();
