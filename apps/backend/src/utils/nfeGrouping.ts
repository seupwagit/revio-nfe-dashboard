/**
 * NFE Grouping Utilities
 * 
 * Utilitários para agrupamento de notas fiscais por CHV_NFE
 * Permite habilitar/desabilitar agrupamento via variável de ambiente
 */

/**
 * Interface para configuração de agrupamento
 */
export interface GroupingConfig {
  enabled: boolean
  keys: string[]
}

/**
 * Interface para filtro de agrupamento MongoDB
 */
export interface GroupingFilter {
  $or?: Array<Record<string, any>>
  [key: string]: any
}

/**
 * Obtém a configuração de agrupamento das variáveis de ambiente
 */
export function getGroupingConfig(): GroupingConfig {
  const groupingKeys = process.env.VITE_NFE_GROUPING_KEYS || ''
  
  if (!groupingKeys.trim()) {
    return {
      enabled: false,
      keys: []
    }
  }

  const keys = groupingKeys
    .split(',')
    .map(key => key.trim())
    .filter(key => key.length > 0)

  return {
    enabled: keys.length > 0,
    keys
  }
}

/**
 * Normaliza uma chave CHV_NFE removendo o prefixo "NFe" se presente
 */
export function normalizeChvNfe(chave: string): string {
  if (!chave || typeof chave !== 'string') {
    return chave
  }

  // Remove prefixo "NFe" se presente (primeiros 3 caracteres)
  if (chave.length > 3 && chave.substring(0, 3).toLowerCase() === 'nfe') {
    return chave.substring(3)
  }

  return chave
}

/**
 * Cria filtro MongoDB para agrupamento por CHV_NFE
 * 
 * @param originalFilter Filtro original da consulta
 * @param groupingConfig Configuração de agrupamento
 * @returns Filtro modificado para agrupamento ou filtro original se desabilitado
 */
export function createGroupingFilter(
  originalFilter: Record<string, any>,
  groupingConfig: GroupingConfig
): Record<string, any> {
  // Se agrupamento está desabilitado, retorna filtro original
  if (!groupingConfig.enabled || groupingConfig.keys.length === 0) {
    return originalFilter
  }

  // Se não há filtros que envolvem as chaves de agrupamento, retorna filtro original
  const hasGroupingKeyFilters = groupingConfig.keys.some(key => 
    originalFilter[key] !== undefined
  )

  if (!hasGroupingKeyFilters) {
    return originalFilter
  }

  // Criar novo filtro com agrupamento
  const modifiedFilter = { ...originalFilter }

  // Para cada chave de agrupamento configurada
  groupingConfig.keys.forEach(key => {
    if (originalFilter[key] !== undefined) {
      const originalValue = originalFilter[key]
      
      // Se é uma string simples, criar filtro $or para incluir versões com e sem prefixo
      if (typeof originalValue === 'string') {
        const normalizedValue = normalizeChvNfe(originalValue)
        
        modifiedFilter[key] = {
          $in: [
            originalValue,           // Valor original
            normalizedValue,         // Valor sem prefixo
            `NFe${normalizedValue}`, // Valor com prefixo NFe
            `nfe${normalizedValue}`, // Valor com prefixo nfe (lowercase)
            `NFE${normalizedValue}`  // Valor com prefixo NFE (uppercase)
          ]
        }
      }
      // Se já é um objeto de consulta MongoDB, mantém como está
      else if (typeof originalValue === 'object' && originalValue !== null) {
        // Mantém filtros complexos como estão
        modifiedFilter[key] = originalValue
      }
    }
  })

  return modifiedFilter
}

/**
 * Cria pipeline de agregação MongoDB para agrupamento por CHV_NFE
 * 
 * @param matchStage Stage $match original
 * @param groupingConfig Configuração de agrupamento
 * @returns Pipeline modificado para agrupamento
 */
export function createGroupingPipeline(
  matchStage: Record<string, any>,
  groupingConfig: GroupingConfig
): Array<Record<string, any>> {
  // Se agrupamento está desabilitado, retorna pipeline simples
  if (!groupingConfig.enabled || groupingConfig.keys.length === 0) {
    return [{ $match: matchStage }]
  }

  // Aplicar filtro de agrupamento no match stage
  const modifiedMatchStage = createGroupingFilter(matchStage, groupingConfig)

  // Pipeline com agrupamento
  const pipeline: Array<Record<string, any>> = [
    { $match: modifiedMatchStage }
  ]

  // Adicionar stage de agrupamento se necessário
  if (groupingConfig.keys.length > 0) {
    // Criar campo de agrupamento normalizado
    const addFieldsStage: Record<string, any> = {
      $addFields: {}
    }

    groupingConfig.keys.forEach(key => {
      addFieldsStage.$addFields[`${key}_normalized`] = {
        $cond: {
          if: { $and: [
            { $ne: [`$${key}`, null] },
            { $ne: [`$${key}`, ""] },
            { $eq: [{ $type: `$${key}` }, "string"] }
          ]},
          then: {
            $cond: {
              if: { $eq: [{ $substr: [`$${key}`, 0, 3] }, "NFe"] },
              then: { $substr: [`$${key}`, 3, -1] },
              else: `$${key}`
            }
          },
          else: `$${key}`
        }
      }
    })

    pipeline.push(addFieldsStage)

    // Agrupar por chave normalizada e manter apenas o primeiro documento de cada grupo
    const groupStage: Record<string, any> = {
      $group: {
        _id: {}
      }
    }

    // Adicionar chaves de agrupamento
    groupingConfig.keys.forEach(key => {
      groupStage.$group._id[`${key}_normalized`] = `$${key}_normalized`
    })

    // Manter o primeiro documento de cada grupo
    groupStage.$group.doc = { $first: "$$ROOT" }

    pipeline.push(groupStage)

    // Substituir o documento raiz
    pipeline.push({ $replaceRoot: { newRoot: "$doc" } })
  }

  return pipeline
}

/**
 * Log da configuração de agrupamento para debug
 */
export function logGroupingConfig(): void {
  const config = getGroupingConfig()
  
  if (config.enabled) {
    console.log('[NFE_GROUPING] ✅ Agrupamento habilitado para chaves:', config.keys.join(', '))
  } else {
    console.log('[NFE_GROUPING] ❌ Agrupamento desabilitado')
  }
}

/**
 * Valida se uma chave de agrupamento é válida
 */
export function isValidGroupingKey(key: string): boolean {
  const validKeys = ['CHV_NFE', 'CHV_CTE', 'CHV_CFE', 'CHV']
  return validKeys.includes(key)
}

/**
 * Obtém configuração validada (apenas chaves válidas)
 */
export function getValidatedGroupingConfig(): GroupingConfig {
  const config = getGroupingConfig()
  
  if (!config.enabled) {
    return config
  }

  const validKeys = config.keys.filter(isValidGroupingKey)
  
  if (validKeys.length === 0) {
    console.warn('[NFE_GROUPING] ⚠️ Nenhuma chave válida encontrada, desabilitando agrupamento')
    return {
      enabled: false,
      keys: []
    }
  }

  if (validKeys.length !== config.keys.length) {
    const invalidKeys = config.keys.filter(key => !isValidGroupingKey(key))
    console.warn('[NFE_GROUPING] ⚠️ Chaves inválidas ignoradas:', invalidKeys.join(', '))
  }

  return {
    enabled: true,
    keys: validKeys
  }
}

/**
 * Verifica se o agrupamento NFE está habilitado
 */
export function isNfeGroupingEnabled(): boolean {
  const config = getValidatedGroupingConfig()
  return config.enabled
}

/**
 * Obtém as chaves de agrupamento NFE configuradas
 */
export function getNfeGroupingKeys(): string[] {
  const config = getValidatedGroupingConfig()
  return config.keys
}