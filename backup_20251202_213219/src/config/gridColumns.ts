/**
 * Mapeamento completo de colunas da grid
 * Label (o que o usuário vê) → Campo (propriedade do objeto)
 */

export interface ColumnMapping {
  label: string           // Nome da coluna na grid
  field: string          // Campo no objeto de dados
  aliases: string[]      // Variações que o usuário pode digitar
  type: 'text' | 'number' | 'date' | 'boolean' | 'enum'
  enumValues?: string[]  // Valores possíveis (para enums)
}

export const gridColumns: ColumnMapping[] = [
  // Identificação
  {
    label: 'Chave',
    field: 'chaveAcesso',
    aliases: ['chave', 'chave acesso', 'chave de acesso', 'chave nfe'],
    type: 'text'
  },
  {
    label: 'Número',
    field: 'numero',
    aliases: ['numero', 'número', 'num', 'nota', 'numero nota', 'número nota'],
    type: 'text'
  },
  {
    label: 'Série',
    field: 'serie',
    aliases: ['serie', 'série'],
    type: 'text'
  },
  {
    label: 'Modelo',
    field: 'modelo',
    aliases: ['modelo', 'mod'],
    type: 'text'
  },
  
  // Datas e Status
  {
    label: 'Data Emissão',
    field: 'dataEmissao',
    aliases: ['data', 'data emissao', 'data emissão', 'dt emissao', 'dt emissão', 'emissao', 'emissão'],
    type: 'date'
  },
  {
    label: 'Status',
    field: 'status',
    aliases: ['status', 'situacao', 'situação'],
    type: 'enum',
    enumValues: ['autorizada', 'processando', 'cancelada', 'denegada', 'rejeitada']
  },
  {
    label: 'Protocolada',
    field: 'protocolada',
    aliases: ['protocolada', 'protocolo'],
    type: 'enum',
    enumValues: ['Sim', 'Não']
  },
  
  // Operação
  {
    label: 'Tipo Doc',
    field: 'tipo',
    aliases: ['tipo', 'tipo doc', 'tipo documento', 'tipodoc'],
    type: 'enum',
    enumValues: ['recebida', 'emitida', 'nfe', 'cte', 'cfe']
  },
  {
    label: 'Operação',
    field: 'tipoOperacao',
    aliases: ['operacao', 'operação', 'tipo operacao', 'tipo operação'],
    type: 'enum',
    enumValues: ['0', '1', 'entrada', 'saida', 'saída']
  },
  {
    label: 'Natureza Operação',
    field: 'naturezaOperacao',
    aliases: ['natureza', 'natureza operacao', 'natureza operação', 'nat oper'],
    type: 'text'
  },
  
  // Valores
  {
    label: 'Valor Total',
    field: 'valorTotal',
    aliases: ['valor', 'valor total', 'vl total', 'total'],
    type: 'number'
  },
  {
    label: 'Base Cálculo',
    field: 'totais.baseCalculo',
    aliases: ['base', 'base calculo', 'base cálculo', 'bc'],
    type: 'number'
  },
  {
    label: 'ICMS',
    field: 'totais.valorICMS',
    aliases: ['icms', 'valor icms', 'vl icms'],
    type: 'number'
  },
  {
    label: 'IPI',
    field: 'totais.valorIPI',
    aliases: ['ipi', 'valor ipi', 'vl ipi'],
    type: 'number'
  },
  {
    label: 'PIS',
    field: 'totais.valorPIS',
    aliases: ['pis', 'valor pis', 'vl pis'],
    type: 'number'
  },
  {
    label: 'COFINS',
    field: 'totais.valorCOFINS',
    aliases: ['cofins', 'valor cofins', 'vl cofins'],
    type: 'number'
  },
  {
    label: 'Frete',
    field: 'totais.valorFrete',
    aliases: ['frete', 'valor frete', 'vl frete'],
    type: 'number'
  },
  {
    label: 'Seguro',
    field: 'totais.valorSeguro',
    aliases: ['seguro', 'valor seguro', 'vl seguro'],
    type: 'number'
  },
  {
    label: 'Desconto',
    field: 'totais.valorDesconto',
    aliases: ['desconto', 'valor desconto', 'vl desconto', 'desc'],
    type: 'number'
  },
  {
    label: 'Outros',
    field: 'totais.valorOutros',
    aliases: ['outros', 'valor outros', 'vl outros'],
    type: 'number'
  },
  
  // Emitente
  {
    label: 'CNPJ Emitente',
    field: 'emitente.cnpj',
    aliases: ['cnpj emitente', 'cnpj emit', 'cnpj do emitente'],
    type: 'text'
  },
  {
    label: 'Razão Social Emitente',
    field: 'emitente.razaoSocial',
    aliases: ['razao social emitente', 'razão social emitente', 'emitente', 'empresa emitente', 'fornecedor'],
    type: 'text'
  },
  {
    label: 'Nome Fantasia Emitente',
    field: 'emitente.nomeFantasia',
    aliases: ['nome fantasia emitente', 'fantasia emitente', 'nome emitente'],
    type: 'text'
  },
  {
    label: 'IE Emitente',
    field: 'emitente.ie',
    aliases: ['ie emitente', 'inscricao estadual emitente', 'inscrição estadual emitente'],
    type: 'text'
  },
  {
    label: 'Endereço Emitente',
    field: 'emitente.endereco',
    aliases: ['endereco emitente', 'endereço emitente', 'end emitente'],
    type: 'text'
  },
  {
    label: 'Município Emitente',
    field: 'emitente.municipio',
    aliases: ['municipio emitente', 'município emitente', 'cidade emitente'],
    type: 'text'
  },
  {
    label: 'UF Emitente',
    field: 'emitente.uf',
    aliases: ['uf emitente', 'estado emitente'],
    type: 'text'
  },
  
  // Destinatário
  {
    label: 'CNPJ Destinatário',
    field: 'destinatario.cnpj',
    aliases: ['cnpj destinatario', 'cnpj destinatário', 'cnpj dest', 'cnpj do destinatario', 'cnpj do destinatário'],
    type: 'text'
  },
  {
    label: 'CPF/CNPJ Destinatário',
    field: 'destinatario.cpfCnpj',
    aliases: ['cpf cnpj destinatario', 'cpf cnpj destinatário', 'cpf destinatario', 'cpf destinatário'],
    type: 'text'
  },
  {
    label: 'Razão Social Destinatário',
    field: 'destinatario.razaoSocial',
    aliases: ['razao social destinatario', 'razão social destinatário', 'destinatario', 'destinatário', 'cliente'],
    type: 'text'
  },
  {
    label: 'Nome Destinatário',
    field: 'destinatario.nome',
    aliases: ['nome destinatario', 'nome destinatário', 'nome dest'],
    type: 'text'
  },
  {
    label: 'IE Destinatário',
    field: 'destinatario.ie',
    aliases: ['ie destinatario', 'ie destinatário', 'inscricao estadual destinatario', 'inscrição estadual destinatário'],
    type: 'text'
  },
  {
    label: 'Endereço Destinatário',
    field: 'destinatario.endereco',
    aliases: ['endereco destinatario', 'endereço destinatário', 'end destinatario', 'end destinatário'],
    type: 'text'
  },
  {
    label: 'Município Destinatário',
    field: 'destinatario.municipio',
    aliases: ['municipio destinatario', 'município destinatário', 'cidade destinatario', 'cidade destinatário'],
    type: 'text'
  },
  {
    label: 'UF Destinatário',
    field: 'destinatario.uf',
    aliases: ['uf destinatario', 'uf destinatário', 'estado destinatario', 'estado destinatário'],
    type: 'text'
  }
]

/**
 * Encontra o campo correspondente a partir de uma label/alias
 */
export function findFieldByLabel(label: string): ColumnMapping | undefined {
  const labelLower = label.toLowerCase().trim()
  
  return gridColumns.find(col => {
    // Verifica label exata
    if (col.label.toLowerCase() === labelLower) return true
    
    // Verifica aliases
    return col.aliases.some(alias => alias.toLowerCase() === labelLower)
  })
}

/**
 * Extrai campo e valor de uma consulta como "tipo doc = recebida"
 */
export function parseFieldQuery(query: string): { field: string, value: string, column: ColumnMapping } | null {
  const match = query.match(/^([^=]+?)\s*=\s*(.+)$/i)
  if (!match) return null
  
  const [, labelPart, valuePart] = match
  const column = findFieldByLabel(labelPart.trim())
  
  if (!column) return null
  
  return {
    field: column.field,
    value: valuePart.trim(),
    column
  }
}

/**
 * Gera lista de exemplos para ajuda
 */
export function getExamples(): string[] {
  return [
    'tipo doc = recebida',
    'status = autorizada',
    'operacao = entrada',
    'valor total maior que 5000',
    'data emissao maior que 01/12/2025',
    'cnpj emitente = 12345678',
    'razao social emitente = petrobras',
    'municipio emitente = sao paulo',
    'uf emitente = sp'
  ]
}
