/**
 * Collection Key Mapping Utility
 * Maps collection types to their respective document key field names
 */

/**
 * Supported collection types for fiscal documents
 */
export type CollectionType = 'NFE' | 'CTE' | 'CFE';

/**
 * Mapping of collection types to their key field names
 */
export const COLLECTION_KEY_FIELDS: Record<CollectionType, string> = {
  NFE: 'CHV_NFE',
  CTE: 'CHV',
  CFE: 'CHV_CFe',
} as const;

/**
 * Get the key field name for a given collection type
 * @param collectionType - The type of collection (NFE, CTE, or CFE)
 * @returns The name of the key field for that collection
 * @example
 * getKeyFieldName('NFE') // returns 'CHV_NFE'
 * getKeyFieldName('CTE') // returns 'CHV'
 * getKeyFieldName('CFE') // returns 'CHV_CFe'
 */
export function getKeyFieldName(collectionType: CollectionType): string {
  return COLLECTION_KEY_FIELDS[collectionType];
}

/**
 * Extract the document key from a document based on its collection type
 * @param document - The document object
 * @param collectionType - The type of collection
 * @returns The document key value
 */
export function extractDocumentKey(
  document: Record<string, any>,
  collectionType: CollectionType
): string {
  const keyField = getKeyFieldName(collectionType);
  const key = document[keyField];
  
  if (!key || typeof key !== 'string') {
    throw new Error(
      `Document does not have a valid key field '${keyField}' for collection type '${collectionType}'`
    );
  }
  
  return key;
}
