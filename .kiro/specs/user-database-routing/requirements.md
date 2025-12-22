# Documento de Requisitos

## Introdução

Este documento especifica os requisitos para garantir que todos os serviços da aplicação (exceto os de autenticação) utilizem automaticamente as bases de dados específicas do usuário logado. O sistema deve implementar roteamento transparente de conexões de banco de dados baseado no contexto de autenticação, garantindo isolamento completo de dados entre diferentes clientes/usuários.

## Glossário

- **Serviço de Autenticação**: Componentes responsáveis por login, logout, validação de tokens e gerenciamento de sessão que operam na base global
- **Serviço de Aplicação**: Qualquer serviço que não seja de autenticação e que precisa acessar dados específicos do cliente
- **Base Global**: A base de dados spedrevio contendo dados de autenticação e configuração do sistema
- **Base do Cliente**: Base de dados específica de um cliente, identificada pela coluna BANCODEDADOS do usuário
- **Roteamento Automático**: Processo de direcionamento transparente de consultas para a base correta baseado no usuário autenticado
- **Contexto de Usuário**: Informações do usuário autenticado disponíveis durante uma requisição HTTP
- **Middleware de Roteamento**: Componente que intercepta requisições e configura conexões de banco apropriadas
- **Isolamento de Dados**: Garantia de que usuários só acessem dados de suas respectivas organizações
- **Conexão Dinâmica**: Conexão de banco de dados criada em tempo de execução baseada no usuário autenticado
- **Fallback Global**: Comportamento de usar a base global quando não há usuário autenticado ou em caso de erro

## Requisitos

### Requisito 1

**História de Usuário:** Como desenvolvedor, eu quero que todos os serviços de aplicação usem automaticamente a base de dados do usuário logado, para que não seja necessário especificar manualmente a base em cada operação.

#### Critérios de Aceitação

1. QUANDO um usuário está autenticado ENTÃO todos os serviços de aplicação DEVEM usar automaticamente a conexão SQL Server da base especificada em BANCODEDADOS
2. QUANDO um usuário está autenticado ENTÃO todos os serviços de aplicação DEVEM usar automaticamente a conexão MongoDB da base especificada em BANCODEDADOS
3. QUANDO não há usuário autenticado ENTÃO os serviços DEVEM usar a base global spedrevio como fallback
4. QUANDO ocorre erro na conexão específica ENTÃO os serviços DEVEM registrar o erro e usar a base global como fallback
5. QUANDO um serviço é de autenticação ENTÃO ele DEVE sempre usar a base global independente do contexto de usuário

### Requisito 2

**História de Usuário:** Como arquiteto de sistema, eu quero que o roteamento de base de dados seja transparente para os serviços, para que os desenvolvedores não precisem se preocupar com a lógica de seleção de base.

#### Critérios de Aceitação

1. QUANDO um serviço solicita uma conexão de banco ENTÃO o sistema DEVE retornar automaticamente a conexão correta baseada no contexto do usuário
2. QUANDO um serviço faz uma consulta ENTÃO ele NÃO DEVE precisar especificar qual base usar
3. QUANDO o contexto de usuário muda ENTÃO as próximas operações DEVEM usar a nova base automaticamente
4. QUANDO um serviço é chamado sem contexto de usuário ENTÃO ele DEVE receber a conexão global sem erro
5. QUANDO múltiplos usuários fazem requisições simultâneas ENTÃO cada requisição DEVE usar sua respectiva base de dados

### Requisito 3

**História de Usuário:** Como administrador de segurança, eu quero garantir isolamento completo de dados entre clientes, para que nenhum usuário possa acessar dados de outras organizações.

#### Critérios de Aceitação

1. QUANDO um usuário do cliente A faz uma consulta ENTÃO o sistema DEVE garantir que apenas dados do cliente A sejam retornados
2. QUANDO um usuário tenta acessar dados ENTÃO o sistema DEVE validar que a base de dados corresponde ao BANCODEDADOS do usuário autenticado
3. QUANDO ocorre uma tentativa de acesso cruzado ENTÃO o sistema DEVE bloquear a operação e registrar o evento de segurança
4. QUANDO um usuário faz logout ENTÃO as próximas operações DEVEM reverter para a base global
5. QUANDO um token expira ENTÃO o sistema DEVE limpar o contexto de usuário e usar a base global

### Requisito 4

**História de Usuário:** Como desenvolvedor de serviços, eu quero que o DownloadService use a base de dados do usuário logado, para que downloads sejam isolados por cliente.

#### Critérios de Aceitação

1. QUANDO um download é agendado ENTÃO o registro DEVE ser criado na tabela tbl_nfe_dow da base do cliente autenticado
2. QUANDO o status de download é consultado ENTÃO a consulta DEVE ser feita na base do cliente autenticado
3. QUANDO um download é marcado como iniciado ENTÃO a atualização DEVE ocorrer na base do cliente autenticado
4. QUANDO downloads prontos são verificados ENTÃO a verificação DEVE ser feita na base do cliente autenticado
5. QUANDO downloads antigos são limpos ENTÃO a limpeza DEVE ocorrer apenas na base do cliente autenticado

### Requisito 5

**História de Usuário:** Como desenvolvedor de serviços, eu quero que o FiscalDocumentsService use a base de dados do usuário logado, para que consultas de documentos sejam isoladas por cliente.

#### Critérios de Aceitação

1. QUANDO documentos fiscais são consultados ENTÃO a consulta DEVE ser feita na base MongoDB do cliente autenticado
2. QUANDO contagem de documentos é solicitada ENTÃO a contagem DEVE ser feita na base do cliente autenticado
3. QUANDO estatísticas são consultadas ENTÃO os dados DEVE vir da base do cliente autenticado
4. QUANDO filtros são aplicados ENTÃO eles DEVEM operar apenas nos dados do cliente autenticado
5. QUANDO paginação é usada ENTÃO ela DEVE considerar apenas os dados do cliente autenticado

### Requisito 6

**História de Usuário:** Como desenvolvedor, eu quero um middleware que configure automaticamente o contexto de base de dados, para que todos os serviços tenham acesso transparente à base correta.

#### Critérios de Aceitação

1. QUANDO uma requisição HTTP é recebida ENTÃO o middleware DEVE extrair o usuário do token JWT
2. QUANDO o usuário é extraído ENTÃO o middleware DEVE configurar o contexto de base de dados com BANCODEDADOS
3. QUANDO o contexto é configurado ENTÃO ele DEVE estar disponível para todos os serviços durante a requisição
4. QUANDO a requisição termina ENTÃO o contexto DEVE ser limpo para evitar vazamentos
5. QUANDO não há token válido ENTÃO o middleware DEVE configurar contexto para base global

### Requisito 7

**História de Usuário:** Como desenvolvedor, eu quero que o DatabaseRouter seja atualizado para suportar contexto de usuário, para que ele retorne automaticamente a conexão correta.

#### Critérios de Aceitação

1. QUANDO getSqlConnection é chamado sem parâmetros ENTÃO ele DEVE retornar a conexão da base do usuário no contexto atual
2. QUANDO getMongoConnection é chamado sem parâmetros ENTÃO ele DEVE retornar a conexão da base do usuário no contexto atual
3. QUANDO não há contexto de usuário ENTÃO os métodos DEVEM retornar conexões da base global
4. QUANDO o contexto de usuário muda ENTÃO as próximas chamadas DEVEM retornar conexões da nova base
5. QUANDO ocorre erro na conexão específica ENTÃO os métodos DEVEM fazer fallback para a base global

### Requisito 8

**História de Usuário:** Como desenvolvedor, eu quero que todos os serviços existentes sejam atualizados para usar o roteamento automático, para que o isolamento de dados seja aplicado em toda a aplicação.

#### Critérios de Aceitação

1. QUANDO DownloadService é usado ENTÃO ele DEVE usar getSqlConnection() sem parâmetros para obter a conexão correta
2. QUANDO FiscalDocumentsService é usado ENTÃO ele DEVE usar getMongoConnection() sem parâmetros para obter a conexão correta
3. QUANDO novos serviços são criados ENTÃO eles DEVEM seguir o padrão de usar conexões sem especificar base
4. QUANDO serviços de autenticação são usados ENTÃO eles DEVEM continuar usando explicitamente a base global
5. QUANDO qualquer serviço faz consultas ENTÃO elas DEVEM ser automaticamente direcionadas para a base correta

### Requisito 9

**História de Usuário:** Como administrador de sistema, eu quero que todas as operações de roteamento sejam registradas, para que eu possa auditar o acesso às bases de dados.

#### Critérios de Aceitação

1. QUANDO uma conexão específica é criada ENTÃO o evento DEVE ser registrado com usuário e base de dados
2. QUANDO ocorre fallback para base global ENTÃO o evento DEVE ser registrado com motivo
3. QUANDO ocorre erro de conexão ENTÃO o erro DEVE ser registrado com detalhes técnicos
4. QUANDO um usuário acessa múltiplas bases ENTÃO cada acesso DEVE ser registrado separadamente
5. QUANDO operações de limpeza ocorrem ENTÃO elas DEVEM ser registradas com estatísticas

### Requisito 10

**História de Usuário:** Como desenvolvedor, eu quero que o sistema seja resiliente a falhas de conexão, para que a aplicação continue funcionando mesmo com problemas em bases específicas.

#### Critérios de Aceitação

1. QUANDO uma base específica está indisponível ENTÃO o sistema DEVE usar a base global como fallback
2. QUANDO múltiplas tentativas de conexão falham ENTÃO o sistema DEVE implementar backoff exponencial
3. QUANDO uma conexão é perdida ENTÃO o sistema DEVE tentar reconectar automaticamente
4. QUANDO o fallback é usado ENTÃO o usuário DEVE ser notificado sobre a limitação temporária
5. QUANDO a base específica volta a funcionar ENTÃO o sistema DEVE retomar o uso da base correta

### Requisito 11

**História de Usuário:** Como desenvolvedor, eu quero testes que validem o isolamento de dados, para que eu possa garantir que o roteamento funciona corretamente.

#### Critérios de Aceitação

1. QUANDO testes são executados ENTÃO eles DEVEM validar que usuários diferentes acessam bases diferentes
2. QUANDO simulações de carga são feitas ENTÃO elas DEVEM confirmar que não há vazamento de dados entre clientes
3. QUANDO cenários de erro são testados ENTÃO eles DEVEM validar que o fallback funciona corretamente
4. QUANDO testes de segurança são executados ENTÃO eles DEVEM confirmar que acesso cruzado é bloqueado
5. QUANDO testes de performance são feitos ENTÃO eles DEVEM validar que o roteamento não impacta significativamente a performance

### Requisito 12

**História de Usuário:** Como desenvolvedor, eu quero que o APILogger use a base de dados apropriada baseada no contexto, para que logs sejam armazenados na base correta.

#### Critérios de Aceitação

1. QUANDO um usuário está autenticado ENTÃO o APILogger DEVE registrar logs na tabela tbl_api_log da base do cliente autenticado
2. QUANDO não há usuário autenticado ENTÃO o APILogger DEVE registrar logs na tabela tbl_api_log da base padrão definida nas variáveis de ambiente
3. QUANDO ocorre erro ao registrar na base do cliente ENTÃO o APILogger DEVE fazer fallback para a base padrão
4. QUANDO logs são consultados ENTÃO eles DEVEM vir da base do cliente autenticado
5. QUANDO o APILogger registra eventos ENTÃO ele NÃO DEVE bloquear a operação principal em caso de falha

### Requisito 13

**História de Usuário:** Como desenvolvedor, eu quero documentação clara sobre como usar o roteamento automático, para que novos desenvolvedores possam implementar serviços corretamente.

#### Critérios de Aceitação

1. QUANDO um desenvolvedor cria um novo serviço ENTÃO ele DEVE ter documentação sobre como usar conexões automáticas
2. QUANDO padrões de código são definidos ENTÃO eles DEVEM incluir exemplos de uso correto do DatabaseRouter
3. QUANDO guias de migração são criados ENTÃO eles DEVEM explicar como atualizar serviços existentes
4. QUANDO troubleshooting é necessário ENTÃO deve haver guias para diagnosticar problemas de roteamento
5. QUANDO melhores práticas são documentadas ENTÃO elas DEVEM incluir considerações de segurança e performance