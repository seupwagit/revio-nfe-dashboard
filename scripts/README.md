# Scripts

Esta pasta contém todos os scripts de automação, utilitários e ferramentas do projeto.

## Estrutura

### Scripts de Inicialização
- `start-fullstack.bat` - Inicia o servidor fullstack no Windows
- `start-fullstack.sh` - Inicia o servidor fullstack no Linux/Mac
- `start-fullstack-simple.sh` - Versão simplificada para Linux/Mac
- `start.sh` - Script de inicialização genérico

### Scripts de Manutenção
- `restart-fullstack.bat` - Reinicia o servidor fullstack
- `rebuild-and-restart.bat` - Reconstrói e reinicia o projeto
- `organize-docs.bat` - Organiza documentação
- `organize-files.bat` - Organiza arquivos do projeto

### Servidores
- `mongodb-proxy.ts` - Servidor proxy para MongoDB
- `backoffice.cjs` - Servidor de backoffice
- `aggregation-server.cjs` - Servidor de agregação
- `aggregation-proxy.cjs` - Proxy para agregação
- `proxy-server.cjs` - Servidor proxy genérico

### Utilitários de Debug
- `debug-auth.cjs` - Debug de autenticação
- `debug-cache-chrome.js` - Debug de cache no Chrome
- `check-cache.mjs` - Verificação de cache
- `chrome-debug-watcher.md` - Documentação de debug

### Ferramentas de Desenvolvimento
- `create-test-user.js` - Criação de usuário de teste
- `fix-typescript-errors.sh` - Correção de erros TypeScript
- `update-port-references.sh` - Atualização de referências de porta

### Organização
- `organizar-docs.cjs` - Organizador de documentação
- `organizar-projeto.cjs` - Organizador do projeto
- `organize-remaining.bat` - Organização de arquivos restantes

### Utilitários Web
- `limpar-cache-corrompido.html` - Ferramenta web para limpeza de cache

### Subpastas
- `analysis/` - Scripts de análise
- `monitoring/` - Scripts de monitoramento
- `testing/` - Scripts de teste
- `validation/` - Scripts de validação
- `windows/` - Scripts específicos do Windows

## Como Usar

### Iniciar o Projeto

```bash
# Windows
npm run fullstack

# Linux/Mac
./scripts/start-fullstack.sh
```

### Reiniciar o Servidor

```bash
npm run fullstack:restart
```

### Debug de Autenticação

```bash
node scripts/debug-auth.cjs
```

### Verificar Cache

```bash
npm run debug:cache
```

## Notas

- Todos os scripts foram movidos para esta pasta para melhor organização
- Os caminhos no `package.json` foram atualizados automaticamente
- A documentação foi atualizada para refletir os novos caminhos