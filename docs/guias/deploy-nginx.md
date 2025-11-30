# Deploy do Projeto no Nginx com SSL Let's Encrypt

## 1. Build do Projeto

```bash
# Instalar dependências
npm install

# Criar build de produção
npm run build
```

Isso vai gerar a pasta `dist/` com os arquivos estáticos.

## 2. Instalar Nginx (se ainda não tiver)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# Verificar se está rodando
sudo systemctl status nginx
```

## 3. Configurar Nginx

Crie o arquivo de configuração do site:

```bash
sudo nano /etc/nginx/sites-available/nf-dashboard
```

Cole a configuração inicial (sem SSL):

```nginx
server {
    listen 80;
    server_name nf-dashboard.sistemasflow.com.br www.nf-dashboard.sistemasflow.com.br;

    root /data/nginx/www/nf-dashboard;
    index index.html;

    # Logs
    access_log /var/log/nginx/nf-dashboard-access.log;
    error_log /var/log/nginx/nf-dashboard-error.log;

    # Servir arquivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

## 4. Copiar arquivos do build

```bash
# Criar diretório
sudo mkdir -p /data/nginx/www/nf-dashboard

# Copiar arquivos do build
sudo cp -r dist/* /data/nginx/www/nf-dashboard/

# Ajustar permissões
sudo chown -R www-data:www-data /data/nginx/www/nf-dashboard
sudo chmod -R 755 /data/nginx/www/nf-dashboard
```

## 5. Ativar o site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/nf-dashboard /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## 6. Instalar Certbot (Let's Encrypt)

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# Verificar instalação
certbot --version
```

## 7. Obter Certificado SSL

```bash
# Obter e instalar certificado automaticamente
sudo certbot --nginx -d nf-dashboard.sistemasflow.com.br -d www.nf-dashboard.sistemasflow.com.br

# Seguir as instruções:
# 1. Informar email
# 2. Aceitar termos
# 3. Escolher se quer redirecionar HTTP para HTTPS (recomendado: sim)
```

O Certbot vai:
- Obter o certificado
- Modificar automaticamente a configuração do Nginx
- Configurar renovação automática

## 8. Configuração Final do Nginx (após SSL)

O Certbot vai modificar o arquivo, mas você pode ajustar manualmente:

```bash
sudo nano /etc/nginx/sites-available/nf-dashboard
```

Configuração completa com SSL:

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name nf-dashboard.sistemasflow.com.br www.nf-dashboard.sistemasflow.com.br;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name nf-dashboard.sistemasflow.com.br www.nf-dashboard.sistemasflow.com.br;

    # SSL configurado pelo Certbot
    ssl_certificate /etc/letsencrypt/live/nf-dashboard.sistemasflow.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nf-dashboard.sistemasflow.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /data/nginx/www/nf-dashboard;
    index index.html;

    # Logs
    access_log /var/log/nginx/nf-dashboard-access.log;
    error_log /var/log/nginx/nf-dashboard-error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Servir arquivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

## 9. Testar e Recarregar

```bash
# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## 10. Verificar Renovação Automática

```bash
# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Ver status dos certificados
sudo certbot certificates
```

O Certbot cria um cron job automático para renovar os certificados antes de expirarem (90 dias).

## 11. Configurar Variáveis de Ambiente

Crie um arquivo `.env.production` na raiz do projeto:

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

E faça o build novamente:

```bash
npm run build
```

## 12. Script de Deploy Automático

Crie um script `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Iniciando deploy..."

# Build
echo "📦 Criando build..."
npm run build

# Backup do deploy anterior
echo "💾 Fazendo backup..."
sudo cp -r /data/nginx/www/nf-dashboard /data/nginx/www/nf-dashboard.backup.$(date +%Y%m%d_%H%M%S)

# Copiar novos arquivos
echo "📂 Copiando arquivos..."
sudo rm -rf /data/nginx/www/nf-dashboard/*
sudo cp -r dist/* /data/nginx/www/nf-dashboard/

# Ajustar permissões
echo "🔐 Ajustando permissões..."
sudo chown -R www-data:www-data /data/nginx/www/nf-dashboard
sudo chmod -R 755 /data/nginx/www/nf-dashboard

# Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deploy concluído!"
```

Tornar executável:

```bash
chmod +x deploy.sh
```

## 13. Comandos Úteis

```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/nf-dashboard-access.log
sudo tail -f /var/log/nginx/nf-dashboard-error.log

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver status do Nginx
sudo systemctl status nginx

# Renovar certificado manualmente
sudo certbot renew

# Testar SSL
curl -I https://nf-dashboard.sistemasflow.com.br
```

## 14. Firewall (se necessário)

```bash
# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'

# Verificar status
sudo ufw status
```

## Troubleshooting

### Erro 502 Bad Gateway
- Verificar se o Nginx está rodando: `sudo systemctl status nginx`
- Verificar logs: `sudo tail -f /var/log/nginx/error.log`

### Erro 403 Forbidden
- Verificar permissões: `ls -la /data/nginx/www/nf-dashboard`
- Ajustar: `sudo chown -R www-data:www-data /data/nginx/www/nf-dashboard`

### Certificado SSL não funciona
- Verificar se o domínio aponta para o servidor
- Verificar firewall: `sudo ufw status`
- Verificar logs do Certbot: `sudo certbot certificates`

### Página em branco
- Verificar se o build foi feito corretamente
- Verificar console do navegador (F12)
- Verificar se as variáveis de ambiente estão corretas
