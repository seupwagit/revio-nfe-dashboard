# 🔍 Instruções de Debug da API Revio

## Como Usar

1. **Acesse a página de debug**: http://localhost:5173/debug

2. **Execute os testes na ordem**:
   - ✅ **Teste 1: Variáveis ENV** - Verifica se todas as variáveis estão carregadas
   - ✅ **Teste 2: API Direta** - Testa conexão direta sem proxy
   - ✅ **Teste 3: Via Proxy** - Testa através do proxy do Vite
   - ✅ **Teste 4: Formatos Bearer** - Testa diferentes formatos de autenticação

## O que Verificar

### No Console do Navegador (F12)

Ao carregar a aplicação, você verá:

```
🔍 Validando configuração da API...
🔐 INFORMAÇÕES DO TOKEN
  Comprimento: XXX
  Primeiros 50 chars: eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgw...
  Validação: { valid: true/false, message: "..." }
  Header JWT: { alg: "RS256", ... }
  Payload JWT: { iss: "...", exp: ..., ... }
  Expira em: DD/MM/YYYY HH:MM:SS
  Expirado?: ❌ SIM / ✅ NÃO
```

### Ao Fazer Requisições

```
🚀 REQUISIÇÃO API
  Method: GET
  URL: /WebView/Consultar
  Base URL: /api
  Full URL: /api/WebView/Consultar
  Params: { host: "10.0.0.8", ... }
  Headers:
    Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgw...
    Content-Type: application/json
  Authorization Header Length: XXX
  Token starts with "Bearer"?: true
```

## Problemas Comuns

### ❌ Token Expirado
Se o token estiver expirado, você precisa gerar um novo token no sistema Revio e atualizar o `.env`

### ❌ Token Inválido
Verifique se o token foi copiado completamente, sem espaços ou quebras de linha

### ❌ Erro 401 "cabeçalhos de segurança não definidos"
- O header Authorization não está sendo enviado
- O proxy não está repassando os headers
- O formato do Bearer está incorreto

### ❌ Erro CORS
- O proxy do Vite não está configurado corretamente
- Tente usar a API direta (Teste 2) para verificar se é problema de proxy

## Formato Correto do Token

O token deve estar no formato JWT com 3 partes separadas por ponto:

```
eyJhbGciOiJSUzI1NiIsImtpZCI6...  (Header)
.
eyJpc3MiOiJodHRwczovL2lkc2Vy...  (Payload)
.
Yzoi4HFu6UpeqwkbdF_kWylbW7hh...  (Signature)
```

No arquivo `.env`, deve estar assim:

```env
VITE_API_BEARER_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U
```

**IMPORTANTE**: Sem espaços, sem quebras de linha, token completo em uma única linha!

## Próximos Passos

1. Acesse http://localhost:5173/debug
2. Execute os 4 testes
3. Verifique os resultados na tela e no console
4. Se algum teste passar (✅), use esse formato/método
5. Se todos falharem, o problema pode ser:
   - Token expirado
   - Token inválido
   - Credenciais incorretas
   - Servidor API fora do ar
