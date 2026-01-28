# Sistema de Agrupamento Configurável de NFe - Guia de Configuração

## Visão Geral

O Sistema de Agrupamento Configurável de NFe permite agrupar documentos fiscais por chaves configuráveis através de variáveis de ambiente, com tratamento especial para prefixos "NFe" e ordenação personalizada. Esta funcionalidade mantém compatibilidade total com o sistema existente.

## Configuração Básica

### Controle Global

```bash
# Habilita/desabilita o sistema globalmente
NFE_GROUPING_ENABLED=true
```

### Configuração Padrão

```bash
# Campos para agrupamento (padrão quando não há configuração específica)
NFE_GROUP_BY=CHV_NFE

# Ordenação padrão
NFE_ORDER_BY=DT_DOC DESC, PROTOCOLADA DESC
```

## Configuração por Coleção

### Coleção tbl_nfe_100 (Notas Fiscais Eletrônicas)

```bash
# Habilita agrupamento para NFe
TBL_NFE_100_GROUPING_ENABLED=true

# Campos de agrupamento (separados por vírgula)
TBL_NFE_100_GROUP_BY=CHV_NFE

# Ordenação específica
TBL_NFE_100_ORDER_BY=DT_DOC DESC, PROTOCOLADA DESC
```

### Coleção tbl_cte_100 (Conhecimentos de Transporte)

```bash
# Desabilita agrupamento para CTe (padrão)
TBL_CTE_100_GROUPING_ENABLED=false

# Configuração de agrupamento (se habilitado)
TBL_CTE_100_GROUP_BY=CHV_NFE
TBL_CTE_100_ORDER_BY=DT_DOC DESC
```

### Coleção tbl_cfe_100 (Cupons Fiscais Eletrônicos)

```bash
# Desabilita agrupamento para CFe (padrão)
TBL_CFE_100_GROUPING_ENABLED=false

# Configuração de agrupamento (se habilitado)
TBL_CFE_100_GROUP_BY=CHV_NFE
TBL_CFE_100_ORDER_BY=DT_DOC DESC
```

## Campos de Agrupamento Disponíveis

### Campos Suportados

- **CHV_NFE**: Chave de acesso do documento (com normalização de prefixo "NFe")
- **CNPJ_EMIT**: CNPJ do emitente
- **DT_DOC**: Data do documento
- **PROTOCOLADA**: Status de protocolação

### Múltiplos Campos

```bash
# Agrupar por múltiplos campos
TBL_NFE_100_GROUP_BY=CHV_NFE,CNPJ_EMIT

# Agrupar por chave e data
TBL_NFE_100_GROUP_BY=CHV_NFE,DT_DOC
```

## Configuração de Ordenação

### Formato da Ordenação

```bash
# Formato: CAMPO DIREÇÃO, CAMPO2 DIREÇÃO
TBL_NFE_100_ORDER_BY=DT_DOC DESC, PROTOCOLADA ASC

# Ordenação simples
TBL_NFE_100_ORDER_BY=DT_DOC DESC

# Múltiplos campos
TBL_NFE_100_ORDER_BY=DT_DOC DESC, CHV_NFE ASC, PROTOCOLADA DESC
```

### Direções Disponíveis

- **ASC**: Ordem crescente
- **DESC**: Ordem decrescente

## Configurações de Performance

### Cache de Configurações

```bash
# TTL do cache em segundos (padrão: 300 = 5 minutos)
NFE_GROUPING_CACHE_TTL=300
```

### Timeouts

```bash
# Timeout para agregações em milissegundos (padrão: 30000 = 30s)
NFE_GROUPING_AGGREGATION_TIMEOUT_MS=30000

# Timeout para consultas normais em milissegundos (padrão: 15000 = 15s)
NFE_GROUPING_QUERY_TIMEOUT_MS=15000
```

### Limites

```bash
# Máximo de grupos retornados (padrão: 1000)
NFE_GROUPING_MAX_GROUPS=1000
```

## Hierarquia de Precedência

O sistema segue esta ordem de precedência para configurações:

1. **Configuração específica da coleção** (ex: `TBL_NFE_100_GROUP_BY`)
2. **Configuração global** (ex: `NFE_GROUP_BY`)
3. **Valores padrão do sistema**

### Exemplo de Precedência

```bash
# Configuração global
NFE_GROUP_BY=CNPJ_EMIT
NFE_GROUPING_ENABLED=true

# Configuração específica (tem precedência)
TBL_NFE_100_GROUP_BY=CHV_NFE
TBL_NFE_100_GROUPING_ENABLED=true

# Resultado: tbl_nfe_100 usará CHV_NFE, outras coleções usarão CNPJ_EMIT
```

## Tratamento de Prefixos NFe

### Normalização Automática

O sistema automaticamente normaliza chaves CHV_NFE:

- **Com prefixo**: `NFe35200714200166000187550010000000001123456789`
- **Sem prefixo**: `35200714200166000187550010000000001123456789`
- **Resultado**: Ambas são tratadas como equivalentes no agrupamento

### Preservação do Formato Original

- O formato original é preservado nos resultados
- A normalização ocorre apenas para fins de agrupamento
- Documentos com chaves idênticas (exceto prefixo) são agrupados juntos

## Configurações por Ambiente

### Desenvolvimento (.env.example)

```bash
# Configuração para desenvolvimento local
NFE_GROUPING_ENABLED=true
TBL_NFE_100_GROUPING_ENABLED=true
TBL_NFE_100_GROUP_BY=CHV_NFE
NFE_GROUPING_CACHE_TTL=300
NFE_GROUPING_AGGREGATION_TIMEOUT_MS=30000
```

### Produção (.env.production.example)

```bash
# Configuração otimizada para produção
NFE_GROUPING_ENABLED=true
TBL_NFE_100_GROUPING_ENABLED=true
TBL_NFE_100_GROUP_BY=CHV_NFE
NFE_GROUPING_CACHE_TTL=600
NFE_GROUPING_AGGREGATION_TIMEOUT_MS=45000
NFE_GROUPING_MAX_GROUPS=2000
```

## Exemplos de Uso

### Cenário 1: Agrupamento Básico por Chave

```bash
# Configuração
TBL_NFE_100_GROUPING_ENABLED=true
TBL_NFE_100_GROUP_BY=CHV_NFE

# Resultado: Documentos com mesma chave (independente do prefixo "NFe") são agrupados
```

### Cenário 2: Agrupamento por Emitente

```bash
# Configuração
TBL_NFE_100_GROUPING_ENABLED=true
TBL_NFE_100_GROUP_BY=CNPJ_EMIT

# Resultado: Documentos do mesmo emitente são agrupados
```

### Cenário 3: Agrupamento Múltiplo

```bash
# Configuração
TBL_NFE_100_GROUPING_ENABLED=true
TBL_NFE_100_GROUP_BY=CNPJ_EMIT,DT_DOC

# Resultado: Documentos do mesmo emitente na mesma data são agrupados
```

### Cenário 4: Desabilitar Agrupamento

```bash
# Configuração
TBL_NFE_100_GROUPING_ENABLED=false

# Resultado: Comportamento original sem agrupamento
```

## Monitoramento e Logs

### Logs Estruturados

O sistema registra logs detalhados com prefixos específicos:

- `[NFE-GROUPING-CONFIG]`: Configurações carregadas
- `[NFE-GROUPING-INTERCEPTION]`: Interceptação de consultas
- `[NFE-GROUPING-ERROR]`: Erros e fallbacks

### Métricas de Performance

Os logs incluem métricas de performance:

- Tempo de processamento
- Número de grupos gerados
- Total de documentos processados
- Uso de cache
- Aplicação de normalização

## Solução de Problemas

### Problema: Agrupamento não está funcionando

**Verificações:**

1. Confirmar que `NFE_GROUPING_ENABLED=true`
2. Verificar se a configuração específica da coleção está habilitada
3. Confirmar que os campos de agrupamento são válidos
4. Verificar logs para mensagens de erro

### Problema: Performance lenta

**Soluções:**

1. Aumentar `NFE_GROUPING_CACHE_TTL` para reduzir recarregamento de configurações
2. Ajustar `NFE_GROUPING_AGGREGATION_TIMEOUT_MS` se necessário
3. Limitar `NFE_GROUPING_MAX_GROUPS` para datasets grandes
4. Verificar índices no MongoDB para campos de agrupamento

### Problema: Configurações não são aplicadas

**Verificações:**

1. Confirmar que as variáveis de ambiente estão definidas corretamente
2. Verificar a hierarquia de precedência
3. Forçar refresh das configurações (reiniciar aplicação)
4. Verificar logs de configuração para mensagens de validação

## Compatibilidade

### Código Existente

- **100% compatível** com código cliente existente
- **Assinaturas de métodos inalteradas**
- **Tipos de retorno mantidos**
- **Fallback automático** em caso de erro

### Coleções Suportadas

- `tbl_nfe_100`: Notas Fiscais Eletrônicas (suporte completo)
- `tbl_cte_100`: Conhecimentos de Transporte (configurável)
- `tbl_cfe_100`: Cupons Fiscais Eletrônicos (configurável)

### Versões

- **MongoDB**: >= 4.4 (para suporte completo a agregações)
- **Node.js**: >= 18.0 (para suporte a ES modules)
- **TypeScript**: >= 4.5 (para tipos avançados)

## Migração

### De Sistema Sem Agrupamento

1. Definir `NFE_GROUPING_ENABLED=false` inicialmente
2. Configurar variáveis específicas por coleção
3. Testar em ambiente de desenvolvimento
4. Habilitar gradualmente por coleção
5. Monitorar performance e logs

### Rollback

Para desabilitar completamente:

```bash
# Desabilitar globalmente
NFE_GROUPING_ENABLED=false

# Ou desabilitar por coleção
TBL_NFE_100_GROUPING_ENABLED=false
TBL_CTE_100_GROUPING_ENABLED=false
TBL_CFE_100_GROUPING_ENABLED=false
```

## Suporte

Para suporte técnico ou dúvidas sobre configuração:

1. Verificar logs do sistema com prefixos `[NFE-GROUPING-*]`
2. Consultar esta documentação
3. Verificar exemplos de configuração nos arquivos `.env.example`
4. Testar configurações em ambiente de desenvolvimento primeiro