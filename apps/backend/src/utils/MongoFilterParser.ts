import { FilterItem, FilterOperator } from '@fiscal/shared';
import { Filter } from 'mongodb';

export class MongoFilterParser {
  /**
   * Converte um array de FilterItem em um objeto de consulta do MongoDB
   */
  static parse(filters: FilterItem[]): Filter<any> {
    const query: Record<string, any> = {};

    filters.forEach((item) => {
      const { field, operator, value } = item;
      
      // Mapeamento de nomes de campos se necessário
      const mongoField = this.mapField(field);
      
      if (!query[mongoField]) {
        query[mongoField] = {};
      }

      const mongoOp = this.mapOperator(operator, value, field);
      
      if (typeof mongoOp === 'object' && mongoOp !== null && !Array.isArray(mongoOp)) {
        Object.assign(query[mongoField], mongoOp);
      } else {
        query[mongoField] = mongoOp;
      }
    });

    return query;
  }

  /**
   * Mapeia operadores genéricos para operadores MongoDB com conversão de tipo se necessário
   */
  private static mapOperator(operator: FilterOperator, value: any, field: string): any {
    // Lista de campos que devem ser tratados como números
    const numericFields = [
      'VL_DOC', 'VALOR_TOTAL', 'VL_BC_ICMS', 'VL_BC', 'V_BC', 'BASE_CALCULO',
      'VL_ICMS', 'V_ICMS', 'VL_IPI', 'V_IPI', 'VL_PIS', 'V_PIS', 'VL_COFINS', 'V_COFINS',
      'VL_FRT', 'V_FRT', 'V_FRETE', 'VL_SEG', 'V_SEG', 'V_SEGURO', 'VL_DESC', 'V_DESC',
      'VALOR_DESCONTO', 'VL_OUT_DA', 'V_OUTRO', 'VALOR_OUTRO'
    ];

    let finalValue = value;
    
    // Tentar converter para número se o campo for numérico e o valor for string
    if (numericFields.includes(field) && typeof value === 'string' && value.trim() !== '') {
      const num = Number(value);
      if (!isNaN(num)) {
        finalValue = num;
      }
    }

    switch (operator) {
      case 'eq': return { $eq: finalValue };
      case 'ne': return { $ne: finalValue };
      case 'gt': return { $gt: finalValue };
      case 'gte': return { $gte: finalValue };
      case 'lt': return { $lt: finalValue };
      case 'lte': return { $lte: finalValue };
      case 'in': return { $in: Array.isArray(finalValue) ? finalValue : [finalValue] };
      case 'contains': 
        return { $regex: finalValue, $options: 'i' };
      case 'regex': 
        return { $regex: finalValue, $options: 'i' };
      case 'between':
        if (Array.isArray(finalValue) && finalValue.length === 2) {
          return { $gte: finalValue[0], $lte: finalValue[1] };
        }
        return finalValue;
      default:
        return finalValue;
    }
  }

  /**
   * Mapeia nomes de campos do frontend para o esquema do MongoDB
   */
  private static mapField(field: string): string {
    const mappings: Record<string, string> = {
      'id': '_id',
      'dataEmissao': 'DT_DOC',
      'numero': 'NUM_DOC',
      'serie': 'SER',
      'modelo': 'COD_MOD',
      'valorTotal': 'VL_DOC',
      'chaveAcesso': 'CHV_NFE',
      'naturezaOperacao': 'NAT_OP',
      'tipoOperacao': 'IND_OPER',
      'cnpjEmitente': 'CNPJ_EMIT',
      'cnpjDestinatario': 'CNPJ_DEST',
      'cnpjEmit': 'CNPJ_EMIT',
      'cnpjDest': 'CNPJ_DEST',
      'emitente.cnpj': 'CNPJ_EMIT',
      'destinatario.cnpj': 'CNPJ_DEST',
      'emitente.razaoSocial': 'NOME_EMIT',
      'destinatario.razaoSocial': 'NOME_DEST',
      'protocolada': 'PROTOCOLADA',
      'tipo': 'TIPO',
      'tipoServico': 'TP_SERV',
      'valores.servico': 'VL_SERV',
      'tomador.razaoSocial': 'NOME_TOMADOR',
      'remetente.razaoSocial': 'NOME_REMTR',
      'numeroSAT': 'NUM_SAT',
      'pagamento.forma': 'FORMA_PAGTO',
      'status': 'STATUS'
    };

    return mappings[field] || field;
  }
}
