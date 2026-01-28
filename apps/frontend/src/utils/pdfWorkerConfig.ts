/**
 * PDF.js Worker Configuration
 * 
 * This module configures the PDF.js worker globally to ensure it's available
 * before any PDF operations are performed.
 */

import { pdfjs } from 'react-pdf';

// Configure PDF.js worker IMMEDIATELY when this module is imported
const configurePdfWorker = () => {
  console.log('[PDFWorkerConfig] Configuring PDF.js worker...');
  
  try {
    // Option 1: Use local worker from public folder
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    console.log('[PDFWorkerConfig] PDF.js worker configured with local file:', pdfjs.GlobalWorkerOptions.workerSrc);
    return true;
  } catch (error) {
    console.warn('[PDFWorkerConfig] Failed to use local worker:', error);
  }

  try {
    // Option 2: Use npm package worker
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    console.log('[PDFWorkerConfig] PDF.js worker configured with npm package:', pdfjs.GlobalWorkerOptions.workerSrc);
    return true;
  } catch (error) {
    console.warn('[PDFWorkerConfig] Failed to use npm package worker:', error);
  }

  try {
    // Option 3: Use CDN worker
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.530/pdf.worker.min.js`;
    console.log('[PDFWorkerConfig] PDF.js worker configured with CDN:', pdfjs.GlobalWorkerOptions.workerSrc);
    return true;
  } catch (error) {
    console.error('[PDFWorkerConfig] All worker configuration methods failed:', error);
    return false;
  }
};

// Configure worker immediately when module loads
const workerConfigured = configurePdfWorker();
console.log('[PDFWorkerConfig] Worker configuration result:', workerConfigured);
console.log('[PDFWorkerConfig] Final worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
console.log('[PDFWorkerConfig] PDF.js version:', pdfjs.version);

// Export configuration status for debugging
export const isPdfWorkerConfigured = () => !!pdfjs.GlobalWorkerOptions.workerSrc;
export const getPdfWorkerSource = () => pdfjs.GlobalWorkerOptions.workerSrc;
export const getPdfVersion = () => pdfjs.version;