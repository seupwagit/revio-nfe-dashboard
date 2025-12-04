/**
 * Serviço de Mapeamento de Documentos MongoDB
 * 
 * Mapeia documentos MongoDB para tipos TypeScript da aplicação.
 * Mantém compatibilidade com a estrutura REST API existente.
 * 
 * @module documentMapper
 */

import { Document } from 'mongodb';
import { NotaFiscal, CupomFiscal, ConhecimentoTransporte, DocumentoFiscal } from '../types';
import { validateDocument } from '../schemas/documentSchemas';

/**
 * Regra de mapeamento de campo
 */
export interface MappingRule {
  /** Campo no MongoDB */
  mongoField: string;
  /** Campo na aplicação */
  appField: string;
  /** Função de transformação opcional */
  transform?: (value: any) => any;
}

/**
 * Tipo de documento fiscal
 */
export type DocumentType = 'nfe' | 'cfe' | 'cte';

/**
 * Serviço de Mapeamento de Documentos
 * 
 * Converte documentos MongoDB para objetos TypeScript tipados.
 */
export class DocumentMapperService {
  private mappings: Map<string, MappingRule[]> = new Map();

  constructor() {
    this.registerDefaultMappings();
  }

  /**
   * Registra mapeamentos padrão para cada tipo de documento
   */
  private registerDefaultMappings(): void {
    // Mapeamentos serão adicionados conforme necessário
  }

  /**
   * Mapeia um documento MongoDB para tipo da aplicação
   * 
   * @param doc Documento MongoDB
   * @param type Tipo do documento
   * @param validate Se deve validar com Zod (padrão: true)
   * @returns Documento tipado
   * @throws {Error} Se a validação falhar
   */
  public mapDocument(
    doc: Document,
    type: DocumentType,
    validate: boolean = true
  ): NotaFiscal | CupomFiscal | ConhecimentoTransporte {
    let mapped: NotaFiscal | CupomFiscal | ConhecimentoTransporte;
    
    switch (type) {
      case 'nfe':
        mapped = this.mapNFe(doc);
        break;
      case 'cfe':
        mapped = this.mapCFe(doc);
        break;
      case 'cte':
        mapped = this.mapCTe(doc);
        break;
      default:
        throw new Error(`Tipo de documento desconhecido: ${type}`);
    }

    // Valida com Zod se solicitado
    if (validate) {
      try {
        return validateDocument(mapped, type) as any;
      } catch (error) {
        console.error('❌ Erro de validação Zod:', error);
        throw new Error(
          `Documento inválido após mapeamento: ${
            error instanceof Error ? error.message : 'Erro desconhecido'
          }`
        );
      }
    }

    return mapped;
  }

  /**
   * Mapeia múltiplos documentos
   * 
   * @param docs Documentos MongoDB
   * @param type Tipo dos documentos
   * @returns Array de documentos tipados
   */
  public mapDocuments(
    docs: Document[],
    type: DocumentType
  ): DocumentoFiscal[] {
    return docs.map(doc => this.mapDocument(doc, type));
  }

  /**
   * Mapeia NF-e do MongoDB para aplicação
   */
  private mapNFe(doc: Document): NotaFiscal {
    return {
      id: doc._id || doc.CHV_NFE,
      numero: doc.NUM_DOC || '',
      serie: doc.SER || '',
      modelo: doc.COD_MOD || '',
      dataEmissao: doc.DT_DOC ? new Date(doc.DT_DOC).toISOString() : '',
      valorTotal: doc.VL_DOC || 0,
      status: this.mapStatus(doc.PROTOCOLADA),
      chaveAcesso: doc.CHV_NFE || '',
      tipo: 'nfe',
      naturezaOperacao: doc.NAT_OP || '',
      tipoOperacao: doc.IND_OPER || '',
      emitente: {
        cnpj: doc.CNPJ_EMIT || '',
        razaoSocial: doc.NOME_EMIT || '',
        ie: doc.IE,
        uf: doc.UF_ORIGEM
      },
      destinatario: {
        cnpj: doc.CNPJ_DEST || '',
        razaoSocial: doc.NOME_DEST || '',
        uf: doc.UF_DESTINO
      },
      itens: [],
      totais: {
        baseCalculo: doc.VL_BC_ICMS,
        valorICMS: doc.VL_ICMS,
        valorIPI: doc.VL_IPI,
        valorPIS: doc.VL_PIS,
        valorCOFINS: doc.VL_COFINS,
        valorFrete: doc.VL_FRT,
        valorSeguro: doc.VL_SEG,
        valorDesconto: doc.VL_DESC,
        valorOutros: doc.VL_OUT_DA
      }
    };
  }

  /**
   * Mapeia CF-e do MongoDB para aplicação
   */
  private mapCFe(doc: Document): CupomFiscal {
    return {
      id: doc._id || doc.CHV_NFE,
      numero: doc.NUM_DOC || '',
      serie: doc.SER || '',
      numeroSAT: doc.NUM_SAT || '',
      dataEmissao: doc.DT_DOC ? new Date(doc.DT_DOC).toISOString() : '',
      valorTotal: doc.VL_DOC || 0,
      status: this.mapStatus(doc.PROTOCOLADA),
      chaveAcesso: doc.CHV_NFE || '',
      tipo: 'cfe',
      emitente: {
        cnpj: doc.CNPJ_EMIT || '',
        razaoSocial: doc.NOME_EMIT || '',
        ie: doc.IE
      },
      destinatario: doc.CPF_CNPJ_DEST ? {
        cpfCnpj: doc.CPF_CNPJ_DEST,
        nome: doc.NOME_DEST
      } : undefined,
      itens: [],
      totais: {
        descontos: doc.VL_DESC_SUBTOT,
        acrescimos: doc.VL_ACRES_SUBTOT
      },
      pagamento: {
        meios: [{
          tipo: doc.FORMA_PAG || '',
          valor: doc.VL_PAG || 0
        }]
      }
    };
  }

  /**
   * Mapeia CT-e do MongoDB para aplicação
   */
  private mapCTe(doc: Document): ConhecimentoTransporte {
    return {
      id: doc._id || doc.CHV_NFE,
      numero: doc.NUM_DOC || '',
      serie: doc.SER || '',
      modelo: doc.COD_MOD || '',
      dataEmissao: doc.DT_DOC ? new Date(doc.DT_DOC).toISOString() : '',
      valorTotal: doc.VL_DOC || 0,
      status: this.mapStatus(doc.PROTOCOLADA),
      chaveAcesso: doc.CHV_NFE || '',
      tipo: 'cte',
      tipoServico: doc.TP_SERV || '',
      tomador: {
        tipo: doc.toma?.tipo || '',
        cnpj: doc.toma?.CNPJ || '',
        razaoSocial: doc.toma?.xNome || '',
        ie: doc.toma?.IE
      },
      remetente: {
        cnpj: doc.rem?.CNPJ || '',
        razaoSocial: doc.rem?.xNome || '',
        municipio: doc.rem?.xMun,
        uf: doc.rem?.UF
      },
      destinatario: {
        cnpj: doc.dest?.CNPJ || '',
        razaoSocial: doc.dest?.xNome || '',
        municipio: doc.dest?.xMun,
        uf: doc.dest?.UF
      },
      expedidor: doc.exped ? {
        cnpj: doc.exped.CNPJ,
        razaoSocial: doc.exped.xNome
      } : undefined,
      recebedor: doc.receb ? {
        cnpj: doc.receb.CNPJ,
        razaoSocial: doc.receb.xNome
      } : undefined,
      carga: {
        produto: doc.infCarga?.proPred || '',
        peso: doc.infCarga?.vCarga,
        volume: doc.infCarga?.qCarga,
        unidade: doc.infCarga?.cUnid
      },
      valores: {
        servico: doc.vPrest?.vTPrest || 0,
        receber: doc.vPrest?.vRec || 0,
        icms: doc.imp?.ICMS?.vICMS,
        baseCalculo: doc.imp?.ICMS?.vBC
      },
      rodoviario: doc.rodo ? {
        rntrc: doc.rodo.RNTRC,
        veiculo: doc.rodo.veic ? {
          placa: doc.rodo.veic.placa,
          uf: doc.rodo.veic.UF
        } : undefined,
        motorista: doc.rodo.moto ? {
          cpf: doc.rodo.moto.CPF,
          nome: doc.rodo.moto.xNome
        } : undefined
      } : undefined
    };
  }

  /**
   * Mapeia status do MongoDB para aplicação
   */
  private mapStatus(protocolada?: string): 'autorizada' | 'cancelada' | 'denegada' | 'processando' {
    if (protocolada === 'Sim') return 'autorizada';
    if (protocolada === 'Não') return 'processando';
    return 'processando';
  }

  /**
   * Registra mapeamento customizado
   */
  public registerMapping(type: string, rules: MappingRule[]): void {
    this.mappings.set(type, rules);
  }
}

/**
 * Instância global do serviço de mapeamento
 */
export const documentMapperService = new DocumentMapperService();
