# 📋 Guia de Configuração - Dashboard NF-e

## 🔧 Variáveis de Ambiente

O sistema utiliza variáveis de ambiente para facilitar a troca entre diferentes clientes/bancos de dados.

### Arquivo `.env`

Todas as configurações sensíveis e específicas do cliente devem estar no arquivo `.env`:

```env
# Configuração da API
VITE_API_BASE_URL=http://apinfe.revio.digital/api
VITE_API_BEARER_TOKEN=seu_token_aqui

# Configuração do Banco de Dados
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100

# Parâmetros Padrão
VITE_DEFAULT_PAGE_SIZE=500
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=365
```

## 🔄 Como Trocar de Cliente

Para trocar de cliente, você precisa alterar apenas 3 variáveis no `.env`:

1. **VITE_DB_DATABASE**: CNPJ do cliente (sem formatação)
2. **VITE_DB_COLLECTION**: Nome da coleção (geralmente `tbl_nfe_100`)
3. **VITE_API_BEARER_TOKEN**: Token de autenticação (se diferente)

### Exemplo:

**Cliente A:**
```env
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100
```

**Cliente B:**
```env
VITE_DB_DATABASE=12345678000190
VITE_DB_COLLECTION=tbl_nfe_100
```

Após alterar, reinicie o servidor:
```bash
npm run dev
```

## 📊 Parâmetros da API

### Endpoint de Consulta
`GET /api/WebView/Consultar`

**Parâmetros Obrigatórios:**
- `host`: Host do banco (ex: 10.0.0.8)
- `database`: CNPJ do cliente
- `collection`: Nome da coleção
- `dtIni`: Data inicial (YYYY-MM-DD)
- `dtFin`: Data final (YYYY-MM-DD)
- `pg`: Número da página
- `size`: Registros por página

**Parâmetros Opcionais:**
- `cnpjEmit`: CNPJ do emitente
- `cnpjDest`: CNPJ do destinatário

### Endpoint de Contador
`GET /api/WebView/ContadorConsulta`

**Parâmetros:**
- `host`: Host do banco
- `database`: CNPJ do cliente
- `collection`: Nome da coleção
- `dtIni`: Data inicial
- `dtFin`: Data final
- `cnpjEmit`: CNPJ do emitente (opcional)
- `cnpjDest`: CNPJ do destinatário (opcional)

## 🔐 Autenticação

O sistema utiliza Bearer Token para autenticação. O token deve ser configurado na variável:

```env
VITE_API_BEARER_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

## ⚠️ Validações

O sistema valida automaticamente:
- ✅ Presença de variáveis obrigatórias
- ✅ Período máximo de 1 ano entre datas
- ✅ Formato de datas (YYYY-MM-DD)

## 🚀 Múltiplos Ambientes

Você pode criar múltiplos arquivos de ambiente:

- `.env.development` - Desenvolvimento
- `.env.production` - Produção
- `.env.cliente1` - Cliente específico
- `.env.cliente2` - Cliente específico

Para usar um ambiente específico:
```bash
# Windows
copy .env.cliente1 .env
npm run dev

# Linux/Mac
cp .env.cliente1 .env
npm run dev
```

## 📝 Checklist de Configuração

Antes de iniciar o sistema, verifique:

- [ ] Arquivo `.env` criado
- [ ] `VITE_API_BEARER_TOKEN` configurado
- [ ] `VITE_DB_HOST` configurado
- [ ] `VITE_DB_DATABASE` configurado (CNPJ do cliente)
- [ ] `VITE_DB_COLLECTION` configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor iniciado (`npm run dev`)

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se todas as variáveis obrigatórias estão preenchidas

### Erro: "401 Unauthorized"
- Verifique se o `VITE_API_BEARER_TOKEN` está correto
- O token pode ter expirado, solicite um novo

### Erro: "Nenhuma nota encontrada"
- Verifique se o `VITE_DB_DATABASE` (CNPJ) está correto
- Verifique se o `VITE_DB_COLLECTION` existe no banco
- Verifique o período de datas selecionado

## 📞 Suporte

Para mais informações sobre a API, consulte a documentação oficial ou entre em contato com o suporte técnico.
