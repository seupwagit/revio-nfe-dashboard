# ⚡ Início Rápido - SpedRevio Dashboard

## 🎯 Setup em 3 Passos

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Configurar Ambiente
```bash
# Copiar arquivo de exemplo
copy .env.example .env
```

Edite o `.env` e configure:
```env
VITE_API_BEARER_TOKEN=seu_token_aqui
VITE_DB_DATABASE=seu_cnpj_aqui
VITE_DB_COLLECTION=tbl_nfe_100
```

### 3️⃣ Iniciar
```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 🎨 Páginas Disponíveis

| Página | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | Estatísticas e resumo |
| Notas Fiscais | `/notas` | Listagem em cards |
| Grid Completa | `/notas-grid` | Tabela com filtros avançados |
| Detalhes | `/notas/:id` | Visualização detalhada |

## 🔑 Variáveis Obrigatórias

```env
VITE_API_BEARER_TOKEN    # Token de autenticação
VITE_DB_HOST             # Host do banco (ex: 10.0.0.8)
VITE_DB_DATABASE         # CNPJ do cliente
VITE_DB_COLLECTION       # Nome da coleção
```

## 🔄 Trocar de Cliente

Edite apenas 1 linha no `.env`:
```env
VITE_DB_DATABASE=NOVO_CNPJ_AQUI
```

Reinicie o servidor:
```bash
# Ctrl+C para parar
npm run dev
```

## 📊 Funcionalidades Principais

✅ **Dashboard**
- Total de notas
- Valor total
- Notas autorizadas/canceladas
- Taxa de autorização

✅ **Grid Completa (TanStack Table)**
- Ordenação por colunas
- Filtros avançados (datas, CNPJ)
- Busca rápida
- Paginação
- Contador de registros

✅ **Detalhes**
- Dados completos da nota
- Lista de itens
- Chave de acesso

## 🎯 Uso Básico

1. Acesse **Grid Completa**
2. Ajuste as datas (padrão: último mês)
3. Clique em **Consultar**
4. Ordene clicando nas colunas
5. Clique no ícone 👁️ para ver detalhes

## 📚 Documentação Completa

- `README.md` - Visão geral do projeto
- `CONFIGURACAO.md` - Guia detalhado de configuração
- `ESTRUTURA_PROJETO.md` - Arquitetura e organização
- `EXEMPLOS_USO.md` - Casos de uso e exemplos

## 🐛 Problemas Comuns

**Erro: "Variáveis não configuradas"**
→ Configure o arquivo `.env`

**Erro: "401 Unauthorized"**
→ Verifique o `VITE_API_BEARER_TOKEN`

**"Nenhuma nota encontrada"**
→ Verifique o `VITE_DB_DATABASE` (CNPJ)

## 🚀 Pronto!

Seu dashboard está configurado e pronto para uso!

Para mais detalhes, consulte a documentação completa.
