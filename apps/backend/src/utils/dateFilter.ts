/**
 * Utilitário para criar filtros de data consistentes
 * 
 * IMPORTANTE: Este é o ÚNICO lugar onde a lógica de filtro de data deve ser definida.
 * Todas as rotas e queries devem usar estas funções para garantir consistência.
 */

/**
 * Cria um filtro de data para queries MongoDB
 * 
 * REGRAS:
 * - dtIni: Início do dia (00:00:00.000)
 * - dtFin: Fim do dia (23:59:59.999) - INCLUI TODO O DIA FINAL
 * 
 * @param dtIni Data inicial (ISO string)
 * @param dtFin Data final (ISO string)
 * @param fieldName Nome do campo de data no MongoDB (padrão: 'DT_DOC')
 * @returns Filtro MongoDB para o campo de data
 */
export function createDateFilter(
  dtIni?: string,
  dtFin?: string,
  fieldName: string = 'DT_DOC'
): Record<string, any> {
  const filter: Record<string, any> = {}
  
  if (!dtIni && !dtFin) {
    return filter
  }
  
  filter[fieldName] = {}
  
  if (dtIni) {
    const startDate = new Date(dtIni)
    startDate.setHours(0, 0, 0, 0) // Início do dia
    filter[fieldName].$gte = startDate
  }
  
  if (dtFin) {
    const endDate = new Date(dtFin)
    endDate.setHours(23, 59, 59, 999) // Fim do dia - INCLUI TODO O DIA FINAL
    filter[fieldName].$lte = endDate
  }
  
  return filter
}

/**
 * Cria um filtro completo incluindo data, CNPJ emitente e destinatário
 * 
 * @param params Parâmetros de filtro
 * @returns Filtro MongoDB completo
 */
export function createDocumentFilter(params: {
  dtIni?: string
  dtFin?: string
  cnpjEmit?: string
  cnpjDest?: string
  fieldName?: string
}): Record<string, any> {
  const { dtIni, dtFin, cnpjEmit, cnpjDest, fieldName = 'DT_DOC' } = params
  
  const filter: Record<string, any> = {}
  
  // Filtro de data
  const dateFilter = createDateFilter(dtIni, dtFin, fieldName)
  Object.assign(filter, dateFilter)
  
  // Filtro de CNPJ
  if (cnpjEmit) {
    filter.CNPJ_EMIT = cnpjEmit
  }
  
  if (cnpjDest) {
    filter.CNPJ_DEST = cnpjDest
  }
  
  return filter
}

/**
 * Valida se as datas estão no formato correto
 * 
 * @param dtIni Data inicial
 * @param dtFin Data final
 * @throws Error se as datas forem inválidas
 */
export function validateDates(dtIni?: string, dtFin?: string): void {
  if (dtIni) {
    const startDate = new Date(dtIni)
    if (isNaN(startDate.getTime())) {
      throw new Error(`Data inicial inválida: ${dtIni}`)
    }
  }
  
  if (dtFin) {
    const endDate = new Date(dtFin)
    if (isNaN(endDate.getTime())) {
      throw new Error(`Data final inválida: ${dtFin}`)
    }
  }
  
  if (dtIni && dtFin) {
    const startDate = new Date(dtIni)
    const endDate = new Date(dtFin)
    
    if (startDate > endDate) {
      throw new Error('Data inicial não pode ser maior que data final')
    }
  }
}

/**
 * Formata datas para log/debug
 * 
 * @param dtIni Data inicial
 * @param dtFin Data final
 * @returns String formatada para log
 */
export function formatDateRangeForLog(dtIni?: string, dtFin?: string): string {
  if (!dtIni && !dtFin) {
    return 'Sem filtro de data'
  }
  
  const parts: string[] = []
  
  if (dtIni) {
    const startDate = new Date(dtIni)
    parts.push(`de ${startDate.toLocaleDateString('pt-BR')} 00:00:00`)
  }
  
  if (dtFin) {
    const endDate = new Date(dtFin)
    parts.push(`até ${endDate.toLocaleDateString('pt-BR')} 23:59:59`)
  }
  
  return parts.join(' ')
}
