# 🧪 Teste Manual - Verificação das 3 Collections

## 📋 Checklist de Teste

### Passo 1: Acessar o Sistema
- [ ] Abrir navegador
- [ ] Acessar: http://localhost:5173
- [ ] Verificar se a página carrega sem erros

### Passo 2: Navegar até Notas Fiscais
- [ ] Clicar no menu "Notas Fiscais"
- [ ] Verificar se a página "Notas Fiscais Eletrônicas (NF-e)" aparece

### Passo 3: Testar NF-e (tbl_nfe_100)
- [ ] Verificar se o botão "📄 NF-e" está selecionado (azul)
- [ ] Verificar se a grid carrega dados
- [ ] Verificar colunas visíveis:
  - [ ] Número
  - [ ] Série
  - [ ] Chave de Acesso
  - [ ] Data Emissão
  - [ ] CNPJ Emitente
  - [ ] Razão Social Emitente
  - [ ] CNPJ Destinatário
  - [ ] Valor Total
  - [ ] Status
- [ ] Verificar contador: "X registro(s) encontrado(s)"
- [ ] Testar ordenação clicando em "Número"
- [ ] Testar paginação (botões Anterior/Próxima)

### Passo 4: Testar CF-e (tbl_cfe_100)
- [ ] Clicar no botão "🧾 CF-e"
- [ ] Verificar se o título muda para "Cupons Fiscais Eletrônicos (CF-e/SAT)"
- [ ] Verificar se a grid muda automaticamente
- [ ] Verificar colunas específicas de CF-e:
  - [ ] Número SAT
  - [ ] CPF/CNPJ Cliente
  - [ ] Nome Cliente
  - [ ] Descontos
  - [ ] Acréscimos
  - [ ] Formas de Pagamento
- [ ] Verificar se os dados são diferentes dos de NF-e
- [ ] Verificar contador atualizado

### Passo 5: Testar CT-e (tbl_cte_100)
- [ ] Clicar no botão "🚚 CT-e"
- [ ] Verificar se o título muda para "Conhecimentos de Transporte Eletrônicos (CT-e)"
- [ ] Verificar se a grid muda automaticamente
- [ ] Verificar colunas específicas de CT-e:
  - [ ] Tipo Serviço
  - [ ] CNPJ Tomador
  - [ ] CNPJ Remetente
  - [ ] CNPJ Destinatário
  - [ ] Produto/Carga
  - [ ] Peso (kg)
  - [ ] Placa
  - [ ] CPF Motorista
  - [ ] Nome Motorista
  - [ ] Valor Serviço
- [ ] Verificar se os dados são diferentes dos anteriores
- [ ] Verificar contador atualizado

### Passo 6: Testar Filtros
- [ ] Selecionar uma data início (ex: 01/11/2024)
- [ ] Selecionar uma data fim (ex: 27/11/2024)
- [ ] Clicar em "Aplicar Filtros"
- [ ] Verificar se a grid recarrega
- [ ] Verificar se o contador muda
- [ ] Clicar em "Limpar"
- [ ] Verificar se os filtros são limpos

### Passo 7: Testar Exportação Excel
- [ ] Clicar no botão "Exportar Excel (X)"
- [ ] Verificar se o arquivo .xlsx é baixado
- [ ] Abrir o arquivo no Excel/LibreOffice
- [ ] Verificar se os dados estão corretos
- [ ] Verificar se todas as colunas foram exportadas

### Passo 8: Verificar Console do Navegador
- [ ] Abrir DevTools (F12)
- [ ] Ir na aba "Console"
- [ ] Verificar se há logs de requisição:
  ```
  🚀 REQUISIÇÃO API
  Method: GET
  URL: /WebView/Consultar
  ```
- [ ] Verificar se há logs de resposta:
  ```
  ✅ RESPOSTA API
  Status: 200 OK
  ```
- [ ] Verificar se NÃO há erros em vermelho

### Passo 9: Verificar Network (Rede)
- [ ] Ir na aba "Network" do DevTools
- [ ] Trocar entre as collections (NF-e → CF-e → CT-e)
- [ ] Verificar requisições para:
  - [ ] `/api/WebView/Consultar?collection=tbl_nfe_100`
  - [ ] `/api/WebView/Consultar?collection=tbl_cfe_100`
  - [ ] `/api/WebView/Consultar?collection=tbl_cte_100`
- [ ] Verificar se todas retornam Status 200

### Passo 10: Testar Responsividade
- [ ] Redimensionar janela do navegador
- [ ] Verificar se a grid tem scroll horizontal
- [ ] Verificar se os botões se adaptam
- [ ] Verificar se os filtros se reorganizam

## 🎯 Resultado Esperado

### ✅ Sucesso se:
1. As 3 collections carregam dados diferentes
2. Cada grid mostra campos específicos do tipo de documento
3. Todas as requisições retornam Status 200
4. Não há erros no console
5. A exportação Excel funciona
6. Os filtros aplicam corretamente
7. A paginação funciona
8. A ordenação funciona

### ❌ Falha se:
1. Alguma collection não carrega dados
2. Erro 401 (token expirado)
3. Erro 404 (endpoint não encontrado)
4. Erro 500 (erro no servidor)
5. Dados não aparecem na grid
6. Console mostra erros em vermelho

## 📸 Capturas Recomendadas

Tire screenshots de:
1. Grid de NF-e com dados
2. Grid de CF-e com dados
3. Grid de CT-e com dados
4. Console mostrando logs de sucesso
5. Network mostrando Status 200

## 🔍 Verificação nos Logs do Servidor

Enquanto testa, observe o terminal onde está rodando o proxy:

```bash
# Você deve ver logs como:
🔄 PROXY - Requisição interceptada:
  URL: /api/WebView/Consultar?collection=tbl_nfe_100
  ✅ Authorization: Bearer eyJhbGci...
📥 PROXY - Resposta recebida:
  Status: 200
```

## ✅ Confirmação Final

Após completar todos os passos, você terá confirmado que:

✅ **tbl_nfe_100** está sendo consumida corretamente
✅ **tbl_cfe_100** está sendo consumida corretamente
✅ **tbl_cte_100** está sendo consumida corretamente

---

**Tempo estimado**: 10-15 minutos
**Dificuldade**: Fácil
**Pré-requisito**: Servidores rodando (proxy + vite)
