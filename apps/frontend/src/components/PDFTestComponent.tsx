/**
 * PDF Test Component
 * 
 * Simple component to test PDF.js functionality
 */

import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Import CSS files
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Simple PDF data (minimal valid PDF)
const testPdfData = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Hello PDF.js!) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000273 00000 n 
0000000367 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
424
%%EOF`;

export const PDFTestComponent: React.FC = () => {
  const [numPages, setNumPages] = React.useState<number>(0);
  const [pageNumber] = React.useState<number>(1);
  const [error, setError] = React.useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('[PDFTestComponent] PDF loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('[PDFTestComponent] PDF load error:', error);
    setError(error.message);
  };

  // Convert string to Uint8Array
  const pdfBytes = new Uint8Array(
    Array.from(testPdfData).map(char => char.charCodeAt(0))
  );

  console.log('[PDFTestComponent] Rendering with PDF data:', pdfBytes.length, 'bytes');

  return (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="text-lg font-bold mb-4">PDF.js Test Component</h3>
      
      <div className="mb-4">
        <p><strong>PDF.js Version:</strong> {pdfjs.version}</p>
        <p><strong>Worker Source:</strong> {pdfjs.GlobalWorkerOptions.workerSrc}</p>
        <p><strong>Test PDF Size:</strong> {pdfBytes.length} bytes</p>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="border border-gray-200 p-4 bg-gray-50">
        <Document
          file={{ data: pdfBytes }}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p>Loading test PDF...</p>
            </div>
          }
          error={
            <div className="text-center p-4">
              <div className="text-red-500 text-lg mb-2">❌</div>
              <p>Failed to load test PDF</p>
            </div>
          }
        >
          {numPages > 0 && (
            <Page
              pageNumber={pageNumber}
              loading={
                <div className="text-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p>Loading page...</p>
                </div>
              }
              error={
                <div className="text-center p-4">
                  <div className="text-red-500 text-lg mb-2">❌</div>
                  <p>Failed to load page</p>
                </div>
              }
            />
          )}
        </Document>
      </div>

      {numPages > 0 && (
        <div className="mt-4">
          <p><strong>Pages:</strong> {numPages}</p>
          <p><strong>Current Page:</strong> {pageNumber}</p>
        </div>
      )}
    </div>
  );
};

export default PDFTestComponent;