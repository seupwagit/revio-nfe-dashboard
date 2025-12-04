# 🔐 Como Gerar um Novo Token de Autenticação

## Problema Identificado

Seu token JWT expirou em: **20/12/2024, 13:05:58**

Todos os erros 401 são causados pelo token expirado, não por problemas de configuração.

## Como Gerar um Novo Token

### Opção 1: Via API de Autenticação

Faça uma requisição POST para o servidor de identidade:

```bash
POST https://idserver.revio.digital/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=client
&client_secret=SEU_CLIENT_SECRET
&scope=api1
```

### Opção 2: Via Interface Web da Revio

1. Acesse o painel administrativo da Revio
2. Vá em **Configurações** → **API** → **Tokens**
3. Clique em **Gerar Novo Token**
4. Copie o token gerado

### Opção 3: Contatar Suporte Revio

Se você não tem acesso direto:
- Entre em contato com o suporte da Revio
- Solicite um novo token de acesso para a API
- Informe que precisa acessar os endpoints `/api/WebView/Consultar` e `/api/WebView/ContadorConsulta`

## Atualizar o Token no Projeto

Depois de obter o novo token:

1. Abra o arquivo `.env`
2. Substitua o valor de `VITE_API_BEARER_TOKEN`
3. **IMPORTANTE**: Cole o token em uma única linha, sem espaços ou quebras
4. Salve o arquivo
5. Reinicie o servidor de desenvolvimento

### Exemplo:

```env
VITE_API_BEARER_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzY1MDAwMDAwLCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.NOVA_ASSINATURA_AQUI
```

## Verificar se Funcionou

Após atualizar o token:

1. Acesse: http://localhost:5173/debug
2. Clique em **"1. Variáveis ENV"**
3. Verifique se o token foi atualizado
4. No console, verifique se aparece: **"Expirado? ✅ NÃO"**
5. Clique em **"3. Via Proxy"** para testar a API
6. Se retornar status 200, está funcionando! ✅

## Informações Técnicas

### Token Atual (EXPIRADO)
- **Emissor**: https://idserver.revio.digital/
- **Expiração**: 20/12/2024, 13:05:58
- **Scope**: api1
- **Client ID**: client

### O Que o Novo Token Precisa Ter
- ✅ Scope: `api1`
- ✅ Validade mínima: 30 dias
- ✅ Permissões para endpoints `/api/WebView/*`
- ✅ Formato JWT válido (3 partes separadas por ponto)

## Observações Importantes

⚠️ **Todos os testes falharam com erro 401** porque o token está expirado, não por problemas de:
- ❌ Formato do Bearer (está correto: `Bearer <token>`)
- ❌ Configuração do proxy (está funcionando)
- ❌ Headers (estão sendo enviados corretamente)
- ❌ Parâmetros da API (estão corretos)

✅ **A única solução é obter um novo token válido!**
