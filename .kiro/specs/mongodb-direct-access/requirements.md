# Requirements Document

## Introduction

Este documento especifica os requisitos para migração do sistema de consulta de documentos fiscais de uma arquitetura baseada em REST API para acesso direto ao banco de dados MongoDB. O sistema manterá todas as funcionalidades visuais existentes, incluindo dashboards, grids, filtros, busca natural com IA, exportação Excel e cache inteligente, mas passará a consultar diretamente o MongoDB ao invés de utilizar endpoints REST intermediários.

## Glossary

- **Sistema**: Aplicação web de consulta de documentos fiscais (NF-e, CF-e, CT-e)
- **MongoDB**: Banco de dados NoSQL onde os documentos fiscais estão armazenados
- **Collection**: Coleção MongoDB contendo documentos fiscais (ex: tbl_nfe_100, tbl_cfe_100, tbl_cte_100)
- **Database**: Base de dados MongoDB específica do cliente (ex: C67624577000145)
- **Documento Fiscal**: Registro de NF-e, CF-e ou CT-e armazenado no MongoDB
- **Grid**: Componente de tabela paginada para exibição de documentos
- **Dashboard**: Tela de visualização de indicadores e gráficos agregados
- **Busca Natural**: Funcionalidade de busca usando linguagem natural com IA (Google Gemini)
- **Cache**: Sistema de armazenamento temporário de dados para otimização de performance
- **Paginação**: Mecanismo de divisão de resultados em páginas
- **Filtro**: Critério de busca aplicado às consultas (data, CNPJ, status, etc)
- **Agregação**: Operação de sumarização de dados (SUM, COUNT, GROUP BY)
- **Streaming**: Carregamento progressivo de dados em chunks
- **Range de Datas**: Período de tempo definido por data inicial e final
- **Perfil de Usuário**: Configuração de acesso que determina qual database será consultada
- **Read-Only**: Modo de operação que permite apenas leitura, sem modificações
- **estimatedDocumentCount**: Método MongoDB para contagem rápida de documentos
- **MCP Chrome DevTools**: Ferramenta de monitoramento de console do navegador
- **Brevo**: Serviço de envio de emails (SMTP)
- **Wasabi S3**: Serviço de armazenamento de objetos compatível com S3
- **TypeScript**: Linguagem de programação tipada usada no projeto
- **Vite**: Build tool e dev server do projeto
- **React**: Framework de interface do usuário

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor, quero migrar o sistema de REST API para acesso direto ao MongoDB, para que o sistema tenha melhor performance e menor latência nas consultas.

#### Acceptance Criteria

1. WHEN o sistema inicializa THEN o Sistema SHALL estabelecer conexão direta com MongoDB usando VITE_MONGODB_CONNECTION_STRING
2. WHEN uma consulta é realizada THEN o Sistema SHALL usar o driver nativo do MongoDB ao invés de chamadas HTTP REST
3. WHEN o sistema acessa o MongoDB THEN o Sistema SHALL operar em modo read-only sem realizar operações de DELETE, UPDATE ou INSERT
4. WHEN o sistema consulta dados THEN o Sistema SHALL manter a mesma estrutura de resposta e mapeamento de campos da API REST
5. WHEN ocorre erro de conexão THEN o Sistema SHALL exibir mensagem clara e tentar reconexão automática

### Requirement 2

**User Story:** Como usuário, quero que todas as funcionalidades visuais continuem funcionando, para que minha experiência não seja afetada pela mudança de arquitetura.

#### Acceptance Criteria

1. WHEN acesso o dashboard THEN o Sistema SHALL exibir todos os indicadores e gráficos com dados do MongoDB
2. WHEN acesso as grids THEN o Sistema SHALL exibir tabelas paginadas com documentos fiscais do MongoDB
3. WHEN aplico filtros THEN o Sistema SHALL filtrar dados diretamente no MongoDB usando queries nativas
4. WHEN uso busca natural THEN o Sistema SHALL converter linguagem natural em queries MongoDB usando Google Gemini
5. WHEN exporto para Excel THEN o Sistema SHALL gerar arquivo com dados consultados do MongoDB
6. WHEN navego entre páginas THEN o Sistema SHALL manter paginação funcionando com dados do MongoDB

### Requirement 3

**User Story:** Como administrador, quero configurar variáveis de ambiente para controlar comportamento do sistema, para que eu possa ajustar limites e padrões conforme necessário.

#### Acceptance Criteria

1. WHEN VITE_MONGODB_CONNECTION_STRING está definida THEN o Sistema SHALL usar essa string para conectar ao MongoDB
2. WHEN VITE_DB_DATABASE está definida THEN o Sistema SHALL usar essa database para consultas
3. WHEN VITE_DB_COLLECTION está definida THEN o Sistema SHALL usar essa collection para carregar registros
4. WHEN VITE_MAX_DATE_RANGE_DAYS está definida THEN o Sistema SHALL limitar range máximo de datas ao valor configurado
5. WHEN VITE_DEFAULT_DATE_RANGE_DAYS está definida THEN o Sistema SHALL usar esse valor como range padrão inicial

### Requirement 4

**User Story:** Como desenvolvedor, quero preparar o código para suportar múltiplas databases, para que no futuro o sistema possa carregar a database baseado no perfil do usuário autenticado.

#### Acceptance Criteria

1. WHEN o código de conexão é implementado THEN o Sistema SHALL permitir troca dinâmica de database sem reinicialização
2. WHEN uma função de consulta é criada THEN o Sistema SHALL aceitar database como parâmetro opcional
3. WHEN o sistema é arquitetado THEN o Sistema SHALL separar lógica de conexão da lógica de consulta
4. WHEN documentação é escrita THEN o Sistema SHALL incluir exemplos de como implementar seleção de database por perfil
5. WHEN testes são criados THEN o Sistema SHALL validar funcionamento com múltiplas databases

### Requirement 5

**User Story:** Como desenvolvedor, quero usar estimatedDocumentCount() para contagem de registros, para que a paginação seja mais rápida e eficiente.

#### Acceptance Criteria

1. WHEN o sistema precisa contar documentos THEN o Sistema SHALL usar estimatedDocumentCount() ao invés de count()
2. WHEN a paginação é calculada THEN o Sistema SHALL usar a contagem estimada para determinar total de páginas
3. WHEN filtros são aplicados THEN o Sistema SHALL usar countDocuments() apenas quando necessário para precisão
4. WHEN performance é medida THEN o Sistema SHALL demonstrar melhoria de velocidade em contagens
5. WHEN documentação é criada THEN o Sistema SHALL explicar diferença entre estimatedDocumentCount() e countDocuments()

### Requirement 6

**User Story:** Como desenvolvedor, quero manter o esquema de paginação e nomes de colunas existentes, para que a migração seja transparente para o usuário final.

#### Acceptance Criteria

1. WHEN dados são retornados THEN o Sistema SHALL usar mesmos nomes de campos da API REST
2. WHEN paginação é implementada THEN o Sistema SHALL manter mesmos parâmetros (page, pageSize)
3. WHEN grids são renderizadas THEN o Sistema SHALL usar mesmas definições de colunas
4. WHEN dados são mapeados THEN o Sistema SHALL converter campos MongoDB para formato esperado pela UI
5. WHEN tipos são definidos THEN o Sistema SHALL manter interfaces TypeScript existentes

### Requirement 7

**User Story:** Como desenvolvedor, quero manter documentação atualizada no diretório docs, para que o projeto esteja bem documentado e organizado.

#### Acceptance Criteria

1. WHEN código é alterado THEN o Sistema SHALL atualizar documentação correspondente em docs/
2. WHEN nova funcionalidade é adicionada THEN o Sistema SHALL criar documentação explicativa
3. WHEN arquitetura muda THEN o Sistema SHALL atualizar docs/arquitetura/
4. WHEN bugs são corrigidos THEN o Sistema SHALL documentar correção em docs/correcoes/
5. WHEN testes são criados THEN o Sistema SHALL documentar estratégia em docs/

### Requirement 8

**User Story:** Como desenvolvedor, quero manter projeto limpo sem arquivos desnecessários na raiz, para que o projeto seja organizado e profissional.

#### Acceptance Criteria

1. WHEN arquivos são criados THEN o Sistema SHALL colocar scripts em /scripts, docs em /docs, código em /src
2. WHEN arquivos .ps1 ou .sh são necessários THEN o Sistema SHALL movê-los para /scripts
3. WHEN arquivos .md são criados THEN o Sistema SHALL movê-los para /docs com categorização apropriada
4. WHEN build é executado THEN o Sistema SHALL gerar apenas arquivos necessários em /dist
5. WHEN projeto é versionado THEN o Sistema SHALL incluir apenas arquivos essenciais no git

### Requirement 9

**User Story:** Como desenvolvedor, quero usar MCP chrome-devtools para monitorar console, para que erros sejam identificados e corrigidos rapidamente.

#### Acceptance Criteria

1. WHEN documentação é criada THEN o Sistema SHALL incluir guia de uso do MCP chrome-devtools
2. WHEN erros ocorrem THEN o Sistema SHALL logar informações detalhadas no console
3. WHEN debugging é necessário THEN o Sistema SHALL fornecer stack traces completas
4. WHEN monitoramento é ativo THEN o Sistema SHALL capturar warnings e errors automaticamente
5. WHEN documentação é escrita THEN o Sistema SHALL incluir exemplos de configuração do MCP

### Requirement 10

**User Story:** Como administrador, quero integrar API de envio de emails via Brevo, para que o sistema possa enviar notificações e relatórios.

#### Acceptance Criteria

1. WHEN variáveis BREVO_SMTP_* estão configuradas THEN o Sistema SHALL conectar ao servidor SMTP Brevo
2. WHEN email precisa ser enviado THEN o Sistema SHALL usar credenciais configuradas
3. WHEN email é enviado THEN o Sistema SHALL usar EMAIL_FROM e EMAIL_FROM_NAME configurados
4. WHEN erro ocorre no envio THEN o Sistema SHALL logar erro detalhado e retornar mensagem clara
5. WHEN documentação é criada THEN o Sistema SHALL incluir exemplos de uso da API de email

### Requirement 11

**User Story:** Como administrador, quero integrar storage S3 Wasabi, para que o sistema possa armazenar e recuperar arquivos quando necessário.

#### Acceptance Criteria

1. WHEN credenciais Wasabi estão configuradas THEN o Sistema SHALL conectar ao bucket usando ObjectStorageKey e ObjectStorageSecretKey
2. WHEN arquivo precisa ser armazenado THEN o Sistema SHALL fazer upload para BucketName configurado
3. WHEN arquivo precisa ser recuperado THEN o Sistema SHALL fazer download usando ObjectStorageUrl
4. WHEN operação falha THEN o Sistema SHALL logar erro e retornar mensagem clara
5. WHEN documentação é criada THEN o Sistema SHALL incluir exemplos de uso do Wasabi S3

### Requirement 12

**User Story:** Como desenvolvedor, quero implementar testes automatizados, para que o sistema tenha confiabilidade e qualidade garantidas.

#### Acceptance Criteria

1. WHEN código é escrito THEN o Sistema SHALL incluir testes unitários com Jest
2. WHEN services são criados THEN o Sistema SHALL testar com pg-mem ou Testcontainers
3. WHEN actions são implementadas THEN o Sistema SHALL usar mocks com jest.mock
4. WHEN funcionalidades são completas THEN o Sistema SHALL incluir testes end-to-end com Cypress
5. WHEN testes são executados THEN o Sistema SHALL validar casos esperados, bordas e falhas

### Requirement 13

**User Story:** Como desenvolvedor, quero seguir convenções de código e estilo, para que o projeto seja consistente e manutenível.

#### Acceptance Criteria

1. WHEN código é escrito THEN o Sistema SHALL seguir regras do ESLint e Prettier
2. WHEN tipos são definidos THEN o Sistema SHALL usar TypeScript com tipagem estática
3. WHEN validação é necessária THEN o Sistema SHALL usar Zod para validação de schemas
4. WHEN código é commitado THEN o Sistema SHALL passar por typecheck sem erros
5. WHEN alterações são feitas THEN o Sistema SHALL executar typecheck automaticamente

### Requirement 14

**User Story:** Como desenvolvedor, quero manter docs/SCHEMA.md como fonte única de verdade, para que o schema do banco seja documentado e versionado corretamente.

#### Acceptance Criteria

1. WHEN schema é alterado THEN o Sistema SHALL atualizar docs/SCHEMA.md no mesmo PR
2. WHEN consulta é implementada THEN o Sistema SHALL documentar query em docs/SCHEMA.md
3. WHEN modelo é criado THEN o Sistema SHALL documentar campos, tipos, PK/FK e índices
4. WHEN relações existem THEN o Sistema SHALL documentar cardinalidades e ERD textual
5. WHEN PR é criado THEN o Sistema SHALL validar que docs/SCHEMA.md está atualizado

### Requirement 15

**User Story:** Como desenvolvedor, quero implementar sistema de cache inteligente, para que consultas repetidas sejam otimizadas e performance seja maximizada.

#### Acceptance Criteria

1. WHEN consulta é realizada THEN o Sistema SHALL verificar cache antes de consultar MongoDB
2. WHEN dados estão em cache THEN o Sistema SHALL retornar dados cacheados sem consultar MongoDB
3. WHEN cache expira THEN o Sistema SHALL revalidar dados consultando MongoDB novamente
4. WHEN filtros mudam THEN o Sistema SHALL gerar nova chave de cache baseada nos filtros
5. WHEN cache é invalidado THEN o Sistema SHALL limpar dados obsoletos automaticamente

### Requirement 16

**User Story:** Como desenvolvedor, quero implementar paginação eficiente com cursor, para que consultas de períodos longos sejam otimizadas sem divisão em chunks.

#### Acceptance Criteria

1. WHEN consulta é realizada THEN o Sistema SHALL usar paginação com cursor do MongoDB
2. WHEN página é solicitada THEN o Sistema SHALL retornar apenas registros da página atual
3. WHEN usuário navega entre páginas THEN o Sistema SHALL usar skip e limit de forma otimizada
4. WHEN índices existem THEN o Sistema SHALL aproveitar índices para melhorar performance
5. WHEN consulta é grande THEN o Sistema SHALL manter performance sem dividir em chunks

### Requirement 17

**User Story:** Como usuário, quero que busca natural com IA continue funcionando, para que eu possa consultar documentos usando linguagem natural.

#### Acceptance Criteria

1. WHEN usuário digita busca natural THEN o Sistema SHALL enviar texto para Google Gemini
2. WHEN Gemini responde THEN o Sistema SHALL converter resposta em query MongoDB
3. WHEN query é gerada THEN o Sistema SHALL executar query no MongoDB
4. WHEN resultados são retornados THEN o Sistema SHALL exibir documentos encontrados
5. WHEN erro ocorre THEN o Sistema SHALL exibir mensagem clara e sugerir reformulação

### Requirement 18

**User Story:** Como desenvolvedor, quero implementar tratamento robusto de erros, para que o sistema seja resiliente e forneça feedback claro.

#### Acceptance Criteria

1. WHEN erro de conexão ocorre THEN o Sistema SHALL tentar reconexão automática com backoff exponencial
2. WHEN query falha THEN o Sistema SHALL logar erro completo e retornar mensagem amigável
3. WHEN timeout ocorre THEN o Sistema SHALL cancelar operação e notificar usuário
4. WHEN dados inválidos são recebidos THEN o Sistema SHALL validar e rejeitar com mensagem clara
5. WHEN erro crítico ocorre THEN o Sistema SHALL capturar stack trace e logar para debugging
