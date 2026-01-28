/**
 * DocumentTransformer
 * 
 * Classe utilitária para transformar documentos "flats" do MongoDB (origem SQL Server)
 * na estrutura de objetos aninhados esperada pelo frontend.
 */
export class DocumentTransformer {
  /**
   * Transforma um documento plano em uma estrutura aninhada (nesting)
   * 
   * @param doc Documento bruto do banco de dados
   * @returns Documento transformado com totais, emitente e destinatario
   */
  public static nestDocument(doc: any): any {
    if (!doc || typeof doc !== 'object') return doc;

    // Criar uma cópia para não mutar o original se necessário, 
    // mas aqui vamos construir o novo objeto para garantir a estrutura
    const transformed = { 
      ...doc,
      // Garantir campos básicos em camelCase no nível raiz
      id: doc._id?.toString() || doc.id,
      chaveAcesso: doc.CHV_NFE || doc.CHV_CTE || doc.CHV_CFE || doc.CHV || doc.chaveAcesso,
      numero: doc.NUM_DOC || doc.NUMERO || doc.numero,
      serie: doc.SERIE || doc.SER || doc.serie,
      modelo: doc.MODELO || doc.COD_MOD || doc.modelo,
      dataEmissao: doc.DT_DOC || doc.dataEmissao,
      valorTotal: Number(doc.VL_DOC || doc.VALOR_TOTAL || doc.valorTotal || 0),
      status: (doc.STATUS || doc.status || '').toLowerCase(),
      protocolada: doc.PROTOCOLADA || doc.protocolo || doc.protocolada,
      naturezaOperacao: doc.NAT_OP || doc.NAT_OPER || doc.naturezaOperacao,
      tipoOperacao: doc.IND_OPER || doc.tipoOperacao || '1'
    };

    // 1. Mapeamento de Totais
    transformed.totais = {
      baseCalculo: Number(doc.VL_BC_ICMS || doc.VL_BC || doc.V_BC || doc.BASE_CALCULO || 0),
      valorICMS: Number(doc.VL_ICMS || doc.V_ICMS || 0),
      valorIPI: Number(doc.VL_IPI || doc.V_IPI || 0),
      valorPIS: Number(doc.VL_PIS || doc.V_PIS || 0),
      valorCOFINS: Number(doc.VL_COFINS || doc.V_COFINS || 0),
      valorFrete: Number(doc.VL_FRT || doc.V_FRT || doc.V_FRETE || 0),
      valorSeguro: Number(doc.VL_SEG || doc.V_SEG || doc.V_SEGURO || 0),
      valorDesconto: Number(doc.VL_DESC || doc.V_DESC || doc.VALOR_DESCONTO || 0),
      valorOutros: Number(doc.VL_OUT_DA || doc.V_OUTRO || doc.VALOR_OUTRO || 0)
    };

    // 2. Mapeamento de Emitente
    transformed.emitente = {
      cnpj: doc.CNPJ_EMIT || doc.CPF_EMIT || '',
      razaoSocial: doc.RAZAO_EMIT || doc.NOME_EMIT || doc.NM_EMIT || '',
      nomeFantasia: doc.NM_FANTASIA_EMIT || doc.NOME_FANTASIA_EMIT || '',
      ie: doc.IE_EMIT || '',
      endereco: doc.LOGRADOURO_EMIT || doc.ENDERECO_EMIT || '',
      municipio: doc.MUNICIPIO_EMIT || doc.NM_MUN_EMIT || doc.CIDADE_EMIT || '',
      uf: doc.UF_EMIT || ''
    };

    // 3. Mapeamento de Destinatário
    transformed.destinatario = {
      cnpj: doc.CNPJ_DEST || '',
      cpfCnpj: doc.CNPJ_DEST || doc.CPF_DEST || '',
      razaoSocial: doc.RAZAO_DEST || doc.NOME_DEST || doc.NM_DEST || '',
      nomeFantasia: doc.NM_FANTASIA_DEST || '',
      ie: doc.IE_DEST || '',
      endereco: doc.LOGRADOURO_DEST || doc.ENDERECO_DEST || '',
      municipio: doc.MUNICIPIO_DEST || doc.NM_MUN_DEST || doc.CIDADE_DEST || '',
      uf: doc.UF_DEST || ''
    };

    return transformed;
  }

  /**
   * Transforma uma lista de documentos
   */
  public static transformResults(results: any[]): any[] {
    if (!Array.isArray(results)) return [];
    return results.map(doc => this.nestDocument(doc));
  }
}
