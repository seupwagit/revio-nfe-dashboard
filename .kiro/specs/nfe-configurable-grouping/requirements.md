# Documento de Requisitos - Sistema de Agrupamento Configurável de NFe

## Introdução

O sistema de agrupamento configurável de NFe permite agrupar documentos fiscais por chaves configuráveis através de variáveis de ambiente, com tratamento especial para prefixos "NFe" e ordenação personalizada. Esta funcionalidade mantém compatibilidade total com o sistema existente enquanto adiciona flexibilidade de configuração.

## Glossário

- **Sistema**: O Sistema de Agrupamento Configurável de NFe
- **NFe**: Nota Fiscal Eletrônica
- **CHV_NFE**: Chave de acesso da NFe (campo no banco de dados)
- **Prefixo_NFe**: Os três primeiros caracteres "NFe" que podem preceder a chave de acesso
- **Agrupamento**: Processo de consolidar documentos com chaves equivalentes
- **Configuração_Global**: Controle via variáveis de ambiente para habilitar/desabilitar funcionalidades
- **Consulta_MongoDB**: Operação de busca na coleção tbl_nfe_100
- **Backoffice**: Sistema administrativo que controla configurações

## Requisitos

### Requisito 1: Configuração de Agrupamento

**História do Usuário:** Como administrador do sistema, eu quero configurar o agrupamento de NFe através de variáveis de ambiente, para que eu possa controlar como os documentos são consolidados sem alterar código.

#### Critérios de Aceitação

1. QUANDO a variável `TBL_NFE_100_GROUP_BY` estiver definida, O Sistema DEVE agrupar documentos pela chave especificada
2. QUANDO a variável `TBL_NFE_100_GROUP_BY` for `CHV_NFE`, O Sistema DEVE usar este como valor padrão
3. QUANDO a variável `TBL_NFE_100_GROUP_BY` estiver vazia ou undefined, O Sistema DEVE manter comportamento atual sem agrupamento
4. QUANDO múltiplas chaves forem especificadas separadas por vírgula, O Sistema DEVE agrupar por todas as chaves especificadas
5. QUANDO a configuração for alterada, O Sistema DEVE aplicar a nova configuração em consultas subsequentes

### Requisito 2: Tratamento de Prefixo NFe

**História do Usuário:** Como usuário do sistema, eu quero que documentos com chaves idênticas sejam agrupados independentemente do prefixo "NFe", para que eu veja uma visão consolidada correta dos documentos.

#### Critérios de Aceitação

1. QUANDO uma chave CHV_NFE iniciar com "NFe", O Sistema DEVE remover os três primeiros caracteres para comparação
2. QUANDO duas chaves forem idênticas exceto pelo prefixo "NFe", O Sistema DEVE tratá-las como equivalentes
3. QUANDO realizar agrupamento por CHV_NFE, O Sistema DEVE normalizar todas as chaves removendo o prefixo "NFe"
4. QUANDO exibir resultados, O Sistema DEVE preservar o formato original da chave no documento retornado
5. QUANDO a chave não iniciar com "NFe", O Sistema DEVE usar a chave completa para agrupamento

### Requisito 3: Ordenação Configurável

**História do Usuário:** Como usuário do sistema, eu quero configurar a ordenação dos documentos agrupados, para que eu possa visualizar os dados na sequência mais adequada ao meu processo.

#### Critérios de Aceitação

1. QUANDO a variável `TBL_NFE_100_ORDER_BY` estiver definida, O Sistema DEVE ordenar resultados conforme especificado
2. QUANDO a variável `TBL_NFE_100_ORDER_BY` não estiver definida, O Sistema DEVE usar `DT_DOC DESC, PROTOCOLADA DESC` como padrão
3. QUANDO especificar ASC ou DESC para um campo, O Sistema DEVE aplicar a direção de ordenação correta
4. QUANDO múltiplos campos forem especificados, O Sistema DEVE aplicar ordenação em cascata
5. QUANDO aplicar agrupamento, O Sistema DEVE ordenar tanto os grupos quanto os documentos dentro de cada grupo

### Requisito 4: Compatibilidade com Sistema Existente

**História do Usuário:** Como desenvolvedor do sistema, eu quero que a nova funcionalidade não quebre integrações existentes, para que eu possa implementar melhorias sem impactar outros serviços.

#### Critérios de Aceitação

1. QUANDO implementar agrupamento configurável, O Sistema DEVE manter assinaturas de funções existentes inalteradas
2. QUANDO retornar resultados agrupados, O Sistema DEVE manter tipos de retorno compatíveis
3. QUANDO outros serviços chamarem funções existentes, O Sistema DEVE funcionar sem modificações nos clientes
4. QUANDO a funcionalidade estiver desabilitada, O Sistema DEVE comportar-se exatamente como antes
5. QUANDO aplicar apenas em consultas MongoDB, O Sistema DEVE não afetar outras operações de banco

### Requisito 5: Controle Global de Funcionalidade

**História do Usuário:** Como administrador do backoffice, eu quero controlar globalmente se o agrupamento configurável está ativo, para que eu possa habilitar ou desabilitar a funcionalidade conforme necessário.

#### Critérios de Aceitação

1. QUANDO existir um switch global para controle, O Sistema DEVE respeitar esta configuração
2. QUANDO a funcionalidade estiver globalmente desabilitada, O Sistema DEVE ignorar configurações específicas de agrupamento
3. QUANDO a funcionalidade estiver globalmente habilitada, O Sistema DEVE processar configurações de agrupamento normalmente
4. QUANDO o backoffice alterar configurações, O Sistema DEVE aplicar mudanças sem necessidade de reinicialização
5. QUANDO configurações forem por coleção, O Sistema DEVE usar o nome da variável para identificar a coleção específica

### Requisito 6: Interceptação e Processamento de Consultas

**História do Usuário:** Como desenvolvedor do sistema, eu quero que o processamento de agrupamento seja transparente para o código existente, para que eu possa adicionar funcionalidade sem refatorar consultas existentes.

#### Critérios de Aceitação

1. QUANDO uma consulta MongoDB for executada na coleção tbl_nfe_100, O Sistema DEVE interceptar a consulta
2. QUANDO agrupamento estiver configurado, O Sistema DEVE modificar a consulta para incluir pipeline de agregação
3. QUANDO aplicar agrupamento, O Sistema DEVE preservar filtros e condições da consulta original
4. QUANDO retornar resultados, O Sistema DEVE formatar dados no mesmo formato esperado pelo código cliente
5. QUANDO ocorrer erro no processamento, O Sistema DEVE retornar erro apropriado sem quebrar a aplicação

### Requisito 7: Validação e Tratamento de Erros

**História do Usuário:** Como usuário do sistema, eu quero receber mensagens claras quando configurações inválidas forem fornecidas, para que eu possa corrigir problemas rapidamente.

#### Critérios de Aceitação

1. QUANDO uma chave de agrupamento inválida for especificada, O Sistema DEVE retornar erro descritivo
2. QUANDO configuração de ordenação for malformada, O Sistema DEVE usar configuração padrão e registrar aviso
3. QUANDO múltiplas chaves forem especificadas incorretamente, O Sistema DEVE validar cada chave individualmente
4. QUANDO ocorrer erro durante agrupamento, O Sistema DEVE registrar erro detalhado nos logs
5. QUANDO configurações conflitantes forem detectadas, O Sistema DEVE usar configuração mais específica e avisar sobre conflito

### Requisito 8: Logging e Monitoramento

**História do Usuário:** Como administrador do sistema, eu quero logs detalhados sobre operações de agrupamento, para que eu possa monitorar performance e diagnosticar problemas.

#### Critérios de Aceitação

1. QUANDO agrupamento for aplicado, O Sistema DEVE registrar configurações utilizadas
2. QUANDO consultas forem interceptadas, O Sistema DEVE registrar tempo de processamento
3. QUANDO prefixos "NFe" forem removidos, O Sistema DEVE registrar quantidade de chaves normalizadas
4. QUANDO erros ocorrerem, O Sistema DEVE registrar contexto completo do erro
5. QUANDO configurações forem alteradas, O Sistema DEVE registrar mudanças com timestamp e usuário responsável

### Requisito 9: Performance e Otimização

**História do Usuário:** Como usuário do sistema, eu quero que o agrupamento configurável não impacte significativamente a performance das consultas, para que eu possa usar a funcionalidade sem degradação do sistema.

#### Critérios de Aceitação

1. QUANDO agrupamento estiver desabilitado, O Sistema DEVE ter performance idêntica ao comportamento original
2. QUANDO agrupamento estiver habilitado, O Sistema DEVE adicionar no máximo 20% de overhead às consultas
3. QUANDO processar grandes volumes de dados, O Sistema DEVE usar índices apropriados para otimização
4. QUANDO aplicar normalização de prefixos, O Sistema DEVE usar operações eficientes de string
5. QUANDO cache estiver disponível, O Sistema DEVE cachear resultados de configuração para evitar re-processamento

### Requisito 10: Configuração Flexível por Coleção

**História do Usuário:** Como administrador do sistema, eu quero configurar agrupamento específico para diferentes coleções, para que eu possa ter controle granular sobre o comportamento de cada conjunto de dados.

#### Critérios de Aceitação

1. QUANDO múltiplas coleções existirem, O Sistema DEVE permitir configuração independente para cada uma
2. QUANDO uma coleção não tiver configuração específica, O Sistema DEVE usar configuração padrão global
3. QUANDO configurações específicas e globais existirem, O Sistema DEVE priorizar configuração específica da coleção
4. QUANDO nome da variável incluir nome da coleção, O Sistema DEVE aplicar configuração apenas àquela coleção
5. QUANDO configuração for alterada para uma coleção, O Sistema DEVE não afetar outras coleções