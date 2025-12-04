# Requirements Document

## Introduction

Este documento especifica os requisitos para um sistema de configuração de provedores LLM (Large Language Models) para o serviço de busca natural. O sistema permitirá configurar múltiplos provedores (Google Gemini, OpenAI, Anthropic, etc.), definir limites de uso, controlar custos e gerenciar permissões de acesso. Todas as configurações serão armazenadas em SQL Server e gerenciadas através de um backoffice web.

## Glossary

- **Sistema**: Sistema de configuração de provedores LLM
- **LLM**: Large Language Model (Modelo de Linguagem Grande)
- **Provedor**: Serviço de LLM (Google Gemini, OpenAI, Anthropic, etc.)
- **Backoffice**: Interface administrativa web para configuração
- **SQL Server**: Banco de dados relacional para armazenar configurações
- **Prisma**: ORM para acesso ao SQL Server
- **API Key**: Chave de autenticação para acessar provedor LLM
- **Rate Limit**: Limite de requisições por período de tempo
- **Token Limit**: Limite de tokens consumidos por período
- **Cost Limit**: Limite de custo monetário por período
- **Tenant**: Cliente/empresa que usa o sistema
- **Usuário**: Pessoa que usa o sistema de busca natural
- **Administrador**: Pessoa com permissão para configurar provedores
- **Quota**: Limite de uso atribuído a um tenant ou usuário
- **Audit Log**: Registro de uso e ações no sistema
- **Fallback**: Provedor alternativo usado quando o principal falha
- **Priority**: Ordem de preferência entre provedores
- **Endpoint**: URL do serviço LLM
- **Model**: Modelo específico do provedor (ex: gpt-4, gemini-pro)
- **Temperature**: Parâmetro de criatividade do LLM (0.0 a 1.0)
- **Max Tokens**: Número máximo de tokens na resposta

## Requirements

### Requirement 1

**User Story:** Como administrador, quero cadastrar múltiplos provedores LLM, para que o sistema possa usar diferentes serviços conforme necessidade.

#### Acceptance Criteria

1. WHEN o administrador acessa a tela de provedores THEN o Sistema SHALL exibir lista de provedores cadastrados
2. WHEN o administrador clica em adicionar provedor THEN o Sistema SHALL exibir formulário com campos obrigatórios (nome, tipo, endpoint, apiKey, modelo)
3. WHEN o administrador salva um provedor THEN o Sistema SHALL validar campos e armazenar no SQL Server
4. WHEN o administrador edita um provedor THEN o Sistema SHALL permitir alterar configurações exceto o ID
5. WHEN o administrador desativa um provedor THEN o Sistema SHALL marcar como inativo sem deletar registro

### Requirement 2

**User Story:** Como administrador, quero configurar limites de uso por provedor, para que o sistema controle custos e evite uso excessivo.

#### Acceptance Criteria

1. WHEN o administrador configura limites THEN o Sistema SHALL permitir definir limite de requisições por minuto
2. WHEN o administrador configura limites THEN o Sistema SHALL permitir definir limite de tokens por dia
3. WHEN o administrador configura limites THEN o Sistema SHALL permitir definir limite de custo por mês
4. WHEN um limite é atingido THEN o Sistema SHALL bloquear novas requisições ao provedor
5. WHEN um limite é atingido THEN o Sistema SHALL registrar evento no audit log

### Requirement 3

**User Story:** Como administrador, quero configurar quotas por tenant, para que cada cliente tenha limites individuais de uso.

#### Acceptance Criteria

1. WHEN o administrador acessa configuração de tenant THEN o Sistema SHALL exibir quotas atuais
2. WHEN o administrador define quota THEN o Sistema SHALL permitir configurar limite de requisições por dia
3. WHEN o administrador define quota THEN o Sistema SHALL permitir configurar limite de tokens por mês
4. WHEN quota de tenant é excedida THEN o Sistema SHALL bloquear requisições do tenant
5. WHEN quota é renovada THEN o Sistema SHALL resetar contadores no período configurado

### Requirement 4

**User Story:** Como administrador, quero configurar prioridade e fallback entre provedores, para que o sistema tenha alta disponibilidade.

#### Acceptance Criteria

1. WHEN o administrador configura prioridades THEN o Sistema SHALL permitir ordenar provedores por preferência
2. WHEN provedor principal falha THEN o Sistema SHALL tentar provedor seguinte na ordem de prioridade
3. WHEN todos provedores falham THEN o Sistema SHALL retornar erro claro ao usuário
4. WHEN provedor se recupera THEN o Sistema SHALL voltar a usá-lo conforme prioridade
5. WHEN fallback é usado THEN o Sistema SHALL registrar evento no audit log

### Requirement 5

**User Story:** Como administrador, quero visualizar métricas de uso, para que eu possa monitorar consumo e custos.

#### Acceptance Criteria

1. WHEN o administrador acessa dashboard THEN o Sistema SHALL exibir total de requisições por provedor
2. WHEN o administrador acessa dashboard THEN o Sistema SHALL exibir total de tokens consumidos por período
3. WHEN o administrador acessa dashboard THEN o Sistema SHALL exibir custo estimado por provedor
4. WHEN o administrador filtra por período THEN o Sistema SHALL atualizar métricas conforme filtro
5. WHEN o administrador filtra por tenant THEN o Sistema SHALL exibir métricas específicas do tenant

### Requirement 6

**User Story:** Como administrador, quero visualizar histórico de uso, para que eu possa auditar e identificar padrões.

#### Acceptance Criteria

1. WHEN o administrador acessa audit log THEN o Sistema SHALL exibir lista de requisições com timestamp
2. WHEN o administrador visualiza requisição THEN o Sistema SHALL exibir provedor usado, tenant, usuário, query, tokens
3. WHEN o administrador filtra log THEN o Sistema SHALL permitir filtrar por data, tenant, provedor, usuário
4. WHEN o administrador exporta log THEN o Sistema SHALL gerar arquivo CSV com dados filtrados
5. WHEN requisição falha THEN o Sistema SHALL registrar erro detalhado no log

### Requirement 7

**User Story:** Como desenvolvedor, quero que o serviço de busca natural use configurações do SQL Server, para que não dependa de variáveis de ambiente.

#### Acceptance Criteria

1. WHEN serviço inicia THEN o Sistema SHALL carregar configurações do SQL Server
2. WHEN serviço recebe requisição THEN o Sistema SHALL selecionar provedor conforme prioridade e disponibilidade
3. WHEN serviço usa provedor THEN o Sistema SHALL incrementar contadores de uso
4. WHEN serviço detecta limite excedido THEN o Sistema SHALL tentar próximo provedor disponível
5. WHEN serviço completa requisição THEN o Sistema SHALL registrar uso no audit log

### Requirement 8

**User Story:** Como administrador, quero configurar parâmetros específicos por provedor, para que cada LLM seja otimizado conforme suas características.

#### Acceptance Criteria

1. WHEN o administrador configura provedor THEN o Sistema SHALL permitir definir temperature (0.0 a 1.0)
2. WHEN o administrador configura provedor THEN o Sistema SHALL permitir definir maxTokens para resposta
3. WHEN o administrador configura provedor THEN o Sistema SHALL permitir definir timeout em segundos
4. WHEN o administrador configura provedor THEN o Sistema SHALL permitir definir retry attempts
5. WHEN o administrador configura provedor THEN o Sistema SHALL validar valores dentro de ranges permitidos

### Requirement 9

**User Story:** Como administrador, quero testar configuração de provedor, para que eu possa validar antes de ativar em produção.

#### Acceptance Criteria

1. WHEN o administrador clica em testar provedor THEN o Sistema SHALL enviar query de teste ao provedor
2. WHEN teste é bem-sucedido THEN o Sistema SHALL exibir resposta e tempo de execução
3. WHEN teste falha THEN o Sistema SHALL exibir mensagem de erro detalhada
4. WHEN teste é executado THEN o Sistema SHALL validar API key e conectividade
5. WHEN teste é executado THEN o Sistema SHALL NÃO incrementar contadores de quota

### Requirement 10

**User Story:** Como administrador, quero configurar cache de respostas, para que queries repetidas não consumam quota desnecessariamente.

#### Acceptance Criteria

1. WHEN o administrador configura cache THEN o Sistema SHALL permitir definir duração em minutos
2. WHEN query é repetida dentro do período THEN o Sistema SHALL retornar resposta do cache
3. WHEN resposta vem do cache THEN o Sistema SHALL NÃO incrementar contadores de uso
4. WHEN cache expira THEN o Sistema SHALL fazer nova requisição ao provedor
5. WHEN cache é usado THEN o Sistema SHALL registrar hit no audit log

### Requirement 11

**User Story:** Como administrador, quero configurar notificações de limite, para que eu seja alertado antes de exceder quotas.

#### Acceptance Criteria

1. WHEN o administrador configura notificações THEN o Sistema SHALL permitir definir threshold percentual (ex: 80%)
2. WHEN uso atinge threshold THEN o Sistema SHALL enviar email ao administrador
3. WHEN uso atinge 100% THEN o Sistema SHALL enviar email de alerta crítico
4. WHEN notificação é enviada THEN o Sistema SHALL registrar no audit log
5. WHEN administrador desativa notificações THEN o Sistema SHALL NÃO enviar emails

### Requirement 12

**User Story:** Como desenvolvedor, quero que o sistema suporte múltiplos tipos de provedor, para que seja extensível a novos LLMs.

#### Acceptance Criteria

1. WHEN novo tipo de provedor é adicionado THEN o Sistema SHALL permitir cadastrar sem alterar schema
2. WHEN provedor tem API diferente THEN o Sistema SHALL usar adapter pattern para normalizar interface
3. WHEN provedor requer autenticação específica THEN o Sistema SHALL suportar múltiplos métodos (API Key, OAuth, Bearer)
4. WHEN provedor tem formato de resposta diferente THEN o Sistema SHALL mapear para formato padrão
5. WHEN provedor é usado THEN o Sistema SHALL logar tipo e versão no audit log

### Requirement 13

**User Story:** Como administrador, quero importar/exportar configurações, para que eu possa migrar entre ambientes facilmente.

#### Acceptance Criteria

1. WHEN o administrador clica em exportar THEN o Sistema SHALL gerar arquivo JSON com todas configurações
2. WHEN o administrador importa arquivo THEN o Sistema SHALL validar schema antes de aplicar
3. WHEN importação é bem-sucedida THEN o Sistema SHALL atualizar configurações no SQL Server
4. WHEN importação falha THEN o Sistema SHALL exibir erros de validação sem alterar dados
5. WHEN exportação inclui API keys THEN o Sistema SHALL mascarar valores sensíveis

### Requirement 14

**User Story:** Como sistema, quero calcular custo estimado por requisição, para que administrador possa monitorar gastos.

#### Acceptance Criteria

1. WHEN requisição é completada THEN o Sistema SHALL calcular custo baseado em tokens e tabela de preços
2. WHEN administrador configura provedor THEN o Sistema SHALL permitir definir custo por 1000 tokens
3. WHEN dashboard exibe custos THEN o Sistema SHALL somar custos de todas requisições do período
4. WHEN custo mensal excede limite THEN o Sistema SHALL bloquear provedor e notificar administrador
5. WHEN tabela de preços muda THEN o Sistema SHALL permitir atualizar sem afetar histórico

### Requirement 15

**User Story:** Como administrador, quero configurar permissões de acesso, para que apenas usuários autorizados usem busca natural.

#### Acceptance Criteria

1. WHEN o administrador configura permissões THEN o Sistema SHALL permitir habilitar/desabilitar por tenant
2. WHEN o administrador configura permissões THEN o Sistema SHALL permitir habilitar/desabilitar por usuário
3. WHEN usuário sem permissão tenta usar THEN o Sistema SHALL retornar erro 403 Forbidden
4. WHEN permissão é alterada THEN o Sistema SHALL aplicar imediatamente sem reiniciar serviço
5. WHEN acesso é negado THEN o Sistema SHALL registrar tentativa no audit log

### Requirement 16

**User Story:** Como desenvolvedor, quero que configurações sejam cacheadas em memória, para que não haja consulta ao SQL Server a cada requisição.

#### Acceptance Criteria

1. WHEN serviço inicia THEN o Sistema SHALL carregar configurações para cache em memória
2. WHEN configuração é alterada no backoffice THEN o Sistema SHALL invalidar cache automaticamente
3. WHEN cache é invalidado THEN o Sistema SHALL recarregar configurações do SQL Server
4. WHEN serviço usa configuração THEN o Sistema SHALL ler do cache sem consultar banco
5. WHEN cache expira THEN o Sistema SHALL revalidar com SQL Server

### Requirement 17

**User Story:** Como administrador, quero visualizar status de saúde dos provedores, para que eu possa identificar problemas rapidamente.

#### Acceptance Criteria

1. WHEN o administrador acessa dashboard THEN o Sistema SHALL exibir status de cada provedor (online/offline/degraded)
2. WHEN provedor falha consecutivamente THEN o Sistema SHALL marcar como offline
3. WHEN provedor volta a funcionar THEN o Sistema SHALL marcar como online
4. WHEN taxa de erro é alta THEN o Sistema SHALL marcar como degraded
5. WHEN status muda THEN o Sistema SHALL registrar evento no audit log

### Requirement 18

**User Story:** Como administrador, quero configurar regras de roteamento, para que queries específicas usem provedores específicos.

#### Acceptance Criteria

1. WHEN o administrador cria regra THEN o Sistema SHALL permitir definir padrão de query (regex)
2. WHEN o administrador cria regra THEN o Sistema SHALL permitir definir provedor preferencial
3. WHEN query corresponde a regra THEN o Sistema SHALL usar provedor especificado
4. WHEN múltiplas regras correspondem THEN o Sistema SHALL usar regra com maior prioridade
5. WHEN nenhuma regra corresponde THEN o Sistema SHALL usar provedor padrão
