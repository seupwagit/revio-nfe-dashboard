export interface DocumentStatusResponse {
  success: boolean;
  data?: {
    documentId: string;
    status: 'xml_not_found' | 'xml_downloaded' | 'pdf_cached' | 'pdf_ready';
    xmlExists: boolean;
    pdfExists: boolean;
    pdfCached: boolean;
    fileSize?: number;
    lastModified?: string;
  };
  error?: string;
}