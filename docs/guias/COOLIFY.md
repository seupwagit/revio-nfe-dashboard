# Deploy no Coolify

Este guia mostra como fazer deploy do NF Dashboard no Coolify.

## Pré-requisitos

- Conta no Coolify
- Repositório Git (GitHub, GitLab, etc.)
- Variáveis de ambiente configuradas

## 1. Preparar o Repositório

Certifique-se de que os seguintes arquivos estão no repositório:

- ✅ `Dockerfile`
- ✅ `nginx.conf`
- ✅ `.dockerignore`
- ✅ `docker-compose.yml` (opcional)
- ✅ `.env.production`

## 2. Configurar no Coolify

### 2.1. Criar Novo Projeto

1. Acesse o Coolify
2. Clique em **"New Resource"**
3. Selecione **"Application"**
4. Escolha **"Public Repository"** ou **"Private Repository"**

### 2.2. Configurar Repositório

- **Repository URL**: `https://github.com/seu-usuario/nf-dashboard`
- **Branch**: `main` ou `master`
- **Build Pack**: Selecione **"Dockerfile"**

### 2.3. Configurar Build

- **Dockerfile Location**: `./Dockerfile` (padrão)
- **Docker Compose File**: `./docker-compose.yml` (opcional)
- **Port**: `80` (porta interna do container)

### 2.4. Configurar Domínio

1. Vá em **"Domains"**
2. Adicione seu domínio: `nf-dashboard.seu-dominio.com`
3. O Coolify vai configurar SSL automaticamente com Let's Encrypt

### 2.5. Configurar Variáveis de Ambiente

Vá em **"Environment Variables"** e adicione:

```env
VITE_API_BASE_URL=https://apinfe.revio.digital/api
VITE_API_BEARER_TOKEN=seu_token_aqui
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100
VITE_DEFAULT_PAGE_SIZE=500
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=365
```

**Importante**: As variáveis `VITE_*` precisam estar disponíveis no **build time**, não apenas no runtime.

## 3. Deploy

1. Clique em **"Deploy"**
2. O Coolify vai:
   - Clonar o repositório
   - Fazer build da imagem Docker
   - Iniciar o container
   - Configurar SSL
   - Expor a aplicação no domínio configurado

## 4. Configuração Avançada

### 4.1. Build Arguments

Se precisar passar argumentos no build, adicione em **"Build Arguments"**:

```
NODE_ENV=production
```

### 4.2. Health Check

O Dockerfile já inclui um health check. O Coolify vai monitorar automaticamente.

### 4.3. Recursos

Configure os recursos do container:

- **CPU**: 0.5 cores (recomendado)
- **Memory**: 512MB (recomendado)

### 4.4. Auto Deploy

Ative **"Auto Deploy"** para fazer deploy automático quando houver push no repositório.

## 5. Verificar Deploy

Após o deploy:

1. Acesse o domínio configurado
2. Verifique os logs em **"Logs"**
3. Verifique o status em **"Status"**

## 6. Comandos Úteis

### Ver Logs

No Coolify, vá em **"Logs"** ou use a CLI:

```bash
coolify logs nf-dashboard
```

### Restart

```bash
coolify restart nf-dashboard
```

### Rebuild

```bash
coolify rebuild nf-dashboard
```

## 7. Troubleshooting

### Build falha

**Problema**: Erro durante o build

**Solução**:
1. Verifique os logs de build no Coolify
2. Certifique-se de que o `Dockerfile` está correto
3. Verifique se as dependências estão no `package.json`

### Variáveis de ambiente não funcionam

**Problema**: Variáveis `VITE_*` não estão disponíveis

**Solução**:
1. As variáveis `VITE_*` precisam estar disponíveis no **build time**
2. No Coolify, marque as variáveis como **"Build Time"**
3. Faça rebuild da aplicação

### Página em branco

**Problema**: Aplicação carrega mas mostra página em branco

**Solução**:
1. Verifique o console do navegador (F12)
2. Verifique se as variáveis de ambiente estão corretas
3. Verifique se a API está acessível
4. Verifique os logs do container

### SSL não funciona

**Problema**: HTTPS não está funcionando

**Solução**:
1. Verifique se o domínio aponta para o servidor Coolify
2. Aguarde alguns minutos para o SSL ser provisionado
3. Verifique em **"Domains"** se o SSL está ativo

### Container reinicia constantemente

**Problema**: Container não fica estável

**Solução**:
1. Verifique os logs do container
2. Verifique o health check
3. Aumente os recursos (CPU/Memory)

## 8. Atualizar Aplicação

Para atualizar a aplicação:

1. Faça push das mudanças no repositório
2. Se **"Auto Deploy"** estiver ativo, o deploy será automático
3. Caso contrário, clique em **"Deploy"** manualmente

## 9. Rollback

Se algo der errado:

1. Vá em **"Deployments"**
2. Selecione um deploy anterior
3. Clique em **"Redeploy"**

## 10. Monitoramento

O Coolify oferece:

- **Logs em tempo real**
- **Métricas de CPU e memória**
- **Status do health check**
- **Histórico de deploys**

## 11. Backup

Configure backup automático:

1. Vá em **"Backups"**
2. Configure frequência e retenção
3. O Coolify vai fazer backup do container e volumes

## 12. Múltiplos Ambientes

Para ter staging e produção:

1. Crie dois projetos no Coolify
2. Use branches diferentes:
   - `main` → Produção
   - `develop` → Staging
3. Configure variáveis de ambiente diferentes

## Recursos Adicionais

- [Documentação Coolify](https://coolify.io/docs)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Nginx Configuration](https://nginx.org/en/docs/)
