# ⚡ Teste Rápido do Novo Token

## Quando Você Tiver o Novo Token

### 1. Atualizar o .env

```env
VITE_API_BEARER_TOKEN=SEU_NOVO_TOKEN_AQUI
```

### 2. Reiniciar o Servidor

No terminal:
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### 3. Verificar no Console

Ao abrir http://localhost:5173, você deve ver:

```
🔍 Validando configuração da API...
🔐 INFORMAÇÕES DO TOKEN
  Comprimento: XXX
  Validação: { valid: true, message: "Token parece válido" }
  Expira em: [DATA FUTURA]
  Expirado? ✅ NÃO  ← DEVE APARECER ISSO!
```

### 4. Testar a API

Acesse: http://localhost:5173/debug

Clique em **"3. Via Proxy"**

**Resultado Esperado:**
```json
✅ Teste via Proxy
{
  "status": 200,
  "statusText": "OK",
  "data": [
    { "numero": "123", "serie": "1", ... }
  ]
}
```

### 5. Acessar o Dashboard

Se o teste passar, acesse: http://localhost:5173/dashboard

Você deve ver:
- ✅ Cards com estatísticas
- ✅ Tabela com notas fiscais
- ✅ Filtros funcionando
- ✅ Sem erros 401

## Se Ainda Não Funcionar

Verifique:
1. Token copiado completamente (sem espaços ou quebras)
2. Token não expirado
3. Token tem permissão para scope `api1`
4. Servidor reiniciado após atualizar .env

## Contato

Se precisar de ajuda para gerar o token, entre em contato com:
- Suporte Revio
- Administrador do sistema
- Equipe de TI responsável pela API
