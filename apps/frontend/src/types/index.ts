// Tipo base para todos os documentos fiscais
import { FilterItem } from '@fiscal/shared';

export interface DocumentoFiscal {
  id: string
  numero: string
  serie: string
  dataEmissao: string
  valorTotal: number
  status: 'autorizada' | 'cancelada' | 'denegada' | 'processando'
  chaveAcesso: string
  tipo: 'nfe' | 'cfe' | 'cte'
}

// NF-e - Nota Fiscal Eletrônica
export interface NotaFiscal extends DocumentoFiscal {
  tipo: 'nfe'
  modelo: string
  naturezaOperacao: string
  tipoOperacao: string
  emitente: {
    cnpj: string
    razaoSocial: string
    nomeFantasia?: string
    ie?: string
    endereco?: string
    municipio?: string
    uf?: string
  }
  destinatario: {
    cnpj: string
    razaoSocial: string
    ie?: string
    endereco?: string
    municipio?: string
    uf?: string
  }
  itens: ItemNF[]
  totais: {
    baseCalculo?: number
    valorICMS?: number
    valorIPI?: number
    valorPIS?: number
    valorCOFINS?: number
    valorFrete?: number
    valorSeguro?: number
    valorDesconto?: number
    valorOutros?: number
  }
  transporte?: {
    modalidade?: string
    transportadora?: {
      cnpj?: string
      razaoSocial?: string
    }
    veiculo?: {
      placa?: string
      uf?: string
    }
  }
  pagamento?: {
    forma?: string
    valor?: number
  }
  informacoesAdicionais?: string
}

// CF-e - Cupom Fiscal Eletrônico (SAT)
export interface CupomFiscal extends DocumentoFiscal {
  tipo: 'cfe'
  numeroSAT: string
  emitente: {
    cnpj: string
    razaoSocial: string
    nomeFantasia?: string
    ie?: string
  }
  destinatario?: {
    cpfCnpj?: string
    nome?: string
  }
  itens: ItemCF[]
  totais: {
    descontos?: number
    acrescimos?: number
  }
  pagamento: {
    meios: Array<{
      tipo: string
      valor: number
    }>
  }
}

// CT-e - Conhecimento de Transporte Eletrônico
export interface ConhecimentoTransporte extends DocumentoFiscal {
  tipo: 'cte'
  modelo: string
  tipoServico: string
  tomador: {
    tipo: string
    cnpj: string
    razaoSocial: string
    ie?: string
  }
  remetente: {
    cnpj: string
    razaoSocial: string
    endereco?: string
    municipio?: string
    uf?: string
  }
  destinatario: {
    cnpj: string
    razaoSocial: string
    endereco?: string
    municipio?: string
    uf?: string
  }
  expedidor?: {
    cnpj?: string
    razaoSocial?: string
  }
  recebedor?: {
    cnpj?: string
    razaoSocial?: string
  }
  carga: {
    produto: string
    peso?: number
    volume?: number
    unidade?: string
  }
  valores: {
    servico: number
    receber: number
    icms?: number
    baseCalculo?: number
  }
  rodoviario?: {
    rntrc?: string
    veiculo?: {
      placa?: string
      uf?: string
    }
    motorista?: {
      cpf?: string
      nome?: string
    }
  }
}

export interface ItemNF {
  codigo: string
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  ncm?: string
  cfop?: string
  unidade?: string
  ean?: string
}

export interface ItemCF {
  codigo: string
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  unidade?: string
  desconto?: number
}

export interface DashboardStats {
  totalNotas: number
  valorTotal: number
  valorTotalEntradas: number
  valorTotalSaidas: number
  qtdEntradas: number
  qtdSaidas: number
  maiorNota: number
  menorNota: number
  notasHoje: number
  notasUltimos7Dias: number
  notasUltimos30Dias: number
  totalICMS: number
  totalIPI: number
  totalPIS: number
  totalCOFINS: number
  valorFrete: number
  valorSeguro: number
  valorDesconto: number
  notasAutorizadas: number
  notasCanceladas: number
}

export interface Filtros {
  dataInicio?: string
  dataFim?: string
  status?: string
  busca?: string
  cnpjEmit?: string
  cnpjDest?: string
  page?: number
  pageSize?: number
  collection?: string
  dynamicFilters?: FilterItem[]
}

export interface ApiResponse {
  data: any[]
  total?: number
  page?: number
  pageSize?: number
}

export interface ContadorResponse {
  total: number
}
