/**
 * Analytics Data Interface
 */

export interface AnalyticsData {
  faturamentoDiario: Array<{
    data: string;
    valor: number;
    quantidade: number;
  }>;
  topEmitentes: Array<{
    nome: string;
    valor: number;
    quantidade: number;
  }>;
  distribuicaoTipos: Array<{
    name: string;
    value: number;
    quantidade: number;
  }>;
  distribuicaoStatus: Array<{
    name: string;
    value: number;
  }>;
  evolucao: Array<{
    mes: string;
    valor: number;
    quantidade: number;
  }>;
  stats: {
    totalNotas: number;
    totalValor: number;
    mediaValor: number;
    maiorNota: number;
    menorNota: number;
  };
}