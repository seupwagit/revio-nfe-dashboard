import { describe, expect, it } from 'vitest';
import { DocumentTransformer } from '../../../utils/DocumentTransformer';

describe('DocumentTransformer', () => {
  describe('nestDocument', () => {
    it('deve transformar um documento plano em uma estrutura aninhada', () => {
      // Arrange
      const rawDoc = {
        _id: '507f1f77bcf86cd799439011',
        CHV_NFE: '35240112345678000190550010001234561876543210',
        NUM_DOC: '123456',
        SERIE: '1',
        MODELO: '55',
        DT_DOC: '2024-01-28T00:00:00.000Z',
        VL_DOC: 1500.50,
        VL_BC_ICMS: 1000.00,
        VL_ICMS: 180.00,
        VL_FRT: 50.00,
        IND_OPER: '1',
        CNPJ_EMIT: '12345678000190',
        RAZAO_EMIT: 'EMPRESA TESTE LTDA',
        CNPJ_DEST: '98765432000100',
        RAZAO_DEST: 'CLIENTE TESTE SA',
        STATUS: 'AUTORIZADA'
      };

      // Act
      const result = DocumentTransformer.nestDocument(rawDoc);

      // Assert
      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.chaveAcesso).toBe(rawDoc.CHV_NFE);
      expect(result.numero).toBe(rawDoc.NUM_DOC);
      expect(result.valorTotal).toBe(rawDoc.VL_DOC);
      expect(result.status).toBe('autorizada');

      // Totais
      expect(result.totais).toBeDefined();
      expect(result.totais.baseCalculo).toBe(1000.00);
      expect(result.totais.valorICMS).toBe(180.00);
      expect(result.totais.valorFrete).toBe(50.00);
      expect(result.tipoOperacao).toBe('1');

      // Emitente
      expect(result.emitente).toBeDefined();
      expect(result.emitente.cnpj).toBe('12345678000190');
      expect(result.emitente.razaoSocial).toBe('EMPRESA TESTE LTDA');

      // Destinatario
      expect(result.destinatario).toBeDefined();
      expect(result.destinatario.cnpj).toBe('98765432000100');
      expect(result.destinatario.razaoSocial).toBe('CLIENTE TESTE SA');
    });

    it('deve lidar com campos nulos ou ausentes graciosamente', () => {
      // Arrange
      const rawDoc = {
        _id: '123',
        CHV_NFE: 'KEY123'
      };

      // Act
      const result = DocumentTransformer.nestDocument(rawDoc);

      // Assert
      expect(result.totais.baseCalculo).toBe(0);
      expect(result.emitente.cnpj).toBe('');
      expect(result.destinatario.uf).toBe('');
    });

    it('deve suportar variações de nomes de campos (ex: VL_BC_ICMS vs V_BC)', () => {
      // Arrange
      const docWithVBC = { V_BC: 100 };
      const docWithFull = { VL_BC_ICMS: 200 };

      // Act
      const res1 = DocumentTransformer.nestDocument(docWithVBC);
      const res2 = DocumentTransformer.nestDocument(docWithFull);

      // Assert
      expect(res1.totais.baseCalculo).toBe(100);
      expect(res2.totais.baseCalculo).toBe(200);
    });
  });

  describe('transformResults', () => {
    it('deve transformar uma lista de documentos', () => {
      // Arrange
      const docs = [
        { NUM_DOC: '1' },
        { NUM_DOC: '2' }
      ];

      // Act
      const results = DocumentTransformer.transformResults(docs);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].numero).toBe('1');
      expect(results[1].numero).toBe('2');
      expect(results[0].totais).toBeDefined();
    });

    it('deve retornar array vazio para entrada inválida', () => {
      expect(DocumentTransformer.transformResults(null as any)).toEqual([]);
      expect(DocumentTransformer.transformResults('not an array' as any)).toEqual([]);
    });
  });
});
