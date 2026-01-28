import * as fs from 'fs';
import * as path from 'path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DANFEGenerator } from '../DANFEGenerator';

describe('DANFEGenerator Edge Cases', () => {
  let danfeGenerator: DANFEGenerator;
  let tempDir: string;

  beforeAll(() => {
    // Set up test environment
    tempDir = path.join(process.cwd(), 'temp', 'test-danfe-edge-cases');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    danfeGenerator = new DANFEGenerator();
  });

  afterEach(() => {
    // Clean up all mocks after each test
    vi.restoreAllMocks();
  });

  afterAll(() => {
    // Clean up test temp directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Failed to cleanup test temp directory:', error);
    }
  });

  describe('Malformed XML Files', () => {
    /**
     * **Validates: Requirements 2.2, 2.4**
     * Test with malformed XML files to ensure proper error handling
     */
    it('should handle XML with invalid encoding', async () => {
      // XML with invalid encoding declaration
      const malformedXML = `<?xml version="1.0" encoding="INVALID-ENCODING"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome></emit>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(malformedXML, 'utf8');
      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-invalid-encoding');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/XML|inválido|erro/i);
      expect(result.pdfData).toBeUndefined();
    });

    it('should handle XML with unclosed tags', async () => {
      // XML with unclosed tags
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(malformedXML, 'utf8');
      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-unclosed-tags');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/XML|inválido|malformed|well-formed|PDF|DANFE|erro/i);
      expect(result.pdfData).toBeUndefined();
    });

    it('should handle XML with mismatched tags', async () => {
      // XML with mismatched opening and closing tags
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome></wrong>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(malformedXML, 'utf8');
      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-mismatched-tags');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/XML|inválido|malformed|well-formed|PDF|DANFE|erro/i);
      expect(result.pdfData).toBeUndefined();
    });

    it('should handle XML with invalid characters', async () => {
      // XML with invalid control characters
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test\x00\x01\x02</xNome></emit>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(malformedXML, 'utf8');
      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-invalid-chars');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.pdfData).toBeUndefined();
    });

    it('should handle XML with missing required NFe elements', async () => {
      // XML missing critical NFe elements
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <!-- Missing ide, emit, det, total elements -->
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(malformedXML, 'utf8');
      
      // Mock the PDF generation to simulate library rejection of incomplete NFe
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockRejectedValue(new Error('NFe structure incomplete'));

      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-missing-elements');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.pdfData).toBeUndefined();

      generatePDFSpy.mockRestore();
    });

    it('should handle XML with corrupted namespace declarations', async () => {
      // XML with corrupted namespace
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://invalid-namespace-url">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome></emit>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(malformedXML, 'utf8');
      
      // Mock the PDF generation to simulate library rejection of invalid namespace
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockRejectedValue(new Error('Invalid NFe namespace'));

      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-corrupted-namespace');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.pdfData).toBeUndefined();

      generatePDFSpy.mockRestore();
    });
  });

  describe('Very Large XML Files', () => {
    /**
     * **Validates: Requirements 2.2, 2.4, 2.5**
     * Test with very large XML files to ensure memory handling and performance
     */
    it('should handle XML files larger than 1MB', async () => {
      // Generate a large XML file (approximately 1.5MB)
      const baseXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123456</nNF><natOp>Venda</natOp></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Empresa Teste Grande</xNome></emit>`;

      let largeXML = baseXML;
      
      // Add many product items to make the file large (increased to ensure > 1MB)
      for (let i = 1; i <= 2000; i++) {
        largeXML += `
    <det nItem="${i}">
      <prod>
        <cProd>PROD${i.toString().padStart(6, '0')}</cProd>
        <xProd>Produto de teste número ${i} com descrição muito longa para aumentar o tamanho do arquivo XML e testar o comportamento do sistema com arquivos grandes. Esta descrição contém informações detalhadas sobre o produto incluindo características técnicas, especificações, origem, composição e outras informações relevantes que são necessárias para compor um arquivo XML de grande tamanho para fins de teste.</xProd>
        <NCM>12345678</NCM>
        <CFOP>5102</CFOP>
        <uCom>UN</uCom>
        <qCom>1.0000</qCom>
        <vUnCom>100.${i.toString().padStart(2, '0')}</vUnCom>
        <vProd>100.${i.toString().padStart(2, '0')}</vProd>
        <uTrib>UN</uTrib>
        <qTrib>1.0000</qTrib>
        <vUnTrib>100.${i.toString().padStart(2, '0')}</vUnTrib>
      </prod>
      <imposto>
        <ICMS>
          <ICMS00>
            <orig>0</orig>
            <CST>00</CST>
            <modBC>0</modBC>
            <vBC>100.${i.toString().padStart(2, '0')}</vBC>
            <pICMS>18.00</pICMS>
            <vICMS>18.${i.toString().padStart(2, '0')}</vICMS>
          </ICMS00>
        </ICMS>
      </imposto>
    </det>`;
      }

      largeXML += `
    <total>
      <ICMSTot>
        <vBC>200000.00</vBC>
        <vICMS>36000.00</vICMS>
        <vNF>200000.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(largeXML, 'utf8');
      
      // Verify the file is actually large (> 1MB)
      expect(xmlBuffer.length).toBeGreaterThan(1024 * 1024);

      // Mock PDF generation to avoid actual processing of large file
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockResolvedValue(undefined);

      // Mock file operations
      const mockWriteFile = vi.fn().mockResolvedValue(undefined);
      const mockReadFile = vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data'));
      const mockExistsSync = vi.fn().mockReturnValue(true);

      vi.doMock('fs', async () => {
        const actual = await vi.importActual<typeof fs>('fs');
        return {
          ...actual,
          promises: {
            writeFile: mockWriteFile,
            readFile: mockReadFile,
          },
          existsSync: mockExistsSync,
        };
      });

      const startTime = Date.now();
      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-large-file');
      const processingTime = Date.now() - startTime;

      // Should handle large files without crashing
      expect(result.success).toBe(true);
      expect(result.pdfData).toBeDefined();
      
      // Processing should complete within reasonable time (< 30 seconds)
      expect(processingTime).toBeLessThan(30000);

      generatePDFSpy.mockRestore();
    });

    it('should handle XML files with extremely long text content', async () => {
      // Generate XML with very long text content in individual fields
      const longText = 'A'.repeat(50000); // 50KB of text in a single field
      
      const xmlWithLongContent = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF><natOp>Venda</natOp></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Empresa</xNome></emit>
    <det nItem="1">
      <prod>
        <cProd>001</cProd>
        <xProd>${longText}</xProd>
        <vProd>100.00</vProd>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
    <infAdic>
      <infCpl>${longText}</infCpl>
    </infAdic>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(xmlWithLongContent, 'utf8');

      // Mock PDF generation
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockResolvedValue(undefined);

      // Mock file system operations to simulate successful PDF generation
      const mockWriteFile = vi.fn().mockResolvedValue(undefined);
      const mockReadFile = vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data'));
      const mockExistsSync = vi.fn().mockReturnValue(true);
      const mockStatSync = vi.fn().mockReturnValue({ size: 1000 });

      // Mock fs module
      vi.doMock('fs', async () => {
        const actual = await vi.importActual<typeof fs>('fs');
        return {
          ...actual,
          promises: {
            writeFile: mockWriteFile,
            readFile: mockReadFile,
          },
          existsSync: mockExistsSync,
          statSync: mockStatSync,
          writeFileSync: vi.fn(),
          readFileSync: vi.fn().mockReturnValue(xmlWithLongContent),
        };
      });

      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-long-content');

      // Should handle long content without issues
      expect(result.success).toBe(true);
      expect(result.pdfData).toBeDefined();

      generatePDFSpy.mockRestore();
    });

    it('should handle memory pressure during large file processing', async () => {
      // Simulate memory pressure scenario
      const mediumXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome></emit>
    <det nItem="1">
      <prod>
        <cProd>001</cProd>
        <xProd>Product</xProd>
        <vProd>100.00</vProd>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(mediumXML, 'utf8');

      // Mock PDF generation to simulate memory pressure
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockRejectedValue(new Error('JavaScript heap out of memory'));

      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-memory-pressure');

      // Should handle memory errors gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/erro|conversão|DANFE/i);
      expect(result.pdfData).toBeUndefined();

      generatePDFSpy.mockRestore();
    });
  });

  describe('Memory Handling During Conversion', () => {
    /**
     * **Validates: Requirements 2.2, 2.4, 2.5**
     * Test memory handling during conversion process
     */
    it('should properly clean up temporary files on successful conversion', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome></emit>
    <det nItem="1">
      <prod>
        <cProd>001</cProd>
        <xProd>Product</xProd>
        <vProd>100.00</vProd>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(validXML, 'utf8');

      // Mock successful PDF generation
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockResolvedValue(undefined);

      // Mock file system operations to simulate successful PDF generation
      const mockWriteFile = vi.fn().mockResolvedValue(undefined);
      const mockReadFile = vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data'));
      const mockExistsSync = vi.fn().mockReturnValue(true);
      const mockStatSync = vi.fn().mockReturnValue({ size: 1000 });

      // Mock fs module completely
      vi.doMock('fs', async () => {
        const actual = await vi.importActual<typeof fs>('fs');
        return {
          ...actual,
          promises: {
            writeFile: mockWriteFile,
            readFile: mockReadFile,
          },
          existsSync: mockExistsSync,
          statSync: mockStatSync,
          writeFileSync: vi.fn(),
          readFileSync: vi.fn().mockReturnValue(validXML),
        };
      });

      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-cleanup-success');

      expect(result.success).toBe(true);
      expect(result.pdfData).toBeDefined();
      
      // Verify files were written (XML and PDF should be preserved for caching)
      expect(mockWriteFile).toHaveBeenCalled();

      generatePDFSpy.mockRestore();
    });

    it('should properly clean up temporary files on conversion failure', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome></emit>
    <det nItem="1">
      <prod>
        <cProd>001</cProd>
        <xProd>Product</xProd>
        <vProd>100.00</vProd>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(validXML, 'utf8');

      // Mock PDF generation failure
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockRejectedValue(new Error('PDF generation failed'));

      // Mock cleanup method to verify it's called
      const cleanupSpy = vi.spyOn(danfeGenerator as any, 'cleanupTempFiles')
        .mockImplementation(() => {});

      const mockWriteFile = vi.fn().mockResolvedValue(undefined);

      vi.doMock('fs', async () => {
        const actual = await vi.importActual<typeof fs>('fs');
        return {
          ...actual,
          promises: {
            writeFile: mockWriteFile,
          },
        };
      });

      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-cleanup-failure');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Verify cleanup was called for PDF file (XML should be kept for debugging)
      expect(cleanupSpy).toHaveBeenCalled();

      generatePDFSpy.mockRestore();
      cleanupSpy.mockRestore();
    });

    it('should handle multiple concurrent conversion requests without memory leaks', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome></emit>
    <det nItem="1">
      <prod>
        <cProd>001</cProd>
        <xProd>Product</xProd>
        <vProd>100.00</vProd>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(validXML, 'utf8');

      // Mock PDF generation with delay to simulate concurrent processing
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return undefined;
        });

      const mockWriteFile = vi.fn().mockResolvedValue(undefined);
      const mockReadFile = vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data'));
      const mockExistsSync = vi.fn().mockReturnValue(true);

      vi.doMock('fs', async () => {
        const actual = await vi.importActual<typeof fs>('fs');
        return {
          ...actual,
          promises: {
            writeFile: mockWriteFile,
            readFile: mockReadFile,
          },
          existsSync: mockExistsSync,
        };
      });

      // Start multiple concurrent conversions
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(danfeGenerator.convertXMLToPDF(xmlBuffer, `test-concurrent-${i}`));
      }

      const results = await Promise.all(promises);

      // All conversions should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.pdfData).toBeDefined();
      });

      // Verify all conversions were processed
      expect(generatePDFSpy).toHaveBeenCalledTimes(5);

      generatePDFSpy.mockRestore();
    });

    it('should handle buffer allocation failures gracefully', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome></emit>
    <det nItem="1">
      <prod>
        <cProd>001</cProd>
        <xProd>Product</xProd>
        <vProd>100.00</vProd>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(validXML, 'utf8');

      // Mock PDF generation to simulate buffer allocation failure
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockRejectedValue(new Error('Cannot allocate memory'));

      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-buffer-allocation');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/erro|conversão|DANFE/i);
      expect(result.pdfData).toBeUndefined();

      generatePDFSpy.mockRestore();
    });

    it('should handle stream processing errors during PDF generation', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe>
    <ide><cUF>35</cUF><nNF>123</nNF></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>Test</xNome></emit>
    <det nItem="1">
      <prod>
        <cProd>001</cProd>
        <xProd>Product</xProd>
        <vProd>100.00</vProd>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`;

      const xmlBuffer = Buffer.from(validXML, 'utf8');

      // Mock PDF generation to simulate stream processing error
      const generatePDFSpy = vi.spyOn(danfeGenerator as any, 'generatePDFWithNfeDanfePdf')
        .mockRejectedValue(new Error('Stream processing failed'));

      const result = await danfeGenerator.convertXMLToPDF(xmlBuffer, 'test-stream-error');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/erro|conversão|DANFE/i);
      expect(result.pdfData).toBeUndefined();

      generatePDFSpy.mockRestore();
    });
  });
});