/**
 * Validação de períodos de data
 */

export interface DateValidationResult {
  valid: boolean
  message?: string
  diffDays?: number
}

/**
 * Valida se o período entre duas datas não excede o máximo permitido
 * @param dataInicio Data inicial (YYYY-MM-DD)
 * @param dataFim Data final (YYYY-MM-DD)
 * @param maxDays Máximo de dias permitido (padrão: 365 = 1 ano)
 */
export function validateDateRange(
  dataInicio: string,
  dataFim: string,
  maxDays: number = 365
): DateValidationResult {
  if (!dataInicio || !dataFim) {
    return {
      valid: false,
      message: 'Data inicial e final são obrigatórias'
    }
  }

  const inicio = new Date(dataInicio)
  const fim = new Date(dataFim)

  // Validar se as datas são válidas
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    return {
      valid: false,
      message: 'Datas inválidas'
    }
  }

  // Validar se data inicial é menor que final
  if (inicio > fim) {
    return {
      valid: false,
      message: 'Data inicial deve ser anterior à data final'
    }
  }

  // Calcular diferença em dias
  const diffTime = fim.getTime() - inicio.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Validar período máximo
  if (diffDays > maxDays) {
    return {
      valid: false,
      message: `Período máximo permitido é de ${maxDays} dias (${Math.floor(maxDays / 365)} ano${maxDays >= 730 ? 's' : ''})`,
      diffDays
    }
  }

  return {
    valid: true,
    diffDays
  }
}

/**
 * Ajusta a data final para não exceder o período máximo
 */
export function adjustDateRange(
  dataInicio: string,
  maxDays: number = 365
): string {
  const inicio = new Date(dataInicio)
  const maxFim = new Date(inicio)
  maxFim.setDate(maxFim.getDate() + maxDays)
  
  return maxFim.toISOString().split('T')[0]
}
