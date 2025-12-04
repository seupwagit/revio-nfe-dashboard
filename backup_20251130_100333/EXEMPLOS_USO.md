# 💡 Exemplos de Uso - Dashboard NF-e

## 🚀 Início Rápido

### 1. Instalação e Configuração

```bash
# Clone o repositório
git clone <seu-repositorio>
cd nf-dashboard

# Instale as dependências
npm install

# Configure o ambiente
copy .env.example .env

# Edite o .env com suas credenciais
# VITE_API_BEARER_TOKEN=seu_token_aqui
# VITE_DB_DATABASE=seu_cnpj_aqui
# VITE_DB_COLLECTION=tbl_nfe_100

# Inicie o servidor
npm run dev
```

### 2. Acesse a Aplicação

Abra o navegador em: `http://localhost:5173`

## 📊 Cenários de Uso

### Cenário 1: Consultar Notas do Último Mês

1. Acesse a página **Grid Completa**
2. As datas já vêm preenchidas com o último mês
3. Clique em **Consultar**
4. Visualize as notas na grid

### Cenário 2: Filtrar por CNPJ Específico

1. Acesse **Grid Completa**
2. Preencha o campo **CNPJ Emitente** ou **CNPJ Destinatário**
3. Ajuste as datas se necessário
4. Clique em **Consultar**

**Exemplo:**
```
CNPJ Emitente: 12.345.678/0001-90
Data Início: 2025-01-01
Data Fim: 2025-01-31
```

### Cenário 3: Ordenar Resultados

1. Na grid, clique no cabeçalho de qualquer coluna
2. Primeira clique: ordem crescente ↑
3. Segundo clique: ordem decrescente ↓
4. Terceiro clique: remove ordenação

**Colunas ordenáveis:**
- Número
- Data Emissão
- Status
- Emitente
- Destinatário
- Valor Total

### Cenário 4: Busca Rápida na Tabela

1. Use o campo de busca acima da tabela
2. Digite o nome do emitente
3. A tabela filtra automaticamente

**Exemplo:**
```
Buscar: "EMPRESA EXEMPLO"
```

### Cenário 5: Ver Detalhes de uma Nota

1. Na listagem ou grid, clique no ícone 👁️ (olho)
2. Ou clique no card da nota
3. Visualize todos os detalhes:
   - Dados do emitente
   - Dados do destinatário
   - Itens da nota
   - Chave de acesso

### Cenário 6: Paginação

1. Use os botões de navegação no rodapé da grid:
   - `<<` Primeira página
   - `<` Página anterior
   - `>` Próxima página
   - `>>` Última página
2. Ou digite o número da página desejada

### Cenário 7: Alterar Quantidade de Registros

1. No campo **Registros por Página**, selecione:
   - 50 registros
   - 100 registros
   - 250 registros
   - 500 registros (padrão)
2. Clique em **Consultar**

## 🔄 Trocar de Cliente

### Exemplo: Cliente A → Cliente B

**Cliente A (Atual):**
```env
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100
```

**Cliente B (Novo):**
```env
VITE_DB_DATABASE=12345678000190
VITE_DB_COLLECTION=tbl_nfe_100
```

**Passos:**
1. Pare o servidor (Ctrl+C)
2. Edite o arquivo `.env`
3. Altere `VITE_DB_DATABASE` para o novo CNPJ
4. Reinicie o servidor: `npm run dev`
5. Recarregue a página no navegador

## 🎯 Casos de Uso Avançados

### Consulta com Múltiplos Filtros

```
Data Início: 2025-01-01
Data Fim: 2025-03-31
CNPJ Emitente: 12.345.678/0001-90
CNPJ Destinatário: 98.765.432/0001-10
Registros: 100
```

### Análise de Período Específico

1. Acesse **Dashboard**
2. Visualize estatísticas gerais
3. Acesse **Grid Completa**
4. Filtre por período específico
5. Ordene por valor total (decrescente)
6. Identifique maiores notas do período

### Exportar Dados (Futuro)

*Funcionalidade planejada para próximas versões*

## 🔧 Personalização

### Alterar Período Padrão

Edite `src/services/api.ts`:

```typescript
function getDefaultStartDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 3) // 3 meses ao invés de 1
  return date.toISOString().split('T')[0]
}
```

### Alterar Tamanho Padrão da Página

Edite `.env`:

```env
VITE_DEFAULT_PAGE_SIZE=100
```

### Adicionar Nova Coluna na Grid

Edite `src/pages/NotasFiscaisGrid.tsx`:

```typescript
{
  accessorKey: 'chaveAcesso',
  header: 'Chave de Acesso',
  cell: info => (
    <code className="text-xs">
      {(info.getValue() as string).substring(0, 20)}...
    </code>
  ),
}
```

## 📱 Uso Mobile

O sistema é responsivo e funciona em dispositivos móveis:

1. **Menu**: Clique no ícone ☰ para abrir/fechar
2. **Tabela**: Role horizontalmente para ver todas as colunas
3. **Filtros**: Empilham verticalmente em telas pequenas

## ⚡ Dicas de Performance

1. **Use filtros específicos**: Quanto mais específico, mais rápido
2. **Limite o período**: Períodos menores carregam mais rápido
3. **Ajuste o tamanho da página**: Menos registros = mais rápido
4. **Use CNPJ quando possível**: Reduz drasticamente os resultados

## 🐛 Resolução de Problemas Comuns

### "Nenhuma nota encontrada"

**Possíveis causas:**
- Período sem notas emitidas
- CNPJ incorreto
- Filtros muito restritivos

**Solução:**
1. Amplie o período de datas
2. Remova filtros de CNPJ
3. Verifique se o banco de dados está correto

### "Erro ao carregar dados"

**Possíveis causas:**
- Token expirado
- Banco de dados incorreto
- Problemas de rede

**Solução:**
1. Verifique o console do navegador (F12)
2. Atualize o token no `.env`
3. Verifique a conexão com a internet
4. Verifique se o host está acessível

### Tabela não ordena corretamente

**Solução:**
- Clique novamente no cabeçalho da coluna
- Recarregue a página
- Limpe o cache do navegador

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação completa
2. Verifique os logs do console (F12)
3. Entre em contato com o suporte técnico

## 🎓 Próximos Passos

Após dominar o básico:
1. Explore todas as funcionalidades da grid
2. Experimente diferentes combinações de filtros
3. Analise os dados no dashboard
4. Configure múltiplos ambientes para diferentes clientes
