# Plano de Implementação

- [x] 1. Configurar estrutura base e dependências


  - Instalar dependências necessárias (jsonwebtoken, bcrypt, etc.)
  - Atualizar schema Prisma com modelos de autenticação
  - Gerar cliente Prisma atualizado
  - _Requisitos: 1.1, 12.1_

- [x] 2. Implementar serviços backend de autenticação



- [x] 2.1 Criar AuthService com validação de credenciais


  - Implementar método validateCredentials que consulta fr_usuario
  - Implementar método checkDatabaseStatus que verifica status=2
  - Implementar método checkPermissions que consulta fr_usuario_sistema
  - _Requisitos: 1.1, 1.2, 1.3_

- [ ]* 2.2 Escrever teste de propriedade para validação completa de autenticação
  - **Propriedade 1: Autenticação requer todas as validações**

  - **Valida: Requisitos 1.1, 1.2, 1.3**

- [x] 2.3 Criar TokenManager para geração e validação de JWT


  - Implementar método generateToken com payload completo
  - Implementar método validateToken com verificação de expiração
  - _Requisitos: 1.4, 2.3, 2.4_

- [x]* 2.4 Escrever teste de propriedade para conteúdo do token


  - **Propriedade 2: Token contém informações completas do usuário**
  - **Valida: Requisitos 1.4**

- [x] 3. Implementar DatabaseRouter para conexões dinâmicas



- [x] 3.1 Criar DatabaseRouter com métodos de conexão


  - Implementar getSqlConnection que cria conexão dinâmica baseada em BANCODEDADOS
  - Implementar getMongoConnection que cria conexão MongoDB dinâmica
  - Implementar resetToGlobal para reverter à base spedrevio
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_



- [ ]* 3.2 Escrever teste de propriedade para roteamento de base de dados
  - **Propriedade 10: Conexão de base de dados dinâmica**
  - **Valida: Requisitos 8.1, 8.2, 8.3, 8.4**

- [ ] 4. Implementar APILogger para auditoria
- [x] 4.1 Criar APILogger com métodos de registro


  - Implementar logRequest que registra em tbl_api_log
  - Implementar logError que registra erros
  - Implementar logSuccess que registra ações bem-sucedidas
  - Garantir que falhas no log não bloqueiam requisições
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x]* 4.2 Escrever teste de propriedade para registro de requisições


  - **Propriedade 5: Todas as requisições são registradas**
  - **Valida: Requisitos 4.1, 4.2**

- [ ]* 4.3 Escrever teste unitário para falha no registro não bloquear requisição
  - Verificar que erro no APILogger não impede resposta da API
  - _Requisitos: 4.5_

- [ ] 5. Criar middleware de autenticação e autorização
- [x] 5.1 Implementar AuthMiddleware




  - Criar verifyToken que valida JWT em todas as requisições
  - Criar requireAdmin que verifica permissões administrativas
  - Criar attachDatabase que anexa conexões de base de dados à requisição
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 9.4_

- [ ]* 5.2 Escrever teste de propriedade para verificação de rotas protegidas
  - **Propriedade 9: Rotas protegidas verificam token**
  - **Valida: Requisitos 7.1, 7.5**


- [ ] 6. Implementar rotas de autenticação
- [x] 6.1 Criar rota POST /api/auth/login



  - Validar credenciais usando AuthService
  - Gerar token usando TokenManager
  - Retornar dados do usuário e token
  - Registrar tentativa de login no APILogger
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 6.2 Criar rota POST /api/auth/logout

  - Limpar sessão do usuário
  - Registrar logout no APILogger
  - _Requisitos: 3.4_



- [x] 6.3 Criar rota GET /api/auth/me

  - Retornar dados do usuário autenticado
  - Verificar token válido
  - _Requisitos: 2.2, 3.1, 3.2_

- [ ]* 6.4 Escrever testes unitários para rotas de autenticação
  - Testar login com credenciais válidas
  - Testar login com credenciais inválidas
  - Testar login com status != 2
  - Testar login sem permissões
  - _Requisitos: 1.1, 1.2, 1.3, 1.5_

- [x] 7. Implementar tratamento centralizado de erros



- [x] 7.1 Criar ErrorHandler com métodos para cada tipo de erro


  - Implementar handle401 para erros de autenticação
  - Implementar handle403 para erros de autorização


  - Implementar handle500 para erros internos
  - Implementar handleError genérico
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 7.2 Escrever testes unitários para tratamento de erros
  - Testar redirecionamento em erro 401
  - Testar mensagem de acesso negado em erro 403
  - Testar mensagem de erro do servidor em erro 500
  - _Requisitos: 6.2, 6.3, 6.4_

- [x] 8. Checkpoint - Garantir que todos os testes passem


  - Garantir que todos os testes passem, perguntar ao usuário se surgirem dúvidas.

- [x] 9. Criar AuthContext no frontend


- [x] 9.1 Implementar AuthContext com gerenciamento de sessão


  - Criar contexto com estado de usuário e autenticação
  - Implementar método login que chama API e armazena token
  - Implementar método logout que limpa sessão
  - Implementar método checkAuth que valida token no localStorage
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 12.1, 12.2, 12.4, 12.5_

- [ ]* 9.2 Escrever teste de propriedade para persistência de sessão
  - **Propriedade 3: Sessão persiste através de recarregamentos**
  - **Valida: Requisitos 2.2**

- [ ]* 9.3 Escrever teste de propriedade para limpeza de token expirado
  - **Propriedade 4: Token expirado limpa sessão**
  - **Valida: Requisitos 2.3, 2.4**



- [ ] 10. Criar componente de login
- [x] 10.1 Implementar página de login


  - Criar formulário com campos de usuário e senha
  - Implementar validação de campos vazios
  - Implementar indicador de carregamento durante login
  - Implementar exibição de mensagens de erro
  - Usar esquema de cores existente do projeto
  - Redirecionar para dashboard após login bem-sucedido
  - _Requisitos: 1.6, 11.1, 11.2, 11.3, 11.4, 11.5_


- [x]* 10.2 Escrever testes unitários para componente de login


  - Testar validação de campos vazios
  - Testar exibição de erro em falha de login
  - Testar redirecionamento após login bem-sucedido
  - _Requisitos: 1.6, 11.4, 11.5_

- [ ] 11. Criar componente ProtectedRoute
- [x] 11.1 Implementar ProtectedRoute com verificação de autenticação



  - Verificar presença de token válido
  - Redirecionar para login se não autenticado
  - Suportar prop requireAdmin para rotas administrativas
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 9.4_

- [ ]* 11.2 Escrever testes unitários para ProtectedRoute
  - Testar redirecionamento sem token
  - Testar redirecionamento com token expirado
  - Testar acesso permitido com token válido
  - Testar bloqueio de não-admin em rota admin
  - _Requisitos: 7.2, 7.3, 7.4, 9.4_

- [ ] 12. Criar componente UserDisplay
- [ ] 12.1 Implementar exibição de informações do usuário








  - Exibir nome do usuário (USR_NOME)
  - Exibir nome da base de dados (BANCODEDADOS)
  - Incluir botão de logout
  - Manter esquema de cores do projeto
  - _Requisitos: 3.1, 3.2, 3.3, 3.5_

- [x] 12.2 Integrar UserDisplay no Layout



  - Adicionar UserDisplay ao componente Layout existente
  - Substituir menu de usuário estático por UserDisplay dinâmico
  - _Requisitos: 3.1, 3.2, 3.3_



- [ ] 13. Migrar de axios para fetch API
- [x] 13.1 Criar serviço HTTP centralizado com fetch



  - Implementar wrapper de fetch com interceptors
  - Adicionar token de autenticação automaticamente
  - Implementar tratamento de erros centralizado
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_


- [ ]* 13.2 Escrever teste de propriedade para inclusão de token
  - **Propriedade 7: Fetch inclui token de autenticação**
  - **Valida: Requisitos 5.2**


- [ ]* 13.3 Escrever teste de propriedade para tratamento de erro 401
  - **Propriedade 8: Erro 401 redireciona para login**
  - **Valida: Requisitos 5.4, 6.2**

- [x] 13.4 Substituir chamadas axios por fetch em todos os serviços

  - Atualizar mongoApiService para usar fetch
  - Atualizar outros serviços existentes
  - Remover dependência axios do package.json
  - _Requisitos: 5.1_

- [x] 14. Checkpoint - Garantir que todos os testes passem



  - Garantir que todos os testes passem, perguntar ao usuário se surgirem dúvidas.

- [ ] 15. Implementar DownloadService no backend
- [x] 15.1 Criar DownloadService com métodos de agendamento


  - Implementar scheduleDownload que cria registros em tbl_nfe_dow e tbl_nfe_dow_det
  - Implementar getDownloadStatus que consulta status do download
  - Implementar markDownloadStarted que atualiza STATUS para '3'
  - _Requisitos: 14.2, 14.3, 14.4, 15.3, 16.3_

- [x]* 15.2 Escrever teste de propriedade para criação de registros

  - **Propriedade 14: Agendamento cria registros pai e filho**
  - **Valida: Requisitos 14.2, 14.3**

- [ ] 16. Criar rotas de download no backend
- [ ] 16.1 Criar rota POST /api/downloads/schedule
  - Receber array de chaves do frontend
  - Validar autenticação e usar base de dados do cliente
  - Criar registros usando DownloadService
  - Retornar ID do download agendado
  - _Requisitos: 14.1, 14.2, 14.3, 14.4, 17.1, 17.2, 17.4_


- [ ] 16.2 Criar rota GET /api/downloads/status/:usrCodigo
  - Validar autenticação
  - Consultar tbl_nfe_dow filtrando por USR_CODIGO
  - Retornar status e link se disponível

  - _Requisitos: 15.3, 17.1, 17.3_

- [ ] 16.3 Criar rota PUT /api/downloads/:id/started
  - Validar autenticação
  - Atualizar STATUS para '3' em tbl_nfe_dow
  - _Requisitos: 16.3, 17.1_


- [ ]* 16.4 Escrever teste de propriedade para autenticação de rotas
  - **Propriedade 17: Rotas de download são autenticadas**
  - **Valida: Requisitos 17.1, 17.2, 17.4**

- [ ]* 16.5 Escrever testes unitários para rotas de download
  - Testar agendamento com múltiplas chaves
  - Testar consulta de status
  - Testar atualização de status para '3'
  - _Requisitos: 14.2, 14.3, 15.3, 16.3_

- [ ] 17. Adicionar coluna ESCOLHER nas grids
- [ ] 17.1 Adicionar coluna com checkboxes na grid de notas
  - Criar coluna ESCOLHER com checkbox para cada linha
  - Implementar controle de estado das checkboxes

  - Vincular cada checkbox à chave CHV_NFE do registro
  - _Requisitos: 13.1_

- [ ] 17.2 Implementar gerenciamento de seleção no localStorage
  - Adicionar chave ao Set no localStorage quando marcado
  - Remover chave do Set quando desmarcado
  - Restaurar estado das checkboxes ao carregar página
  - _Requisitos: 13.2, 13.3, 13.4_

- [ ]* 17.3 Escrever teste de propriedade para persistência de seleção
  - **Propriedade 13: Seleção de documentos persiste**
  - **Valida: Requisitos 13.2, 13.4**


- [ ] 18. Criar componente DownloadManager
- [ ] 18.1 Implementar botão "Confirmar Download"
  - Exibir botão apenas quando há itens selecionados
  - Posicionar botão abaixo da grid
  - Implementar handler que envia chaves para backend
  - _Requisitos: 13.5, 14.1_

- [ ] 18.2 Implementar feedback visual de agendamento
  - Exibir indicador de carregamento durante agendamento
  - Exibir mensagem de sucesso após agendamento
  - Exibir mensagem de erro em caso de falha
  - _Requisitos: 14.1, 14.5_

- [ ] 19. Criar Web Worker para monitoramento global de downloads
- [ ] 19.1 Implementar downloadWorker.ts
  - Criar worker que faz polling a cada 30 segundos
  - Implementar verificação de STATUS='2' e LINK preenchido
  - Implementar notificação ao thread principal quando pronto
  - Implementar gerenciamento de múltiplos usuários monitorados

  - _Requisitos: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ]* 19.2 Escrever teste de propriedade para monitoramento global
  - **Propriedade 15: Web Worker monitora status globalmente**
  - **Valida: Requisitos 15.2, 15.4, 15.6**


- [ ]* 19.3 Escrever teste de propriedade para persistência entre navegações
  - **Propriedade 18: Web Worker persiste entre navegações**
  - **Valida: Requisitos 15.6, 18.3**



- [ ] 20. Criar serviço DownloadMonitor global
- [ ] 20.1 Implementar DownloadMonitorService como singleton
  - Criar serviço singleton que gerencia o Web Worker
  - Implementar método initialize que inicia o worker no login
  - Implementar método shutdown que encerra o worker no logout
  - Implementar método checkPendingDownloads que verifica downloads ao inicializar
  - Implementar callback para notificações de download pronto
  - _Requisitos: 18.1, 18.2, 18.3, 18.4_

- [ ]* 20.2 Escrever teste de propriedade para inicialização no login
  - **Propriedade 19: Web Worker inicializa no login**
  - **Valida: Requisitos 18.1, 18.2**

- [ ] 21. Implementar download automático global
- [ ] 21. Implementar download automático global
- [ ] 21.1 Criar handler global para mensagem DOWNLOAD_READY do worker
  - Iniciar download do arquivo usando link recebido
  - Limpar chaves do localStorage após iniciar download
  - Chamar API para atualizar STATUS para '3'
  - Continuar monitoramento para novos downloads
  - Exibir notificação visual em qualquer página

  - _Requisitos: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 18.5_


- [ ]* 21.2 Escrever teste de propriedade para limpeza após download
  - **Propriedade 16: Download automático limpa localStorage**
  - **Valida: Requisitos 16.2, 16.3**

- [x]* 21.3 Escrever testes unitários para download automático

  - Testar início de download com link válido
  - Testar limpeza de localStorage
  - Testar atualização de status
  - Testar notificação visual
  - _Requisitos: 16.1, 16.2, 16.3, 18.5_

- [ ] 22. Integrar DownloadMonitor com AuthContext
- [ ] 22.1 Inicializar DownloadMonitor no login
  - Chamar downloadMonitor.initialize() após login bem-sucedido
  - Passar usrCodigo do usuário autenticado
  - Verificar downloads pendentes imediatamente
  - _Requisitos: 18.1, 18.2_

- [ ] 22.2 Encerrar DownloadMonitor no logout
  - Chamar downloadMonitor.shutdown() ao fazer logout
  - Garantir que worker seja encerrado corretamente
  - _Requisitos: 18.4_

- [ ] 22.3 Implementar componente de notificação global
  - Criar componente que exibe notificações de download
  - Posicionar componente no Layout para estar visível em todas as páginas
  - Implementar animação de entrada/saída
  - _Requisitos: 18.5_

- [ ] 23. Atualizar rotas da aplicação
- [ ] 23. Atualizar rotas da aplicação
- [x] 23.1 Adicionar rota de login


  - Criar rota /login sem proteção
  - Redirecionar usuários não autenticados para /login
  - _Requisitos: 11.5_

- [x] 23.2 Proteger rotas existentes

  - Envolver rotas existentes com ProtectedRoute
  - Identificar rotas administrativas e adicionar requireAdmin
  - _Requisitos: 7.1, 9.3_

- [ ] 24. Checkpoint Final - Garantir que todos os testes passem
  - Garantir que todos os testes passem, perguntar ao usuário se surgirem dúvidas.

- [ ] 25. Testes de integração end-to-end
- [ ]* 25.1 Testar fluxo completo de autenticação
  - Login → Verificação de token → Acesso a rota protegida → Logout
  - _Requisitos: 1.1, 2.2, 7.1, 3.4_

- [ ]* 25.2 Testar fluxo completo de download com navegação
  - Seleção → Agendamento → Navegação entre páginas → Download automático
  - _Requisitos: 13.2, 14.1, 15.6, 16.6, 18.3_

- [ ]* 25.3 Testar troca de base de dados
  - Login usuário A → Consulta base A → Logout → Login usuário B → Consulta base B
  - _Requisitos: 8.1, 8.4, 8.5_

- [ ]* 25.4 Testar inicialização de monitoramento no login
  - Login → Verificar worker ativo → Verificar downloads pendentes → Logout → Verificar worker encerrado
  - _Requisitos: 18.1, 18.2, 18.4_
