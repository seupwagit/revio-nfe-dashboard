export interface DANFEGenerationResponse {
  success: boolean;
  data?: {
    pdfUrl: string;
    documentId: string;
    status: string;
    fileSize?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}