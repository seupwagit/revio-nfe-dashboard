/**
 * Schemas Zod para Validação de Documentos Fiscais
 * 
 * Define schemas de validação para garantir integridade dos dados
 * mapeados do MongoDB.
 * 
 * @module documentSchemas
 */

import { z } from 'zod';

/**
 * Schema para Emitente de NF-e
 */
const emitenteNFeSchema = z.object({
  cnpj: z.string().min(1, 'CNPJ do emitente é obrigatório'),
  razaoSocial: z.string().min(1, 'Razão social do emitente é obrigatória'),
  nomeFantasia: z.string().optional(),
  ie: z.string().optional(),
  endereco: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional()
});

/**
 * Schema para Destinatário de NF-e
 */
const destinatarioNFeSchema = z.object({
  cnpj: z.string().min(1, 'CNPJ do destinatário é obrigatório'),
  razaoSocial: z.string().min(1, 'Razão social do destinatário é obrigatória'),
  ie: z.string().optional(),
  endereco: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional()
});

/**
 * Schema para Item de NF-e
 */
const itemNFeSchema = z.object({
  codigo: z.string(),
  descricao: z.string(),
  quantidade: z.number().positive(),
  valorUnitario: z.number().nonnegative(),
  valorTotal: z.number().nonnegative(),
  ncm: z.string().optional(),
  cfop: z.string().optional(),
  unidade: z.string().optional(),
  ean: z.string().optional()
});

/**
 * Schema para Totais de NF-e
 */
const totaisNFeSchema = z.object({
  baseCalculo: z.number().optional(),
  valorICMS: z.number().optional(),
  valorIPI: z.number().optional(),
  valorPIS: z.number().optional(),
  valorCOFINS: z.number().optional(),
  valorFrete: z.number().optional(),
  valorSeguro: z.number().optional(),
  valorDesconto: z.number().optional(),
  valorOutros: z.number().optional()
});

/**
 * Schema para NF-e (Nota Fiscal Eletrônica)
 */
export const notaFiscalSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  serie: z.string().min(1, 'Série é obrigatória'),
  modelo: z.string(),
  dataEmissao: z.string().min(1, 'Data de emissão é obrigatória'),
  valorTotal: z.number().nonnegative('Valor total deve ser não-negativo'),
  status: z.enum(['autorizada', 'cancelada', 'denegada', 'processando']),
  chaveAcesso: z.string().min(1, 'Chave de acesso é obrigatória'),
  tipo: z.literal('nfe'),
  naturezaOperacao: z.string(),
  tipoOperacao: z.string(),
  emitente: emitenteNFeSchema,
  destinatario: destinatarioNFeSchema,
  itens: z.array(itemNFeSchema),
  totais: totaisNFeSchema,
  transporte: z.object({
    modalidade: z.string().optional(),
    transportadora: z.object({
      cnpj: z.string().optional(),
      razaoSocial: z.string().optional()
    }).optional(),
    veiculo: z.object({
      placa: z.string().optional(),
      uf: z.string().optional()
    }).optional()
  }).optional(),
  pagamento: z.object({
    forma: z.string().optional(),
    valor: z.number().optional()
  }).optional(),
  informacoesAdicionais: z.string().optional()
});

/**
 * Schema para CF-e (Cupom Fiscal Eletrônico)
 */
export const cupomFiscalSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  serie: z.string().min(1, 'Série é obrigatória'),
  numeroSAT: z.string().min(1, 'Número SAT é obrigatório'),
  dataEmissao: z.string().min(1, 'Data de emissão é obrigatória'),
  valorTotal: z.number().nonnegative('Valor total deve ser não-negativo'),
  status: z.enum(['autorizada', 'cancelada', 'denegada', 'processando']),
  chaveAcesso: z.string().min(1, 'Chave de acesso é obrigatória'),
  tipo: z.literal('cfe'),
  emitente: z.object({
    cnpj: z.string().min(1, 'CNPJ do emitente é obrigatório'),
    razaoSocial: z.string().min(1, 'Razão social do emitente é obrigatória'),
    nomeFantasia: z.string().optional(),
    ie: z.string().optional()
  }),
  destinatario: z.object({
    cpfCnpj: z.string().optional(),
    nome: z.string().optional()
  }).optional(),
  itens: z.array(z.object({
    codigo: z.string(),
    descricao: z.string(),
    quantidade: z.number().positive(),
    valorUnitario: z.number().nonnegative(),
    valorTotal: z.number().nonnegative(),
    unidade: z.string().optional(),
    desconto: z.number().optional()
  })),
  totais: z.object({
    descontos: z.number().optional(),
    acrescimos: z.number().optional()
  }),
  pagamento: z.object({
    meios: z.array(z.object({
      tipo: z.string(),
      valor: z.number().nonnegative()
    }))
  })
});

/**
 * Schema para CT-e (Conhecimento de Transporte Eletrônico)
 */
export const conhecimentoTransporteSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  serie: z.string().min(1, 'Série é obrigatória'),
  modelo: z.string(),
  dataEmissao: z.string().min(1, 'Data de emissão é obrigatória'),
  valorTotal: z.number().nonnegative('Valor total deve ser não-negativo'),
  status: z.enum(['autorizada', 'cancelada', 'denegada', 'processando']),
  chaveAcesso: z.string().min(1, 'Chave de acesso é obrigatória'),
  tipo: z.literal('cte'),
  tipoServico: z.string(),
  tomador: z.object({
    tipo: z.string(),
    cnpj: z.string().min(1, 'CNPJ do tomador é obrigatório'),
    razaoSocial: z.string().min(1, 'Razão social do tomador é obrigatória'),
    ie: z.string().optional()
  }),
  remetente: z.object({
    cnpj: z.string().min(1, 'CNPJ do remetente é obrigatório'),
    razaoSocial: z.string().min(1, 'Razão social do remetente é obrigatória'),
    endereco: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional()
  }),
  destinatario: z.object({
    cnpj: z.string().min(1, 'CNPJ do destinatário é obrigatório'),
    razaoSocial: z.string().min(1, 'Razão social do destinatário é obrigatória'),
    endereco: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional()
  }),
  expedidor: z.object({
    cnpj: z.string().optional(),
    razaoSocial: z.string().optional()
  }).optional(),
  recebedor: z.object({
    cnpj: z.string().optional(),
    razaoSocial: z.string().optional()
  }).optional(),
  carga: z.object({
    produto: z.string(),
    peso: z.number().optional(),
    volume: z.number().optional(),
    unidade: z.string().optional()
  }),
  valores: z.object({
    servico: z.number().nonnegative(),
    receber: z.number().nonnegative(),
    icms: z.number().optional(),
    baseCalculo: z.number().optional()
  }),
  rodoviario: z.object({
    rntrc: z.string().optional(),
    veiculo: z.object({
      placa: z.string().optional(),
      uf: z.string().optional()
    }).optional(),
    motorista: z.object({
      cpf: z.string().optional(),
      nome: z.string().optional()
    }).optional()
  }).optional()
});

/**
 * Valida um documento usando o schema apropriado
 * 
 * @param document Documento a validar
 * @param type Tipo do documento
 * @returns Documento validado
 * @throws {z.ZodError} Se a validação falhar
 */
export function validateDocument(document: unknown, type: 'nfe' | 'cfe' | 'cte') {
  switch (type) {
    case 'nfe':
      return notaFiscalSchema.parse(document);
    case 'cfe':
      return cupomFiscalSchema.parse(document);
    case 'cte':
      return conhecimentoTransporteSchema.parse(document);
    default:
      throw new Error(`Tipo de documento desconhecido: ${type}`);
  }
}

/**
 * Valida um documento de forma segura (não lança exceção)
 * 
 * @param document Documento a validar
 * @param type Tipo do documento
 * @returns Resultado da validação
 */
export function safeValidateDocument(document: unknown, type: 'nfe' | 'cfe' | 'cte') {
  switch (type) {
    case 'nfe':
      return notaFiscalSchema.safeParse(document);
    case 'cfe':
      return cupomFiscalSchema.safeParse(document);
    case 'cte':
      return conhecimentoTransporteSchema.safeParse(document);
    default:
      return { success: false, error: new Error(`Tipo desconhecido: ${type}`) };
  }
}
