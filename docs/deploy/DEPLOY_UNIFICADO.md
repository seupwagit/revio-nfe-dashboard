# Documentação do Deploy Unificado - Revio NFe Dashboard

Este documento descreve o funcionamento dos scripts de deploy unificado para a aplicação AppDox.

## Visão Geral

O sistema de deploy foi migrado para um modelo unificado, onde um único "bundle" (pacote) contém o frontend, o backend e as dependências compartilhadas. Isso elimina conflitos de rota no Nginx e simplifica a gestão do servidor remoto.

## Scripts

### 1. Script Local: `scripts/deploy-appdox.ps1`

Este script deve ser executado na máquina local (Windows PowerShell) para preparar e enviar a aplicação.

**O que ele faz:**
1. **Build Unificado**: Executa `pnpm run build` na raiz do monorepo, gerando os artefatos de `shared`, `backend` e `frontend`.
2. **Criação do Bundle**: Cria uma pasta temporária e organiza os arquivos:
    - `dist/`: Frontend (Vite build)
    - `apps/backend/dist/`: Backend (TSC build)
    - `packages/shared/dist/`: Dependências compartilhadas
    - `prisma/`: Schema do banco de dados
    - `.env`, `package.json`, `pnpm-workspace.yaml`: Configurações de infraestrutura
3. **Otimização (Exclusão)**: Compacta o bundle ignorando rigorosamente:
    - Pastas `cypress`, `tests`, `__tests__`
    - Arquivos `*.test.ts`, `*.spec.ts`, `*.test.js`, `*.spec.js`
    - Pasta `node_modules` local (será instalada remotamente)
4. **SCP**: Envia o arquivo `appdox-deploy-bundle.tar.gz` para o diretório `/tmp` do servidor.
5. **SSH**: Executa o script de configuração remota.

---

### 2. Script Remoto: `scripts/setup-remote-nginx.sh`

Este script é executado via SSH no servidor Ubuntu.

**O que ele faz:**
1. **Extração**: Limpa o diretório de destino (`/data/nginx/www/appdox.revio.digital`) e extrai o bundle.
2. **Porta Dinâmica**: Lê a variável `BACKOFFICE_PORT` ou `PORT` do arquivo `.env` extraído.
3. **Instalação**: Executa `pnpm install --shamefully-hoist` para garantir que todas as dependências do monorepo sejam instaladas corretamente no servidor.
4. **Prisma**: Executa `npx prisma generate` na raiz para sincronizar o cliente do banco de dados.
5. **Nginx**:
    - Cria/Atualiza o snippet de configuração com Proxy Reverso apontando para a porta dinâmica.
    - Configura a pasta `root` para o diretório `dist` do frontend.
    - Habilita o redirecionamento SPA (Single Page Application).
6. **PM2**: Reinicia o processo `appdox-backend` usando o PM2 para garantir alta disponibilidade.
7. **SSL**: Valida/Configura certificados SSL via Certbot.

## Como Usar

1. Certifique-se de que o arquivo `.env` na raiz do projeto local contém as configurações corretas (DB, Portas, URLs).
2. Abra o PowerShell na raiz do projeto.
3. Execute:
   ```powershell
   .\scripts\deploy-appdox.ps1
   ```
4. Acompanhe os logs. Se o health check final exibir "Deploy realizado com sucesso!", a aplicação estará online em [https://appdox.revio.digital](https://appdox.revio.digital).

## Considerações de Segurança
- As exclusões de pastas de teste evitam que códigos sensíveis ou pesados de ambiente de desenvolvimento cheguem à produção.
- O uso de `shamefully-hoist` no pnpm resolve problemas de dependências "fantasmas" comuns em monorepos sem necessidade de configurações complexas no servidor.
