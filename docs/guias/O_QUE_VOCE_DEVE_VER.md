# 👀 O Que Você Deve Ver no Sistema

## 🖥️ Tela Principal - Notas Fiscais

### Cabeçalho
```
╔════════════════════════════════════════════════════════════╗
║  Notas Fiscais Eletrônicas (NF-e)                         ║
║  Consulta e gerenciamento de documentos fiscais           ║
╚════════════════════════════════════════════════════════════╝
```

### Seletor de Collections (3 Botões)
```
┌──────────────────┬──────────────────┬──────────────────┐
│  📄 NF-e         │  🧾 CF-e         │  🚚 CT-e         │
│  Notas Fiscais   │  Cupons Fiscais  │  Conhecimentos   │
│  Eletrônicas     │  Eletrônicos     │  de Transporte   │
└──────────────────┴──────────────────┴──────────────────┘
```
- O botão selecionado fica **azul** com borda destacada
- Os outros ficam cinza claro

### Filtros
```
┌─────────────────────────────────────────────────────────┐
│  🔍 Filtros                                             │
├─────────────────────────────────────────────────────────┤
│  📅 Data Início    │  📅 Data Fim                       │
│  [01/11/2024]     │  [27/11/2024]                      │
│                   │                                     │
│  🏢 CNPJ Emitente │  🏢 CNPJ Destinatário              │
│  [____________]   │  [____________]                    │
│                   │                                     │
│  [🔍 Aplicar Filtros]  [❌ Limpar]                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Grid de NF-e (tbl_nfe_100)

### Barra de Ações
```
┌─────────────────────────────────────────────────────────┐
│  150 registro(s) encontrado(s)    [📥 Exportar Excel]  │
└─────────────────────────────────────────────────────────┘
```

### Tabela (exemplo com 3 registros)
```
┌────────┬───────┬──────────────────┬────────────┬─────────────────┬──────────────┐
│ Número │ Série │ Chave de Acesso  │ Data       │ CNPJ Emitente   │ Valor Total  │
├────────┼───────┼──────────────────┼────────────┼─────────────────┼──────────────┤
│ 12345  │  1    │ 35240567624...   │ 15/11/2024 │ 67.624.577/...  │ R$ 1.250,00  │
│ 12346  │  1    │ 35240567624...   │ 16/11/2024 │ 67.624.577/...  │ R$ 2.340,50  │
│ 12347  │  1    │ 35240567624...   │ 17/11/2024 │ 67.624.577/...  │ R$ 890,75    │
└────────┴───────┴──────────────────┴────────────┴─────────────────┴──────────────┘
```

### Colunas Visíveis (scroll horizontal)
- Número ⬆️⬇️ (ordenável)
- Série
- Modelo
- Chave de Acesso (44 caracteres)
- Data Emissão ⬆️⬇️ (ordenável)
- Natureza Operação
- Tipo Operação
- CNPJ Emitente
- Razão Social Emitente
- Nome Fantasia Emitente
- IE Emitente
- Município Emitente
- UF Emitente
- CNPJ Destinatário
- Razão Social Destinatário
- IE Destinatário
- Município Destinatário
- UF Destinatário
- Base Cálculo
- ICMS
- IPI
- PIS
- COFINS
- Frete
- Seguro
- Desconto
- Outros
- Valor Total ⬆️⬇️ (ordenável)
- Modalidade Frete
- Transportadora
- Placa
- Forma Pagamento
- Status (badge colorido)
- Ações (👁️ ícone de visualizar)

### Paginação
```
┌─────────────────────────────────────────────────────────┐
│  Mostrando 1 a 20 de 150 registros                      │
│                          [◀ Anterior]  [Próxima ▶]      │
└─────────────────────────────────────────────────────────┘
```

---

## 🧾 Grid de CF-e (tbl_cfe_100)

### Título Muda
```
╔════════════════════════════════════════════════════════════╗
║  Cupons Fiscais Eletrônicos (CF-e/SAT)                    ║
║  Consulta e gerenciamento de documentos fiscais           ║
╚════════════════════════════════════════════════════════════╝
```

### Tabela (exemplo)
```
┌────────┬───────┬──────────┬────────────────┬─────────────────┬──────────────┐
│ Número │ Série │ Nº SAT   │ Data/Hora      │ CNPJ Emitente   │ Valor Total  │
├────────┼───────┼──────────┼────────────────┼─────────────────┼──────────────┤
│ 54321  │  1    │ 123456   │ 15/11 14:30:25 │ 67.624.577/...  │ R$ 45,90     │
│ 54322  │  1    │ 123457   │ 15/11 15:22:10 │ 67.624.577/...  │ R$ 123,50    │
│ 54323  │  1    │ 123458   │ 15/11 16:45:33 │ 67.624.577/...  │ R$ 78,20     │
└────────┴───────┴──────────┴────────────────┴─────────────────┴──────────────┘
```

### Colunas Específicas de CF-e
- Número SAT (campo único de CF-e)
- CPF/CNPJ Cliente (pode ser "Não Identificado")
- Nome Cliente (pode ser "Consumidor Final")
- Descontos
- Acréscimos
- Formas de Pagamento (pode ter múltiplas linhas):
  ```
  Dinheiro: R$ 50,00
  Cartão Débito: R$ 73,50
  ```

---

## 🚚 Grid de CT-e (tbl_cte_100)

### Título Muda
```
╔════════════════════════════════════════════════════════════╗
║  Conhecimentos de Transporte Eletrônicos (CT-e)           ║
║  Consulta e gerenciamento de documentos fiscais           ║
╚════════════════════════════════════════════════════════════╝
```

### Tabela (exemplo)
```
┌────────┬───────┬──────────────┬─────────────────┬──────────────┬──────────────┐
│ Número │ Série │ Tipo Serviço │ CNPJ Tomador    │ Produto      │ Valor Total  │
├────────┼───────┼──────────────┼─────────────────┼──────────────┼──────────────┤
│ 98765  │  1    │ Normal       │ 12.345.678/...  │ Eletrônicos  │ R$ 850,00    │
│ 98766  │  1    │ Normal       │ 12.345.678/...  │ Alimentos    │ R$ 1.200,00  │
│ 98767  │  1    │ Subcontrat.  │ 98.765.432/...  │ Móveis       │ R$ 2.500,00  │
└────────┴───────┴──────────────┴─────────────────┴──────────────┴──────────────┘
```

### Colunas Específicas de CT-e
- Tipo Serviço
- Tipo Tomador
- CNPJ Tomador, Remetente, Destinatário
- CNPJ Expedidor, Recebedor
- Produto/Carga
- Peso (kg)
- Volume
- Unidade
- RNTRC (registro transportador)
- Placa
- UF Veículo
- CPF Motorista
- Nome Motorista
- Valor Serviço
- Valor a Receber
- Valor ICMS
- Base Cálculo

---

## 🎨 Elementos Visuais

### Status Badges
```
✅ autorizada    → Verde claro com texto verde escuro
❌ cancelada     → Vermelho claro com texto vermelho escuro
⚠️ denegada      → Amarelo claro com texto amarelo escuro
⏳ processando   → Azul claro com texto azul escuro
```

### Botões
```
[🔍 Aplicar Filtros]  → Azul (#0066CC)
[❌ Limpar]           → Cinza
[📥 Exportar Excel]   → Verde
[◀ Anterior]          → Azul (desabilitado = cinza)
[Próxima ▶]           → Azul (desabilitado = cinza)
```

### Hover Effects
- Linhas da tabela ficam **azul claro** ao passar o mouse
- Botões ficam mais escuros ao passar o mouse
- Cursor vira "pointer" em elementos clicáveis

---

## 🔍 Console do Navegador (F12)

### Logs Esperados
```javascript
🔍 Validando configuração da API...
✅ Token válido até: 2024-12-20T12:45:58Z

🚀 REQUISIÇÃO API
Method: GET
URL: /WebView/Consultar
Full URL: http://localhost:3001/api/WebView/Consultar?collection=tbl_nfe_100...
Params: {host: "10.0.0.8", database: "C67624577000145", ...}

✅ RESPOSTA API
Status: 200 OK
Data: Array(150)

🔄 Estrutura da resposta:
  tipo: "object"
  isArray: false
  keys: ["lista", "total"]

✅ 150 itens encontrados para mapear
📋 Exemplo do primeiro item: {numero: "12345", ...}
✅ Total de notas mapeadas: 150
```

### NÃO deve ter:
```javascript
❌ Erro 401 Unauthorized
❌ Erro 404 Not Found
❌ Erro 500 Internal Server Error
❌ CORS error
❌ Network error
❌ TypeError
```

---

## 📡 Network Tab (F12 → Network)

### Requisições Esperadas
```
Name                          Status  Type    Size
────────────────────────────────────────────────────
Consultar?collection=tbl...   200     xhr     45.2 KB
ContadorConsulta?collection   200     xhr     125 B
```

### Headers da Requisição
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg...
Content-Type: application/json
Accept: application/json
```

### Response Preview
```json
{
  "lista": [
    {
      "numero": "12345",
      "serie": "1",
      "chaveAcesso": "35240567624577000145550010000123451234567890",
      "valorTotal": 1250.00,
      ...
    }
  ],
  "total": 150
}
```

---

## 📥 Arquivo Excel Exportado

### Nome do Arquivo
```
Notas_Fiscais_2024-11-27T21-30-45.xlsx
Cupons_Fiscais_2024-11-27T21-31-12.xlsx
Conhecimentos_Transporte_2024-11-27T21-32-08.xlsx
```

### Conteúdo (exemplo NF-e)
```
| Número | Série | Chave de Acesso | Data Emissão | CNPJ Emitente | ... | Valor Total |
|--------|-------|-----------------|--------------|---------------|-----|-------------|
| 12345  | 1     | 352405676...    | 15/11/2024   | 67.624.577... | ... | 1250.00     |
| 12346  | 1     | 352405676...    | 16/11/2024   | 67.624.577... | ... | 2340.50     |
```

---

## ✅ Checklist Visual Rápido

Ao abrir o sistema, você deve ver:

- [ ] ✅ Página carrega sem erros
- [ ] ✅ 3 botões de collection visíveis (📄 🧾 🚚)
- [ ] ✅ Filtros de data e CNPJ
- [ ] ✅ Grid com dados carregados
- [ ] ✅ Contador de registros
- [ ] ✅ Botão de exportar Excel
- [ ] ✅ Paginação funcionando
- [ ] ✅ Ao clicar em CF-e, grid muda
- [ ] ✅ Ao clicar em CT-e, grid muda novamente
- [ ] ✅ Console sem erros vermelhos
- [ ] ✅ Network mostra Status 200

---

**Se você vê tudo isso, o sistema está 100% funcional! ✅**
