# 🤖 Como Configurar o RAH (Revio Agent Helper)

## 📋 Pré-requisitos

Para usar o RAH, você precisa de uma **chave da API OpenAI**.

---

## 🔑 Obter Chave do Google Gemini

### Passo 1: Acessar Google AI Studio

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Aceite os termos de uso

### Passo 2: Criar API Key

1. Clique em **"Create API Key"**
2. Selecione um projeto do Google Cloud (ou crie um novo)
3. Clique em **"Create API key in existing project"**
4. **COPIE A CHAVE** (ela começa com `AIza...`)
5. **IMPORTANTE:** Guarde em local seguro!

**Nota:** Google Gemini tem cota gratuita generosa! Sem necessidade de cartão de crédito para começar.

---

## ⚙️ Configurar no SpedRevio

### Passo 1: Editar .env

1. Abra o arquivo `.env` na raiz do projeto
2. Localize a linha:
   ```env
   VITE_API_GOOGLE_GEMINI=AIzaSyD7EWB19AwBddPuj_MHxYcIq7DgW6w58zM
   ```
3. Substitua pela sua chave (se necessário)
4. Exemplo:
   ```env
   VITE_API_GOOGLE_GEMINI=AIzaSuaChaveAqui123456789
   ```
5. Salve o arquivo

**Nota:** A chave já está configurada! Você só precisa reiniciar o servidor.

### Passo 2: Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

### Passo 3: Testar RAH

1. Abra o navegador
2. Clique no ícone 💬 (canto inferior esquerdo)
3. Digite: "Como usar a busca natural?"
4. Pressione Enter
5. **Deve funcionar!** ✅

---

## 🐛 Troubleshooting

### "RAH não está configurado"

**Causa:** Chave não foi adicionada no `.env`

**Solução:**
1. Verifique se adicionou a chave no `.env`
2. Verifique se salvou o arquivo
3. Reinicie o servidor

### "Incorrect API key provided"

**Causa:** Chave inválida ou incorreta

**Solução:**
1. Verifique se copiou a chave completa
2. Verifique se não tem espaços extras
3. Crie uma nova chave em https://makersuite.google.com/app/apikey

### "Quota exceeded"

**Causa:** Limite de requisições atingido

**Solução:**
1. Aguarde alguns minutos
2. Google Gemini tem cota gratuita generosa
3. Verifique limites em: https://ai.google.dev/pricing

### "Rate limit exceeded"

**Causa:** Muitas requisições em pouco tempo

**Solução:**
1. Aguarde 1 minuto
2. Tente novamente
3. Evite fazer muitas perguntas seguidas

---

## 💰 Custos

### Google Gemini - GRATUITO! 🎉

**Cota Gratuita:**
- 60 requisições por minuto
- 1.500 requisições por dia
- **Sem necessidade de cartão de crédito!**

**Mais que suficiente para uso normal do RAH!**

### Como Reduzir Custos

1. **Use com moderação:** Faça perguntas específicas
2. **Limpe histórico:** Clique em 🗑️ após conversas longas
3. **Consulte documentação:** Use RAH apenas quando necessário
4. **Monitore uso:** Verifique em https://platform.openai.com/usage

---

## 🔒 Segurança

### Boas Práticas

1. **Nunca compartilhe** sua API key
2. **Não commite** o arquivo `.env` no Git
3. **Use .gitignore** para proteger `.env`
4. **Rotacione chaves** periodicamente
5. **Monitore uso** para detectar abusos

### Se a Chave Vazar

1. Acesse: https://platform.openai.com/api-keys
2. Encontre a chave comprometida
3. Clique em **"Revoke"**
4. Crie uma nova chave
5. Atualize o `.env`

---

## ✅ Checklist de Configuração

- [ ] Conta OpenAI criada
- [ ] Créditos adicionados
- [ ] API key criada
- [ ] Chave copiada
- [ ] `.env` atualizado
- [ ] Servidor reiniciado
- [ ] RAH testado e funcionando

---

## 🎉 Pronto!

Se seguiu todos os passos, o RAH deve estar funcionando perfeitamente!

**Teste agora:**
- Clique no ícone 💬
- Pergunte: "Como usar a busca natural?"
- Receba resposta em segundos!

---

## 📞 Suporte

**Problemas com Google Gemini:**
- Documentação: https://ai.google.dev/docs
- API Keys: https://makersuite.google.com/app/apikey

**Problemas com RAH:**
- Consulte: [RAH_ASSISTENTE_IA.md](../RAH_ASSISTENTE_IA.md)
- Veja: [Troubleshooting](../troubleshooting/)

---

*Guia atualizado em: Dezembro 2024*  
*Versão: 1.0.0*
