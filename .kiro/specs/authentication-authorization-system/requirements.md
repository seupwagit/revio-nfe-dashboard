# Documento de Requisitos

## Introdução

Este documento especifica os requisitos para implementação de um sistema completo de autenticação e autorização para a plataforma Revio de gerenciamento de documentos fiscais. O sistema implementa uma arquitetura multi-tenant onde usuários autenticam contra uma base de dados global (spedrevio) e então acessam bases de dados específicas de clientes (satélites) baseado em suas permissões. O sistema deve integrar com tabelas SQL Server existentes (fr_usuario, fr_usuario_sistema) e suportar troca dinâmica de bases de dados tanto para SQL Server quanto MongoDB após autenticação.

## Glossário

- **Base Global**: A base de dados spedrevio contendo dados de autenticação de usuários e mapeamentos de bases de clientes
- **Base Satélite**: Bases de dados específicas de clientes contendo dados de documentos fiscais, acessadas após autenticação
- **Sistema de Autenticação**: O componente responsável por verificar credenciais de usuário contra a base global
- **Sistema de Autorização**: O componente responsável por verificar permissões e direitos de acesso do usuário
- **Gerenciador de Sessão**: O componente que gerencia estado de usuário autenticado e informações de conexão de base de dados
- **Gerenciador de Token**: O componente que manipula geração, validação e renovação de tokens JWT
- **Roteador de Base de Dados**: O componente que troca dinamicamente conexões de base de dados baseado no contexto do usuário autenticado
- **Registrador de API**: O componente que registra todas as ações da API em tbl_api_log
- **Rota Protegida**: Uma rota que requer token de autenticação válido para acesso
- **Usuário Administrador**: Um usuário com permissão USS_ADMINISTRADOR='S' que pode acessar funções administrativas
- **Acesso Externo**: Permissão indicada por USS_ACESSO_EXTERNO='S' permitindo acesso ao sistema
- **Status da Base**: A coluna status indicando se a criação da base do cliente está completa (status=2)

## Requisitos

### Requisito 1

**História de Usuário:** Como usuário, eu quero fazer login com minhas credenciais, para que eu possa acessar o sistema de gerenciamento de documentos fiscais com minhas permissões específicas e acesso à base de dados.

#### Critérios de Aceitação

1. QUANDO um usuário submete credenciais de login ENTÃO o Sistema de Autenticação DEVE validar as credenciais contra a tabela fr_usuario na base de dados spedrevio
2. QUANDO as credenciais são válidas ENTÃO o Sistema de Autenticação DEVE verificar que o status da base de dados do usuário é igual a 2 na tabela fr_usuario
3. QUANDO o status da base é verificado ENTÃO o Sistema de Autorização DEVE verificar na tabela fr_usuario_sistema as permissões USS_ACESSO_EXTERNO='S' e USS_ACESSAR='S'
4. QUANDO todas as validações passam ENTÃO o Gerenciador de Token DEVE gerar um token JWT contendo informações do usuário e nome da base de dados da coluna BANCODEDADOS
5. QUANDO a autenticação falha em qualquer etapa ENTÃO o Sistema de Autenticação DEVE retornar uma mensagem de erro específica indicando o motivo da falha
6. QUANDO um usuário submete credenciais vazias ENTÃO o Sistema de Autenticação DEVE rejeitar a requisição e retornar um erro de validação

### Requisito 2

**História de Usuário:** Como usuário autenticado, eu quero que minha sessão persista entre atualizações de página, para que eu não precise fazer login repetidamente durante minha sessão de trabalho.

#### Critérios de Aceitação

1. QUANDO um usuário autentica com sucesso ENTÃO o Gerenciador de Sessão DEVE armazenar o token JWT no armazenamento do navegador
2. QUANDO a aplicação carrega ENTÃO o Gerenciador de Sessão DEVE verificar por um token válido e restaurar a sessão do usuário
3. QUANDO um token existe mas está expirado ENTÃO o Gerenciador de Sessão DEVE limpar a sessão e redirecionar para login
4. QUANDO um token é inválido ENTÃO o Gerenciador de Sessão DEVE limpar a sessão e redirecionar para login
5. QUANDO um usuário fecha e reabre o navegador ENTÃO o Gerenciador de Sessão DEVE restaurar a sessão se o token ainda for válido

### Requisito 3

**História de Usuário:** Como usuário autenticado, eu quero ver meu nome e base de dados atual exibidos na interface, para que eu saiba com qual conta e base de dados estou trabalhando.

#### Critérios de Aceitação

1. QUANDO um usuário está autenticado ENTÃO a interface DEVE exibir o nome do usuário da coluna USR_NOME
2. QUANDO um usuário está autenticado ENTÃO a interface DEVE exibir o nome da base de dados da coluna BANCODEDADOS
3. QUANDO as informações do usuário são exibidas ENTÃO a interface DEVE fornecer um botão de logout
4. QUANDO o usuário clica em logout ENTÃO o Gerenciador de Sessão DEVE limpar todos os dados de sessão e redirecionar para login
5. QUANDO a interface exibe informações do usuário ENTÃO ela DEVE manter o esquema de cores existente do projeto

### Requisito 4

**História de Usuário:** Como administrador do sistema, eu quero que todas as requisições da API sejam registradas, para que eu possa auditar o uso do sistema e solucionar problemas.

#### Critérios de Aceitação

1. QUANDO qualquer endpoint da API é chamado ENTÃO o Registrador de API DEVE registrar a requisição na tabela tbl_api_log
2. QUANDO registrando uma requisição ENTÃO o Registrador de API DEVE capturar timestamp DTHR, endereço IP, caminho CAMINHO_ACESSADO e identificador de usuário USR_CODIGO
3. QUANDO um erro ocorre ENTÃO o Registrador de API DEVE registrar a mensagem de erro na coluna MENSAGEM e definir TIPO como 'ERROR'
4. QUANDO uma ação bem-sucedida ocorre ENTÃO o Registrador de API DEVE registrar detalhes da ação na coluna MENSAGEM e definir TIPO como 'INFO'
5. QUANDO o registro falha ENTÃO o Registrador de API NÃO DEVE bloquear a requisição original de completar

### Requisito 5

**História de Usuário:** Como desenvolvedor, eu quero que todas as requisições HTTP usem fetch API ao invés de axios, para que a base de código use um cliente HTTP consistente e moderno.

#### Critérios de Aceitação

1. QUANDO fazendo requisições HTTP ENTÃO o sistema DEVE usar a fetch API nativa
2. QUANDO uma requisição fetch é feita ENTÃO o sistema DEVE incluir o token de autenticação no cabeçalho Authorization para todos os endpoints exceto login
3. QUANDO uma requisição fetch falha ENTÃO o sistema DEVE tratar o erro através do tratamento centralizado de erros
4. QUANDO uma resposta 401 Unauthorized é recebida ENTÃO o sistema DEVE redirecionar para a página de login
5. QUANDO uma resposta 403 Forbidden é recebida ENTÃO o sistema DEVE exibir uma mensagem de acesso negado

### Requisito 6

**História de Usuário:** Como desenvolvedor, eu quero tratamento centralizado de erros para requisições HTTP, para que respostas de erro sejam tratadas consistentemente em toda a aplicação.

#### Critérios de Aceitação

1. QUANDO um erro HTTP ocorre ENTÃO o tratador centralizado de erros DEVE processar a resposta de erro
2. QUANDO um erro 401 ocorre ENTÃO o tratador de erros DEVE limpar a sessão e redirecionar para login
3. QUANDO um erro 403 ocorre ENTÃO o tratador de erros DEVE exibir uma mensagem de acesso negado
4. QUANDO um erro 500 ocorre ENTÃO o tratador de erros DEVE exibir uma mensagem de erro do servidor
5. QUANDO um erro de rede ocorre ENTÃO o tratador de erros DEVE exibir uma mensagem de erro de conexão

### Requisito 7

**História de Usuário:** Como arquiteto de sistema, eu quero que todas as rotas protegidas verifiquem tokens de autenticação, para que usuários não autorizados não possam acessar recursos protegidos.

#### Critérios de Aceitação

1. QUANDO uma rota protegida é acessada ENTÃO o guardião de rota DEVE verificar a presença de um token de autenticação válido
2. QUANDO nenhum token existe ENTÃO o guardião de rota DEVE redirecionar para a página de login
3. QUANDO um token está expirado ENTÃO o guardião de rota DEVE limpar a sessão e redirecionar para login
4. QUANDO um token é inválido ENTÃO o guardião de rota DEVE limpar a sessão e redirecionar para login
5. QUANDO um token válido existe ENTÃO o guardião de rota DEVE permitir acesso à rota protegida

### Requisito 8

**História de Usuário:** Como usuário autenticado, eu quero que o sistema conecte automaticamente à minha base de dados atribuída, para que eu veja apenas os documentos fiscais da minha organização.

#### Critérios de Aceitação

1. QUANDO um usuário autentica com sucesso ENTÃO o Roteador de Base de Dados DEVE extrair o nome da base de dados da coluna BANCODEDADOS
2. QUANDO o nome da base é extraído ENTÃO o Roteador de Base de Dados DEVE criar uma string de conexão SQL Server dinâmica substituindo o nome da base em DATABASE_URL
3. QUANDO o nome da base é extraído ENTÃO o Roteador de Base de Dados DEVE criar uma string de conexão MongoDB dinâmica com o nome da base do cliente
4. QUANDO uma consulta de base de dados é executada ENTÃO o Roteador de Base de Dados DEVE usar a conexão específica do cliente
5. QUANDO um usuário faz logout ENTÃO o Roteador de Base de Dados DEVE reverter para a conexão da base global spedrevio

### Requisito 9

**História de Usuário:** Como usuário administrador, eu quero acesso a funções administrativas, para que eu possa gerenciar configuração do sistema e permissões de usuários.

#### Critérios de Aceitação

1. QUANDO um usuário autentica ENTÃO o Sistema de Autorização DEVE verificar a coluna USS_ADMINISTRADOR na tabela fr_usuario_sistema
2. QUANDO USS_ADMINISTRADOR é igual a 'S' ENTÃO o Sistema de Autorização DEVE conceder permissões administrativas
3. QUANDO permissões administrativas são concedidas ENTÃO a interface DEVE exibir opções de menu administrativo
4. QUANDO um usuário não-admin tenta acessar rotas admin ENTÃO o Sistema de Autorização DEVE negar acesso e retornar 403 Forbidden
5. QUANDO permissões administrativas são armazenadas ENTÃO o Gerenciador de Sessão DEVE incluir flag de admin nos dados de sessão

### Requisito 10

**História de Usuário:** Como desenvolvedor consciente de segurança, eu quero que senhas sejam validadas de forma segura, para que credenciais de usuário sejam protegidas.

#### Critérios de Aceitação

1. QUANDO validando uma senha ENTÃO o Sistema de Autenticação DEVE comparar contra o valor da coluna USR_SENHA
2. QUANDO validação de senha ocorre ENTÃO o Sistema de Autenticação DEVE usar métodos de comparação seguros para prevenir ataques de timing
3. QUANDO uma senha está incorreta ENTÃO o Sistema de Autenticação DEVE retornar uma mensagem genérica de falha de autenticação
4. QUANDO múltiplas tentativas de login falhadas ocorrem ENTÃO o Registrador de API DEVE registrar cada tentativa com TIPO='FAILED_LOGIN'
5. QUANDO validação de senha completa ENTÃO o Sistema de Autenticação NÃO DEVE expor hashes de senha em nenhuma resposta

### Requisito 11

**História de Usuário:** Como usuário, eu quero uma interface de login limpa e intuitiva, para que eu possa acessar o sistema facilmente.

#### Critérios de Aceitação

1. QUANDO a página de login carrega ENTÃO a interface DEVE exibir campos de entrada para usuário e senha
2. QUANDO a página de login carrega ENTÃO a interface DEVE usar o esquema de cores existente do projeto
3. QUANDO login está em progresso ENTÃO a interface DEVE exibir um indicador de carregamento e desabilitar o botão de submissão
4. QUANDO login falha ENTÃO a interface DEVE exibir uma mensagem de erro clara
5. QUANDO login tem sucesso ENTÃO a interface DEVE redirecionar para a página de dashboard

### Requisito 12

**História de Usuário:** Como desenvolvedor, eu quero dados de sessão armazenados de forma segura, para que informações do usuário e contexto de base de dados estejam disponíveis em toda a aplicação.

#### Critérios de Aceitação

1. QUANDO um usuário autentica ENTÃO o Gerenciador de Sessão DEVE armazenar USR_CODIGO, USR_NOME, BANCODEDADOS e status de admin
2. QUANDO dados de sessão são armazenados ENTÃO o Gerenciador de Sessão DEVE usar mecanismos de armazenamento seguros
3. QUANDO dados de sessão são acessados ENTÃO o Gerenciador de Sessão DEVE fornecer métodos de acesso type-safe
4. QUANDO um usuário faz logout ENTÃO o Gerenciador de Sessão DEVE limpar completamente todos os dados de sessão armazenados
5. QUANDO dados de sessão são inválidos ENTÃO o Gerenciador de Sessão DEVE limpar a sessão e redirecionar para login

### Requisito 13

**História de Usuário:** Como usuário, eu quero selecionar documentos fiscais na grid para download, para que eu possa baixar múltiplos documentos de uma vez.

#### Critérios de Aceitação

1. QUANDO a grid de notas é exibida ENTÃO o sistema DEVE incluir uma coluna ESCOLHER com caixas de seleção para cada registro
2. QUANDO um usuário marca uma caixa de seleção ENTÃO o sistema DEVE adicionar a chave CHV_NFE correspondente a um Set no localStorage do navegador
3. QUANDO um usuário desmarca uma caixa de seleção ENTÃO o sistema DEVE remover a chave CHV_NFE correspondente do localStorage
4. QUANDO a página é recarregada ENTÃO o sistema DEVE restaurar o estado das caixas de seleção baseado no localStorage
5. QUANDO existem itens selecionados ENTÃO o sistema DEVE exibir um botão "Confirmar Download" abaixo da grid

### Requisito 14

**História de Usuário:** Como usuário, eu quero agendar downloads de documentos selecionados, para que o sistema prepare um arquivo ZIP com todos os documentos.

#### Critérios de Aceitação

1. QUANDO o usuário clica em "Confirmar Download" ENTÃO o sistema DEVE enviar todas as chaves selecionadas para o backend
2. QUANDO o backend recebe as chaves ENTÃO o sistema DEVE criar um registro pai em tbl_nfe_dow com STATUS='1', USR_CODIGO do usuário logado, TIPO_DOC='NFE' e DTHR_ADD com data/hora atual
3. QUANDO o registro pai é criado ENTÃO o sistema DEVE criar registros filhos em tbl_nfe_dow_det para cada chave com STATUS=1 e DTHR_ADD com data/hora atual
4. QUANDO os registros são criados ENTÃO o backend DEVE retornar o ID do registro pai de tbl_nfe_dow para o frontend
5. QUANDO o frontend recebe o ID ENTÃO o sistema DEVE iniciar o monitoramento do status do download

### Requisito 15

**História de Usuário:** Como usuário, eu quero que o sistema monitore automaticamente meus downloads agendados em todas as páginas, para que eu seja notificado quando o arquivo estiver pronto independente de onde estou navegando.

#### Critérios de Aceitação

1. QUANDO um download é agendado ENTÃO o sistema DEVE iniciar um Web Worker global para monitoramento
2. QUANDO o Web Worker está ativo ENTÃO ele DEVE fazer chamadas à API a cada 30 segundos para verificar o status
3. QUANDO a API é chamada ENTÃO ela DEVE consultar tbl_nfe_dow filtrando por USR_CODIGO do usuário logado
4. QUANDO o STATUS em tbl_nfe_dow muda para '2' e LINK está preenchido ENTÃO o Web Worker DEVE notificar o frontend
5. QUANDO múltiplos usuários têm downloads ENTÃO o Web Worker DEVE monitorar apenas os downloads do usuário logado
6. QUANDO o usuário navega entre páginas ENTÃO o Web Worker DEVE continuar monitorando downloads ativos

### Requisito 16

**História de Usuário:** Como usuário, eu quero que o download inicie automaticamente quando o arquivo estiver pronto em qualquer página, para que eu não precise verificar manualmente o status ou estar em uma página específica.

#### Critérios de Aceitação

1. QUANDO o Web Worker detecta STATUS='2' e LINK preenchido ENTÃO o sistema DEVE iniciar o download do arquivo automaticamente no navegador
2. QUANDO o download é iniciado ENTÃO o sistema DEVE limpar as chaves de documentos do localStorage
3. QUANDO o download é iniciado ENTÃO o sistema DEVE chamar a API para atualizar o STATUS em tbl_nfe_dow para '3'
4. QUANDO o STATUS é atualizado para '3' ENTÃO o sistema DEVE indicar que o download foi recebido pelo frontend
5. QUANDO um download é completado ENTÃO o Web Worker DEVE continuar monitorando para detectar novos downloads
6. QUANDO o usuário está em qualquer página do sistema ENTÃO o download DEVE iniciar automaticamente quando pronto

### Requisito 17

**História de Usuário:** Como desenvolvedor, eu quero que as rotas de API de download sejam autenticadas e usem a base de dados do cliente, para que cada usuário acesse apenas seus próprios downloads.

#### Critérios de Aceitação

1. QUANDO uma rota de API de download é chamada ENTÃO o sistema DEVE verificar o token de autenticação
2. QUANDO o token é válido ENTÃO o sistema DEVE usar a conexão SQL Server da base de dados do cliente autenticado
3. QUANDO consultando tbl_nfe_dow ENTÃO o sistema DEVE filtrar por USR_CODIGO do usuário autenticado
4. QUANDO criando registros ENTÃO o sistema DEVE usar a base de dados do cliente obtida do BANCODEDADOS do usuário
5. QUANDO o token é inválido ENTÃO o sistema DEVE retornar erro 401 e não processar a requisição

### Requisito 18

**História de Usuário:** Como usuário, eu quero que o sistema de monitoramento de downloads seja inicializado automaticamente ao fazer login, para que meus downloads sejam monitorados em todas as páginas sem necessidade de ação manual.

#### Critérios de Aceitação

1. QUANDO um usuário faz login com sucesso ENTÃO o sistema DEVE inicializar o Web Worker de monitoramento de downloads
2. QUANDO o Web Worker é inicializado ENTÃO ele DEVE verificar imediatamente se existem downloads pendentes do usuário
3. QUANDO o usuário navega entre páginas ENTÃO o Web Worker DEVE permanecer ativo e continuar monitorando
4. QUANDO o usuário faz logout ENTÃO o sistema DEVE encerrar o Web Worker de monitoramento
5. QUANDO o Web Worker detecta um download pronto ENTÃO ele DEVE exibir uma notificação visual em qualquer página do sistema
