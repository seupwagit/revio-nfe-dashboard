# Plano de Implementação

- [x] 1. Criar UserContext e gerenciamento de contexto


  - Implementar interface UserContext com dados do usuário
  - Criar UserContextManager como singleton para gerenciar contextos por requisição
  - Implementar métodos setContext, getContext, clearContext
  - Adicionar sistema de limpeza automática de contextos antigos
  - _Requisitos: 6.1, 6.2, 6.3, 6.4_

- [ ]* 1.1 Escrever teste de propriedade para gerenciamento de contexto
  - **Propriedade 11: Middleware configura contexto automaticamente**
  - **Valida: Requisitos 6.1, 6.2, 6.3**

- [ ]* 1.2 Escrever teste de propriedade para limpeza de contexto
  - **Propriedade 12: Limpeza de contexto**
  - **Valida: Requisitos 6.4**

- [x] 2. Implementar UserContextMiddleware


  - Criar middleware que extrai usuário do token JWT
  - Implementar configuração automática do contexto de base de dados
  - Adicionar limpeza automática de contexto no final da requisição
  - Implementar tratamento de erros e fallback para base global
  - Integrar com sistema de logging para auditoria
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 2.1 Escrever testes unitários para UserContextMiddleware
  - Testar extração de contexto com token válido
  - Testar configuração de contexto com BANCODEDADOS
  - Testar limpeza de contexto após requisição
  - Testar comportamento com token inválido
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_



- [x] 3. Atualizar DatabaseRouter para suporte a contexto



  - Adicionar métodos getCurrentSqlConnection() e getCurrentMongoConnection()
  - Implementar integração com UserContextManager
  - Adicionar métodos setUserContext() e clearUserContext()
  - Implementar fallback automático para base global
  - Adicionar logging de eventos de conexão e fallback
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 3.1 Escrever teste de propriedade para DatabaseRouter context-aware
  - **Propriedade 13: DatabaseRouter context-aware**
  - **Valida: Requisitos 7.1, 7.2**

- [ ]* 3.2 Escrever teste de propriedade para mudança dinâmica de contexto
  - **Propriedade 4: Mudança dinâmica de contexto**


  - **Valida: Requisitos 2.3, 7.4**

- [x] 4. Implementar sistema de resilência e fallback





  - Criar DatabaseHealthMonitor para monitorar saúde das conexões
  - Implementar circuit breaker para bases indisponíveis
  - Adicionar sistema de retry com backoff exponencial
  - Implementar notificações de fallback para usuários
  - Criar métricas de conexão e uso de fallback
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_


- [ ]* 4.1 Escrever teste de propriedade para notificação de fallback
  - **Propriedade 18: Notificação de fallback**
  - **Valida: Requisitos 10.4**

- [x] 5. Atualizar APILogger para usar contexto de usuário

  - Modificar métodos de logging para usar base do cliente quando autenticado
  - Implementar fallback para base padrão quando não há usuário
  - Adicionar fallback resiliente em caso de erro na base do cliente
  - Garantir que falhas no logging não bloqueiem operações principais
  - Adicionar logging de eventos de conexão e roteamento
  - _Requisitos: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 5.1 Escrever teste de propriedade para APILogger usa base do cliente
  - **Propriedade 19: APILogger usa base do cliente quando autenticado**
  - **Valida: Requisitos 12.1**

- [ ]* 5.2 Escrever teste de propriedade para APILogger não bloqueia operações
  - **Propriedade 20: APILogger não bloqueia operações**
  - **Valida: Requisitos 12.5**

- [ ]* 5.3 Escrever teste de propriedade para consulta de logs
  - **Propriedade 21: Consulta de logs usa base do cliente**
  - **Valida: Requisitos 12.4**



- [x] 6. Checkpoint - Garantir que infraestrutura básica funciona




  - Garantir que todos os testes passem, perguntar ao usuário se surgirem dúvidas.


- [x] 7. Atualizar DownloadService para usar roteamento automático




  - Modificar todos os métodos para usar getCurrentSqlConnection() sem parâmetros
  - Remover chamadas explícitas para getGlobalSqlConnection()
  - Adicionar validação de acesso à base de dados
  - Implementar logging de uso de base de dados
  - Adicionar métodos de diagnóstico para verificar base atual
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1_

- [ ]* 7.1 Escrever teste de propriedade para DownloadService usa base do cliente
  - **Propriedade 9: DownloadService usa base do cliente**
  - **Valida: Requisitos 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ]* 7.2 Escrever teste de propriedade para serviços usam conexões automáticas
  - **Propriedade 14: Serviços usam conexões automáticas**
  - **Valida: Requisitos 8.1, 8.2**

- [x] 8. Atualizar FiscalDocumentsService para usar roteamento automático





  - Modificar serviço backend para usar getCurrentMongoConnection() sem parâmetros
  - Adicionar validação de acesso à base MongoDB
  - Implementar logging de uso de base de dados
  - Garantir que todas as consultas sejam direcionadas para base correta
  - Adicionar métodos de diagnóstico para verificar base atual
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 8.2_

- [ ]* 8.1 Escrever teste de propriedade para FiscalDocumentsService usa base do cliente
  - **Propriedade 10: FiscalDocumentsService usa base do cliente**
  - **Valida: Requisitos 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 9. Implementar roteamento automático para usuários autenticados




  - Integrar UserContextMiddleware em todas as rotas protegidas
  - Garantir que serviços de aplicação usem automaticamente conexão SQL correta
  - Garantir que serviços de aplicação usem automaticamente conexão MongoDB correta
  - Implementar fallback para base global quando não há usuário autenticado
  - Adicionar tratamento de erros com fallback resiliente
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 9.1 Escrever teste de propriedade para roteamento automático SQL
  - **Propriedade 1: Roteamento automático SQL para usuários autenticados**
  - **Valida: Requisitos 1.1**

- [ ]* 9.2 Escrever teste de propriedade para roteamento automático MongoDB
  - **Propriedade 2: Roteamento automático MongoDB para usuários autenticados**
  - **Valida: Requisitos 1.2**

- [x] 10. Implementar transparência de roteamento





  - Garantir que serviços não precisem especificar qual base usar
  - Implementar retorno automático da conexão correta baseada no contexto
  - Adicionar suporte para mudança dinâmica de contexto
  - Implementar isolamento entre usuários simultâneos
  - Garantir que serviços recebam conexão global sem erro quando não há contexto
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 10.1 Escrever teste de propriedade para transparência de roteamento
  - **Propriedade 3: Transparência de roteamento**
  - **Valida: Requisitos 2.1, 2.2**

- [ ]* 10.2 Escrever teste de propriedade para isolamento entre usuários simultâneos
  - **Propriedade 5: Isolamento entre usuários simultâneos**
  - **Valida: Requisitos 2.5**

- [ ] 11. Implementar isolamento completo de dados
  - Garantir que usuários só acessem dados de suas respectivas organizações
  - Implementar validação de correspondência entre base e usuário
  - Adicionar bloqueio de tentativas de acesso cruzado
  - Implementar logging de eventos de segurança
  - Garantir que logout e expiração de token limpem contexto
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 11.1 Escrever teste de propriedade para isolamento de dados por cliente
  - **Propriedade 6: Isolamento de dados por cliente**
  - **Valida: Requisitos 3.1**

- [ ]* 11.2 Escrever teste de propriedade para validação de correspondência de base
  - **Propriedade 7: Validação de correspondência de base**
  - **Valida: Requisitos 3.2**

- [ ]* 11.3 Escrever teste de propriedade para bloqueio de acesso cruzado
  - **Propriedade 8: Bloqueio de acesso cruzado**
  - **Valida: Requisitos 3.3**

- [ ] 12. Garantir que serviços de autenticação usem base global
  - Verificar que AuthService sempre usa base global
  - Verificar que TokenManager sempre usa base global
  - Garantir que rotas de login/logout usem base global
  - Adicionar testes para confirmar isolamento dos serviços de autenticação
  - Documentar exceções para serviços de autenticação
  - _Requisitos: 1.5, 8.4_

- [ ]* 12.1 Escrever teste de propriedade para serviços de autenticação usam base global
  - **Propriedade 15: Serviços de autenticação usam base global**
  - **Valida: Requisitos 8.4**

- [ ] 13. Implementar direcionamento automático de consultas
  - Garantir que todas as consultas sejam direcionadas automaticamente
  - Implementar interceptação transparente de operações de banco
  - Adicionar logging de direcionamento de consultas
  - Verificar que não há vazamentos entre bases de clientes
  - Implementar métricas de uso por base de dados
  - _Requisitos: 8.5_

- [ ]* 13.1 Escrever teste de propriedade para direcionamento automático de consultas
  - **Propriedade 16: Direcionamento automático de consultas**
  - **Valida: Requisitos 8.5**

- [ ] 14. Implementar logging completo de eventos de roteamento
  - Adicionar logging de criação de conexões específicas
  - Implementar logging de eventos de fallback com motivos
  - Adicionar logging de erros de conexão com detalhes técnicos
  - Implementar logging de acessos múltiplos por usuário
  - Adicionar logging de operações de limpeza com estatísticas
  - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 14.1 Escrever teste de propriedade para logging de eventos de conexão
  - **Propriedade 17: Logging de eventos de conexão**
  - **Valida: Requisitos 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 15. Checkpoint - Garantir que roteamento funciona completamente
  - Garantir que todos os testes passem, perguntar ao usuário se surgirem dúvidas.

- [ ] 16. Implementar tratamento centralizado de erros de contexto
  - Criar ContextErrorHandler para tratar erros de contexto
  - Implementar recuperação automática de contextos corrompidos
  - Adicionar notificações de usuário para problemas temporários
  - Implementar métricas de falhas e recuperações
  - Adicionar alertas para administradores em caso de problemas críticos
  - _Requisitos: 1.4, 7.5, 10.1, 10.2, 10.3_

- [ ]* 16.1 Escrever testes unitários para tratamento de erros
  - Testar recuperação de contexto não encontrado
  - Testar fallback quando base está indisponível
  - Testar limpeza de contexto corrompido
  - Testar notificações de erro para usuário
  - _Requisitos: 1.4, 7.5, 10.1, 10.4_

- [ ] 17. Atualizar todas as rotas para usar middleware de contexto
  - Integrar UserContextMiddleware em todas as rotas protegidas
  - Excluir rotas de autenticação do middleware de contexto
  - Verificar que ordem de middlewares está correta
  - Adicionar tratamento de erros específico para problemas de contexto
  - Implementar logging de uso de middleware
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 17.1 Escrever testes de integração para middleware em rotas
  - Testar fluxo completo: autenticação → contexto → operação → limpeza
  - Testar comportamento com múltiplas requisições simultâneas
  - Testar isolamento entre diferentes usuários
  - _Requisitos: 2.5, 6.1, 6.2, 6.3, 6.4_

- [ ] 18. Implementar monitoramento e métricas
  - Criar dashboard de métricas de uso por base de dados
  - Implementar alertas para falhas de conexão
  - Adicionar métricas de performance de roteamento
  - Implementar relatórios de uso de fallback
  - Criar logs estruturados para análise
  - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 18.1 Escrever testes unitários para sistema de métricas
  - Testar coleta de métricas de conexão
  - Testar geração de alertas
  - Testar relatórios de uso
  - _Requisitos: 9.1, 9.2, 9.3_

- [ ] 19. Criar documentação e guias para desenvolvedores
  - Documentar como usar conexões automáticas em novos serviços
  - Criar guias de migração para serviços existentes
  - Documentar padrões de código e melhores práticas
  - Criar guias de troubleshooting para problemas de roteamento
  - Documentar considerações de segurança e performance
  - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 20. Checkpoint Final - Garantir que todos os testes passem
  - Garantir que todos os testes passem, perguntar ao usuário se surgirem dúvidas.

- [ ] 21. Testes de integração end-to-end
- [ ]* 21.1 Testar fluxo completo de roteamento automático
  - Login → Configuração automática de contexto → Operação em serviço → Verificar base correta → Limpeza
  - _Requisitos: 1.1, 1.2, 6.1, 6.2, 6.3, 6.4_

- [ ]* 21.2 Testar isolamento completo entre clientes
  - Login usuário A → Operação → Verificar dados A → Logout → Login usuário B → Operação → Verificar dados B → Confirmar isolamento
  - _Requisitos: 3.1, 3.2, 3.4_

- [ ]* 21.3 Testar fallback e recuperação resiliente
  - Simular falha na base específica → Verificar fallback automático → Recuperar base → Verificar retomada automática
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 21.4 Testar concorrência e isolamento simultâneo
  - Múltiplos usuários de diferentes clientes → Requisições simultâneas → Verificar isolamento → Verificar performance
  - _Requisitos: 2.5, 3.1_

- [ ]* 21.5 Testar comportamento de serviços específicos
  - DownloadService: Agendar → Verificar base correta → Consultar status → Verificar isolamento
  - FiscalDocumentsService: Consultar documentos → Verificar base correta → Verificar isolamento
  - APILogger: Registrar eventos → Verificar base correta → Verificar fallback
  - _Requisitos: 4.1, 4.2, 5.1, 5.2, 12.1, 12.2_