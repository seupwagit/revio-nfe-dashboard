import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { databaseRouter } from './DatabaseRouter';

// Import DANFE libraries with fallback
let nfeDanfePdf: any;
let nfeXmlToPdf: any;

// Load libraries using createRequire for CommonJS compatibility
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
  nfeDanfePdf = require('nfe-danfe-pdf');
  console.log('[DANFEGenerator] nfe-danfe-pdf loaded successfully');
} catch (error: any) {
  console.warn('[DANFEGenerator] nfe-danfe-pdf not available:', error.message);
}

try {
  nfeXmlToPdf = require('nfe-xml-to-pdf');
  console.log('[DANFEGenerator] nfe-xml-to-pdf loaded successfully');
} catch (error: any) {
  console.warn('[DANFEGenerator] nfe-xml-to-pdf not available:', error.message);
}

export interface DANFEGenerationResult {
  success: boolean;
  pdfData?: Buffer;
  error?: string;
  tempXmlPath?: string;
  tempPdfPath?: string;
}

export interface XMLValidationResult {
  isValid: boolean;
  error?: string;
}

export class DANFEGenerator {
  private tempDir: string;
  private xmlDir: string;
  private pdfDir: string;

  constructor() {
    // Create temp directory structure for processing files
    this.tempDir = path.join(process.cwd(), 'temp', 'danfe');
    this.xmlDir = path.join(this.tempDir, 'xml');
    this.pdfDir = path.join(this.tempDir, 'pdf');
    
    this.ensureTempDirectories();
    console.log(`[DANFEGenerator] Initialized with paths:`);
    console.log(`  - Root: ${process.cwd()}`);
    console.log(`  - Temp: ${path.resolve(this.tempDir)}`);
    console.log(`  - XML: ${path.resolve(this.xmlDir)}`);
    console.log(`  - PDF: ${path.resolve(this.pdfDir)}`);
    this.debugLibraryInfo();
  }

  /**
   * Debug library information
   */
  private debugLibraryInfo(): void {
    try {
      console.log('[DANFEGenerator] Library debug info:');
      
      if (nfeDanfePdf) {
        console.log('  - nfe-danfe-pdf loaded: YES');
        console.log('  - nfeDanfePdf type:', typeof nfeDanfePdf);
        console.log('  - nfeDanfePdf keys:', Object.keys(nfeDanfePdf || {}));
        console.log('  - gerarPDF available:', typeof nfeDanfePdf?.gerarPDF === 'function');
      } else {
        console.log('  - nfe-danfe-pdf loaded: NO');
        console.error('  - CRITICAL: nfe-danfe-pdf library not available!');
      }
    } catch (error) {
      console.error('[DANFEGenerator] Error debugging library info:', error);
    }
  }

  private ensureTempDirectories(): void {
    try {
      // Create main temp directory
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
        console.log(`[DANFEGenerator] Created temp directory: ${this.tempDir}`);
      }

      // Create XML subdirectory
      if (!fs.existsSync(this.xmlDir)) {
        fs.mkdirSync(this.xmlDir, { recursive: true });
        console.log(`[DANFEGenerator] Created XML directory: ${this.xmlDir}`);
      }

      // Create PDF subdirectory
      if (!fs.existsSync(this.pdfDir)) {
        fs.mkdirSync(this.pdfDir, { recursive: true });
        console.log(`[DANFEGenerator] Created PDF directory: ${this.pdfDir}`);
      }
    } catch (error) {
      console.error('[DANFEGenerator] Failed to create temp directories:', error);
      throw new Error('Failed to initialize DANFE generator temp directories');
    }
  }

  /**
   * Validates XML structure before conversion
   */
  validateXML(xmlContent: string): XMLValidationResult {
    try {
      // Basic XML validation
      if (!xmlContent || xmlContent.trim().length === 0) {
        return {
          isValid: false,
          error: 'XML content is empty'
        };
      }

      // Check if it's valid XML structure
      if (!xmlContent.includes('<?xml') && !xmlContent.includes('<')) {
        return {
          isValid: false,
          error: 'Invalid XML format - missing XML declaration or root element'
        };
      }

      // Check for NFe specific elements
      if (!xmlContent.includes('NFe') && !xmlContent.includes('nfe')) {
        return {
          isValid: false,
          error: 'XML does not appear to be a valid NFe document'
        };
      }

      // Basic well-formed XML check
      const openTags = (xmlContent.match(/</g) || []).length;
      const closeTags = (xmlContent.match(/>/g) || []).length;
      
      if (openTags !== closeTags) {
        return {
          isValid: false,
          error: 'XML is not well-formed - mismatched tags'
        };
      }

      return {
        isValid: true
      };

    } catch (error: any) {
      return {
        isValid: false,
        error: `XML validation error: ${error.message}`
      };
    }
  }

  /**
   * Converts NFE XML to PDF DANFE format using nfe-danfe-pdf library
   * Saves both XML and PDF files to temp directories for debugging and caching
   */
  async convertXMLToPDF(xmlBuffer: Buffer, documentId?: string): Promise<DANFEGenerationResult> {
    const timestamp = Date.now();
    const fileId = documentId || `nfe_${timestamp}`;
    
    const tempXmlPath = path.join(this.xmlDir, `${fileId}.xml`);
    const tempPdfPath = path.join(this.pdfDir, `${fileId}.pdf`);

    try {
      console.log(`[DANFEGenerator] Starting XML to PDF conversion for document: ${fileId}`);

      // Convert buffer to string for validation
      const xmlContent = xmlBuffer.toString('utf8');
      
      // Validate XML before processing
      const validation = this.validateXML(xmlContent);
      if (!validation.isValid) {
        return {
          success: false,
          error: `XML inválido: ${validation.error}`
        };
      }

      // Write XML to temporary file in xml directory
      const absoluteXmlPath = path.resolve(tempXmlPath);
      await promisify(fs.writeFile)(absoluteXmlPath, xmlBuffer);
      console.log(`[DANFEGenerator] ✅ XML salvo com sucesso: ${absoluteXmlPath}`);

      // Check if it's a summary (resNFe)
      const xmlStr = xmlBuffer.toString('utf8');
      if (xmlStr.includes('<resNFe') || xmlStr.includes('<resEvento') || !xmlStr.includes('<infNFe')) {
        console.warn(`[DANFEGenerator] ⚠️ Documento do tipo resumo detectado (resNFe/resEvento) ou sem infNFe para ${documentId}`);
        console.log(`[DANFEGenerator] 🔄 Iniciando geração de DANFE de resumo para ${documentId}...`);
        return this.generateSummaryDANFE(documentId);
      }

      // Generate PDF using nfe-danfe-pdf library
      await this.generatePDFWithNfeDanfePdf(tempXmlPath, tempPdfPath);

      // Read the generated PDF
      if (!fs.existsSync(tempPdfPath)) {
        throw new Error('PDF file was not generated by the library');
      }

      const pdfBuffer = await promisify(fs.readFile)(tempPdfPath);
      console.log(`[DANFEGenerator] PDF generated successfully: ${tempPdfPath} (${pdfBuffer.length} bytes)`);

      // Keep both XML and PDF files for debugging and potential reuse
      console.log(`[DANFEGenerator] Files preserved in temp directories:`);
      console.log(`  - XML: ${tempXmlPath}`);
      console.log(`  - PDF: ${tempPdfPath}`);

      return {
        success: true,
        pdfData: pdfBuffer,
        tempXmlPath,
        tempPdfPath
      };

    } catch (error: any) {
      console.error(`[DANFEGenerator] Conversion error for ${fileId}:`, error);

      // Keep XML file for debugging when there are errors
      console.log(`[DANFEGenerator] Keeping XML file for debugging: ${tempXmlPath}`);

      // Clean up PDF file on error (but keep XML)
      this.cleanupTempFiles([tempPdfPath]);

      let errorMessage = 'Erro desconhecido na geração do DANFE';
      
      if (error.message) {
        if (error.message.includes('XML')) {
          errorMessage = 'Erro no processamento do XML da NFe';
        } else if (error.message.includes('PDF') || error.message.includes('danfe')) {
          errorMessage = 'Erro na geração do PDF do DANFE';
        } else if (error.message.includes('not found') || error.message.includes('ENOENT')) {
          errorMessage = 'Biblioteca de geração de DANFE não encontrada';
        } else {
          errorMessage = `Erro na conversão: ${error.message}`;
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generates a DANFE PDF strictly using data provided by the grid (no S3/DB calls)
   */
  public async generatePDFFromGridObject(documentId: string, gridData: any): Promise<DANFEGenerationResult> {
    try {
      console.log(`[DANFEGenerator] 🚀 GERANDO DANFE DIRETAMENTE DOS DADOS DA GRID PARA: ${documentId}`);
      
      // Normalize grid data to internal reconstruction format
      const normalizedData = {
        CHV_NFE: gridData.chaveAcesso || gridData.CHV_NFE || documentId,
        NUM_DOC: gridData.numero || gridData.NUM_DOC || '0',
        SERIE: gridData.serie || gridData.SERIE || '1',
        MODELO: gridData.modelo || gridData.MODELO || '55',
        DT_DOC: gridData.dataEmissao || gridData.DT_DOC || new Date(),
        VL_DOC: gridData.valorTotal || gridData.VL_DOC || 0,
        CNPJ_EMIT: gridData.emitenteCnpj || gridData.CNPJ_EMIT || '',
        NOME_EMIT: gridData.emitenteNome || gridData.NOME_EMIT || 'EMITENTE',
        UF_EMIT: gridData.emitenteUf || gridData.UF_EMIT || 'SP',
        CNPJ_DEST: gridData.destinatarioCnpj || gridData.CNPJ_DEST || '',
        NOME_DEST: gridData.destinatarioNome || gridData.NOME_DEST || 'DESTINATARIO',
        UF_DEST: gridData.destinatarioUf || gridData.UF_DEST || 'SP',
        PROTOCOLADA: gridData.protocolo || gridData.PROTOCOLADA || '0000000000',
        NAT_OPER: gridData.naturezaOperacao || gridData.NAT_OPER || 'VENDA',
        _docType: 'NFe' // Forcing NFe for now, grid usually contains NFe data
      };

      // 2. Reconstruct XML
      const reconstructedXml = this.reconstructSummaryXML(normalizedData);
      const xmlBuffer = Buffer.from(reconstructedXml, 'utf8');
      
      // 3. Save reconstructed XML to temp for debugging
      const fileName = `${documentId}_grid_reconstructed.xml`;
      const tempXmlPath = path.join(this.xmlDir, fileName);
      await promisify(fs.writeFile)(tempXmlPath, xmlBuffer);

      // 4. Generate PDF
      const tempPdfPath = path.join(this.pdfDir, `${documentId}.pdf`);
      
      // Try nfe-xml-to-pdf first, fallback to nfe-danfe-pdf
      let generated = false;
      if (nfeXmlToPdf) {
        try {
          const pdfGenerator = typeof nfeXmlToPdf === 'function' ? nfeXmlToPdf : nfeXmlToPdf.default;
          const pdfBufferResult = await pdfGenerator(reconstructedXml);
          if (pdfBufferResult && Buffer.isBuffer(pdfBufferResult)) {
            await promisify(fs.writeFile)(tempPdfPath, pdfBufferResult);
            generated = true;
          }
        } catch (e) {
          console.warn('[DANFEGenerator] nfe-xml-to-pdf failed for grid data, falling back...');
        }
      }

      if (!generated) {
        await this.generatePDFWithNfeDanfePdf(tempXmlPath, tempPdfPath);
      }

      const finalPdfBuffer = await promisify(fs.readFile)(tempPdfPath);
      
      return {
        success: true,
        pdfData: finalPdfBuffer,
        tempXmlPath,
        tempPdfPath
      };

    } catch (error: any) {
      console.error(`[DANFEGenerator] ❌ Falha na geração do DANFE via Grid para ${documentId}:`, error);
      return {
        success: false,
        error: `Falha na geração via GRID: ${error.message}`
      };
    }
  }

  /**
   * Generates a summary DANFE when full XML is unavailable
   */
  public async generateSummaryDANFE(documentId: any): Promise<DANFEGenerationResult> {
    const id = typeof documentId === 'string' ? documentId : String(documentId || '');
    
    try {
      console.log(`[DANFEGenerator] 🔄 INICIANDO RECONSTRUÇÃO DE XML DE RESUMO PARA: ${id}`);
      
      // 1. Fetch data from database
      const nfeData = await this.fetchNFeDataFromDatabase(id);
      
      if (!nfeData) {
        throw new Error('Não foi possível encontrar dados do registro no banco de dados para reconstruir o XML.');
      }

      // 2. Reconstruct XML
      const reconstructedXml = this.reconstructSummaryXML(nfeData);
      const xmlBuffer = Buffer.from(reconstructedXml, 'utf8');
      
      // 3. Save reconstructed XML to temp for debugging
      const fileName = `${id}_reconstructed.xml`;
      const tempXmlPath = path.join(this.xmlDir, fileName);
      await promisify(fs.writeFile)(tempXmlPath, xmlBuffer);
      console.log(`[DANFEGenerator] 📝 XML reconstruído salvo em: ${tempXmlPath}`);

      // 4. Generate PDF
      const tempPdfPath = path.join(this.pdfDir, `${id}.pdf`);
      
      // Use nfe-xml-to-pdf primarily for summary as it handles minimal structures better,
      // but fallback to nfe-danfe-pdf if it fails (e.g. font missing in installation)
      let generatedWithXmlToPdf = false;

      if (nfeXmlToPdf) {
        try {
          console.log('[DANFEGenerator] Tentando nfe-xml-to-pdf para gerar PDF de resumo...');
          const pdfGenerator = typeof nfeXmlToPdf === 'function' ? nfeXmlToPdf : nfeXmlToPdf.default;
          
          const pdfBufferResult = await pdfGenerator(reconstructedXml);
          
          if (pdfBufferResult && (Buffer.isBuffer(pdfBufferResult) && pdfBufferResult.length > 0)) {
            await promisify(fs.writeFile)(tempPdfPath, pdfBufferResult);
            generatedWithXmlToPdf = true;
            console.log('[DANFEGenerator] ✅ PDF de resumo gerado com sucesso usando nfe-xml-to-pdf');
          }
        } catch (xmlToPdfError: any) {
          console.warn(`[DANFEGenerator] ⚠️ nfe-xml-to-pdf falhou (problema no pacote/fontes): ${xmlToPdfError.message}`);
          console.log('[DANFEGenerator] 🔄 Acionando fallback para nfe-danfe-pdf...');
        }
      }

      if (!generatedWithXmlToPdf) {
        // Fallback to nfe-danfe-pdf
        console.log('[DANFEGenerator] Gerando PDF de resumo usando nfe-danfe-pdf...');
        await this.generatePDFWithNfeDanfePdf(tempXmlPath, tempPdfPath);
        console.log('[DANFEGenerator] ✅ PDF de resumo gerado com sucesso usando nfe-danfe-pdf');
      }

      const finalPdfBuffer = await promisify(fs.readFile)(tempPdfPath);
      
      return {
        success: true,
        pdfData: finalPdfBuffer,
        tempXmlPath,
        tempPdfPath
      };

    } catch (error: any) {
      console.error(`[DANFEGenerator] ❌ Falha na geração do DANFE de resumo para ${id}:`, error);
      return {
        success: false,
        error: `Falha na geração do DANFE de resumo: ${error.message}`
      };
    }
  }

  /**
   * Fetches NFe record data from MongoDB tbl_nfe_100
   */
  private async fetchNFeDataFromDatabase(documentId: string): Promise<any> {
    try {
      console.log(`[DANFEGenerator] Fetching NFe data from database for ID: ${documentId}`);
      
      const mongoConnection = await databaseRouter.getCurrentMongoConnection();
      if (!mongoConnection || !mongoConnection.db) {
        throw new Error('Conexão MongoDB não disponível para busca de registros');
      }

      // Query collections tbl_nfe_100 or tbl_cte_100
      const nfeCollection = mongoConnection.db.collection('tbl_nfe_100');
      const document = await nfeCollection.findOne({ CHV_NFE: documentId });

      if (document) {
        console.log(`[DANFEGenerator] ✅ Dados NFe encontrados em tbl_nfe_100 para ${documentId}`);
        return { ...document, _docType: 'NFe' };
      }

      // Try CTE if NFe not found
      const cteCollection = mongoConnection.db.collection('tbl_cte_100');
      const cteDocument = await cteCollection.findOne({ CHV_CTE: documentId });
      
      if (cteDocument) {
        console.log(`[DANFEGenerator] ✅ Dados CTE encontrados em tbl_cte_100 para ${documentId}`);
        return { ...cteDocument, _docType: 'CTE' };
      }

      console.warn(`[DANFEGenerator] ⚠️ Nenhum registro encontrado para ${documentId} no banco de dados`);
      return null;
    } catch (error) {
      console.error(`[DANFEGenerator] Erro ao buscar dados NFe para ${documentId}:`, error);
      return null;
    }
  }

  /**
   * Reconstructs a minimal NFe XML structure from database data
   */
  private reconstructSummaryXML(data: any): string {
    const isNFe = data._docType === 'NFe';
    const chave = isNFe ? (data.CHV_NFE || '') : (data.CHV_CTE || '');
    const numero = data.NUM_DOC || data.NUMERO || '0';
    const serie = data.SERIE || '1';
    const dataEmi = data.DT_DOC ? new Date(data.DT_DOC).toISOString() : new Date().toISOString();
    const valorTotal = Number(data.VL_DOC || data.VALOR_TOTAL || 0).toFixed(2);
    
    // Emitente
    const emitCNPJ = data.CNPJ_EMIT || data.CPF_EMIT || '';
    const emitNome = data.NOME_EMIT || data.RAZAO_EMIT || 'EMITENTE NAO IDENTIFICADO';
    
    // Destinatário
    const destCNPJ = data.CNPJ_DEST || data.CPF_DEST || '';
    const destNome = data.NOME_DEST || data.RAZAO_DEST || 'DESTINATARIO NAO IDENTIFICADO';

    // Build XML string (Minimal nfeProc 4.00 compliant structure)
    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${chave}" versao="4.00">
      <ide>
        <cUF>${chave.substring(0, 2) || '35'}</cUF>
        <cNF>${chave.substring(35, 43) || '00000000'}</cNF>
        <natOp>${data.NAT_OPER || 'VENDA'}</natOp>
        <mod>${data.MODELO || '55'}</mod>
        <serie>${serie}</serie>
        <nNF>${numero}</nNF>
        <dhEmi>${dataEmi}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${chave.substring(43, 44) || '0'}</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>9</indPres>
        <procEmi>0</procEmi>
        <verProc>1.0</verProc>
      </ide>
      <emit>
        <CNPJ>${emitCNPJ}</CNPJ>
        <xNome>${emitNome}</xNome>
        <enderEmit>
          <xLgr>ENDERECO NO REGISTRO</xLgr>
          <nro>SN</nro>
          <xBairro>BAIRRO</xBairro>
          <cMun>0000000</cMun>
          <xMun>MUNICIPIO</xMun>
          <UF>${data.UF_EMIT || 'SP'}</UF>
          <CEP>00000000</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderEmit>
        <IE>${data.IE_EMIT || 'ISENTO'}</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>${destCNPJ}</CNPJ>
        <xNome>${destNome}</xNome>
        <enderDest>
          <xLgr>ENDERECO NO REGISTRO</xLgr>
          <nro>SN</nro>
          <xBairro>BAIRRO</xBairro>
          <cMun>0000000</cMun>
          <xMun>MUNICIPIO</xMun>
          <UF>${data.UF_DEST || 'SP'}</UF>
          <CEP>00000000</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderDest>
        <indIEDest>9</indIEDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>SUMMARY</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>RESUMO DA NOTA FISCAL (DADOS DO REGISTRO NO BANCO)</xProd>
          <NCM>00</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>1.0000</qCom>
          <vUnCom>${valorTotal}</vUnCom>
          <vProd>${valorTotal}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>1.0000</qTrib>
          <vUnTrib>${valorTotal}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>0.00</vTotTrib>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>0</modBC>
              <vBC>${valorTotal}</vBC>
              <pICMS>0.00</pICMS>
              <vICMS>0.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS><PISAliq><CST>01</CST><vBC>${valorTotal}</vBC><pPIS>0.00</pPIS><vPIS>0.00</vPIS></PISAliq></PIS>
          <COFINS><COFINSAliq><CST>01</CST><vBC>${valorTotal}</vBC><pCOFINS>0.00</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSAliq></COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>${valorTotal}</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCPUFDest>0.00</vFCPUFDest>
          <vICMSUFDest>0.00</vICMSUFDest>
          <vICMSUFRemet>0.00</vICMSUFRemet>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${valorTotal}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${valorTotal}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>99</tPag>
          <vPag>${valorTotal}</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>DOCUMENTO GERADO A PARTIR DOS DADOS DE REGISTRO NO BANCO DE DADOS (RESUMO).</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>1.0</verAplic>
      <chNFe>${chave}</chNFe>
      <dhRecbto>${dataEmi}</dhRecbto>
      <nProt>${data.PROTOCOLADA || '0000000000'}</nProt>
      <digVal>resumo</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e (Resumo)</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
  }

  /**
   * Generates PDF using nfe-danfe-pdf library as primary method
   */
  private async generatePDFWithNfeDanfePdf(xmlPath: string, pdfPath: string): Promise<void> {
    console.log('[DANFEGenerator] Attempting to generate PDF with nfe-danfe-pdf');
    
    if (!nfeDanfePdf) {
      throw new Error('nfe-danfe-pdf library not available');
    }

    try {
      // Check if XML file exists and is readable
      if (!fs.existsSync(xmlPath)) {
        throw new Error(`XML file does not exist: ${xmlPath}`);
      }

      const xmlStats = fs.statSync(xmlPath);
      console.log(`[DANFEGenerator] XML file size: ${xmlStats.size} bytes`);

      if (xmlStats.size === 0) {
        throw new Error('XML file is empty');
      }

      // Read XML content
      const xmlContent = fs.readFileSync(xmlPath, 'utf8');
      console.log(`[DANFEGenerator] XML content preview: ${xmlContent.substring(0, 200)}...`);

      // Use nfe-danfe-pdf to generate PDF
      console.log('[DANFEGenerator] Generating PDF with nfe-danfe-pdf...');
      
      let pdfBuffer: Buffer;
      
      // Try different API methods based on library structure
      if (typeof nfeDanfePdf.gerarPDF === 'function') {
        console.log('[DANFEGenerator] Using gerarPDF method');
        const pdfDocument = await nfeDanfePdf.gerarPDF(xmlContent);
        
        // Check if it's a PDFDocument (PDFKit stream)
        if (pdfDocument && typeof pdfDocument.pipe === 'function' && pdfDocument._readableState) {
          console.log('[DANFEGenerator] PDF document is a PDFKit stream, collecting data...');
          
          // Collect the PDF data from the stream
          pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            
            pdfDocument.on('data', (chunk: Buffer) => {
              chunks.push(chunk);
            });
            
            pdfDocument.on('end', () => {
              try {
                const buffer = Buffer.concat(chunks);
                console.log(`[DANFEGenerator] PDF buffer collected, size: ${buffer.length} bytes`);
                resolve(buffer);
              } catch (error) {
                reject(error);
              }
            });
            
            pdfDocument.on('error', (error: Error) => {
              console.error('[DANFEGenerator] PDF stream error:', error);
              reject(error);
            });
          });
        } else if (Buffer.isBuffer(pdfDocument)) {
          pdfBuffer = pdfDocument;
        } else {
          throw new Error('nfe-danfe-pdf returned unexpected result type');
        }
      } else if (typeof nfeDanfePdf.generateDANFE === 'function') {
        console.log('[DANFEGenerator] Using generateDANFE method');
        pdfBuffer = await nfeDanfePdf.generateDANFE(xmlContent);
      } else if (typeof nfeDanfePdf.generate === 'function') {
        console.log('[DANFEGenerator] Using generate method');
        pdfBuffer = await nfeDanfePdf.generate(xmlContent);
      } else if (typeof nfeDanfePdf === 'function') {
        console.log('[DANFEGenerator] Using default export as function');
        pdfBuffer = await nfeDanfePdf(xmlContent);
      } else if (typeof (nfeDanfePdf as any).default === 'function') {
        console.log('[DANFEGenerator] Using default export');
        pdfBuffer = await (nfeDanfePdf as any).default(xmlContent);
      } else {
        throw new Error('No suitable method found in nfe-danfe-pdf library');
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('nfe-danfe-pdf returned empty PDF buffer');
      }

      // Write PDF to file
      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log(`[DANFEGenerator] PDF generated successfully with nfe-danfe-pdf: ${pdfPath} (${pdfBuffer.length} bytes)`);

    } catch (error: any) {
      console.error('[DANFEGenerator] nfe-danfe-pdf generation failed:', error);
      throw new Error(`Falha na geração do DANFE com nfe-danfe-pdf: ${error.message}`);
    }
  }

  /**
   * Optimizes PDF if needed (placeholder for future implementation)
   */
  optimizePDF(pdfBuffer: Buffer): Buffer {
    // For now, just return the original buffer
    // Future implementation could compress or optimize the PDF
    return pdfBuffer;
  }

  /**
   * Cleans up temporary files
   */
  private cleanupTempFiles(filePaths: string[]): void {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[DANFEGenerator] Cleaned up temp file: ${filePath}`);
        }
      } catch (error) {
        console.warn(`[DANFEGenerator] Failed to cleanup temp file ${filePath}:`, error);
      }
    });
  }

  /**
   * Cleans up old temporary files (older than specified hours)
   */
  async cleanupOldTempFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      let cleanedCount = 0;

      // Clean XML files
      if (fs.existsSync(this.xmlDir)) {
        const xmlFiles = await promisify(fs.readdir)(this.xmlDir);
        for (const file of xmlFiles) {
          const filePath = path.join(this.xmlDir, file);
          const stats = await promisify(fs.stat)(filePath);
          
          if (stats.mtime.getTime() < maxAge) {
            await promisify(fs.unlink)(filePath);
            console.log(`[DANFEGenerator] Cleaned up old XML file: ${filePath}`);
            cleanedCount++;
          }
        }
      }

      // Clean PDF files
      if (fs.existsSync(this.pdfDir)) {
        const pdfFiles = await promisify(fs.readdir)(this.pdfDir);
        for (const file of pdfFiles) {
          const filePath = path.join(this.pdfDir, file);
          const stats = await promisify(fs.stat)(filePath);
          
          if (stats.mtime.getTime() < maxAge) {
            await promisify(fs.unlink)(filePath);
            console.log(`[DANFEGenerator] Cleaned up old PDF file: ${filePath}`);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`[DANFEGenerator] Cleaned up ${cleanedCount} old temp files (older than ${maxAgeHours}h)`);
      }
    } catch (error) {
      console.warn('[DANFEGenerator] Failed to cleanup old temp files:', error);
    }
  }

  /**
   * Gets the temp directory paths
   */
  getTempDirectories(): { main: string; xml: string; pdf: string } {
    return {
      main: this.tempDir,
      xml: this.xmlDir,
      pdf: this.pdfDir
    };
  }

  /**
   * Lists files in temp directories
   */
  async listTempFiles(): Promise<{ xml: string[]; pdf: string[] }> {
    try {
      const xmlFiles = fs.existsSync(this.xmlDir) ? await promisify(fs.readdir)(this.xmlDir) : [];
      const pdfFiles = fs.existsSync(this.pdfDir) ? await promisify(fs.readdir)(this.pdfDir) : [];
      
      return {
        xml: xmlFiles.filter(file => file.endsWith('.xml')),
        pdf: pdfFiles.filter(file => file.endsWith('.pdf'))
      };
    } catch (error) {
      console.warn('[DANFEGenerator] Failed to list temp files:', error);
      return { xml: [], pdf: [] };
    }
  }

  /**
   * Checks if temp files exist for a document ID
   */
  async checkTempFiles(documentId: string): Promise<{ 
    xmlExists: boolean; 
    pdfExists: boolean; 
    xmlPath?: string; 
    pdfPath?: string;
    pdfSize?: number;
    pdfModified?: Date;
  }> {
    const xmlPath = path.join(this.xmlDir, `${documentId}.xml`);
    const pdfPath = path.join(this.pdfDir, `${documentId}.pdf`);
    
    let pdfSize: number | undefined;
    let pdfModified: Date | undefined;
    
    if (fs.existsSync(pdfPath)) {
      try {
        const stats = fs.statSync(pdfPath);
        pdfSize = stats.size;
        pdfModified = stats.mtime;
      } catch (error) {
        console.warn(`[DANFEGenerator] Failed to get PDF stats for ${documentId}:`, error);
      }
    }
    
    return {
      xmlExists: fs.existsSync(xmlPath),
      pdfExists: fs.existsSync(pdfPath),
      xmlPath: fs.existsSync(xmlPath) ? xmlPath : undefined,
      pdfPath: fs.existsSync(pdfPath) ? pdfPath : undefined,
      pdfSize,
      pdfModified
    };
  }
}

// Export singleton instance
export const danfeGenerator = new DANFEGenerator();

// Schedule cleanup of old temp files every hour
setInterval(() => {
  danfeGenerator.cleanupOldTempFiles(24).catch(error => { // Keep files for 24 hours
    console.error('[DANFEGenerator] Scheduled cleanup failed:', error);
  });
}, 60 * 60 * 1000); // 1 hour