export interface DANFEResponseDTO {
  success: boolean;
  data?: {
    pdfUrl: string;
    documentId: string;
    status: string;
  };
  error?: {
    code: string;
    message: string;
  };
}