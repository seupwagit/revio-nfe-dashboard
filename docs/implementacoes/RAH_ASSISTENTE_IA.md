# 🤖 RAH - Revio Agent Helper

## O que é o RAH?

**RAH (Revio Agent Helper)** é um assistente inteligente baseado em IA (OpenAI GPT-4) que conhece **toda a documentação** do sistema SpedRevio e pode responder suas dúvidas em tempo real.

---

## 🎯 Funcionalidades

### 1. Conhecimento Completo

RAH conhece:
- ✅ Todas as funcionalidades do sistema
- ✅ Como usar dashboards e gráficos
- ✅ Grids, filtros e ordenação
- ✅ Busca natural com LLM
- ✅ Exportação para Excel
- ✅ Cache e performance
- ✅ Troubleshooting
- ✅ API Revio
- ✅ Desenvolvimento e customização

### 2. Conversa Natural

- 💬 Responde em português brasileiro
- 🧠 Mantém contexto da conversa
- 📝 Fornece exemplos práticos
- 🔗 Cita fontes quando relevante

### 3. Sempre Disponível

- 🌐 Acessível de qualquer tela
- ⚡ Respostas em segundos
- 💾 Histórico de conversa
- 🔄 Pode ser reiniciado a qualquer momento

---

## 🚀 Como Usar

### Abrir o RAH

1. Procure o ícone 💬 no **canto inferior esquerdo**
2. Clique para abrir a janela de chat
3. Pronto! RAH está pronto para ajudar

### Fazer Perguntas

1. Digite sua pergunta no campo de texto
2. Pressione **Enter** ou clique em **Enviar**
3. Aguarde alguns segundos
4. RAH responderá com informações detalhadas

### Conversar

- RAH mantém o contexto da conversa
- Você pode fazer perguntas de acompanhamento
- Peça esclarecimentos ou exemplos
- Experimente diferentes formas de perguntar

### Limpar Conversa

1. Clique no ícone 🗑️ no topo
2. Confirme a ação
3. Comece uma nova conversa do zero

---

## 💡 Exemplos de Perguntas

### Sobre Funcionalidades

```
Como usar a busca natural?
Como exportar dados para Excel?
Quais gráficos estão disponíveis?
Como filtrar notas por período?
O que é o Analytics Agregado?
Como congelar colunas na grid?
```

### Sobre Performance

```
O que é o cache e como funciona?
Por que demora para carregar 90 dias?
Como melhorar a performance do sistema?
O que são chunks e para que servem?
Quanto tempo dura o cache?
```

### Sobre Problemas

```
Grid não carrega, o que fazer?
Exportação está demorando muito
Dados parecem desatualizados
Busca natural não funciona
Como limpar o cache?
```

### Sobre Desenvolvimento

```
Como adicionar uma nova coluna na grid?
Como customizar os gráficos?
Onde fica a configuração da API?
Como funciona o sistema de chunks?
Qual a estrutura de pastas do projeto?
```

### Consultas Complexas

```
Explique passo a passo como usar a busca natural
para encontrar notas de entrada maiores que 5000

Como posso exportar apenas notas autorizadas
de um período específico?

Qual a diferença entre Analytics MongoDB
e Analytics Agregado?
```

---

## ⚙️ Configuração

### Requisitos

1. **Chave da API OpenAI**
   - Necessária para o RAH funcionar
   - Configurada no arquivo `.env`

2. **Variável de Ambiente**
   ```env
   VITE_OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
   ```

3. **Conexão com Internet**
   - RAH precisa acessar a API OpenAI
   - Respostas são geradas em tempo real

### Como Configurar

1. **Obter Chave da API:**
   - Acesse https://platform.openai.com/api-keys
   - Crie uma nova chave
   - Copie a chave

2. **Adicionar no .env:**
   ```env
   VITE_OPENAI_API_KEY=sk-proj-sua-chave-aqui
   ```

3. **Reiniciar Aplicação:**
   ```bash
   npm run dev
   ```

4. **Testar:**
   - Abra o RAH
   - Faça uma pergunta
   - Deve funcionar!

---

## 🧠 Como o RAH Funciona

### Arquitetura

```
Usuário
  ↓ pergunta
RAHAssistant (UI)
  ↓ processa
rahAgent (Service)
  ↓ envia
OpenAI API (GPT-4)
  ↓ responde
rahAgent
  ↓ formata
RAHAssistant
  ↓ exibe
Usuário
```

### Contexto do Sistema

RAH é inicializado com um **contexto completo** sobre o SpedRevio:

- Funcionalidades principais
- Tecnologias utilizadas
- Estrutura de pastas
- Como responder perguntas
- Áreas de conhecimento

### Histórico de Conversa

- RAH mantém histórico da conversa atual
- Permite perguntas de acompanhamento
- Contexto é preservado entre mensagens
- Pode ser limpo a qualquer momento

---

## 📊 Performance

### Tempo de Resposta

| Tipo de Pergunta | Tempo Médio |
|------------------|-------------|
| Simples | 2-3s |
| Média | 3-5s |
| Complexa | 5-8s |

### Custo

- Usa modelo GPT-4
- ~$0.03 por 1k tokens
- Pergunta média: ~500 tokens
- Custo por pergunta: ~$0.015

### Limites

- Máximo de 1000 tokens por resposta
- Histórico limitado pela API
- Recomendado limpar após 10-15 mensagens

---

## 🎨 Interface

### Componentes

**Botão Flutuante:**
- Ícone 💬 no canto inferior esquerdo
- Gradiente roxo/rosa
- Efeito hover com escala

**Janela de Chat:**
- 400px de largura
- 600px de altura
- Header com gradiente
- Área de mensagens com scroll
- Campo de input com botão enviar

**Mensagens:**
- Usuário: Roxo/rosa (direita)
- RAH: Branco (esquerda)
- Timestamp em cada mensagem
- Scroll automático para última mensagem

**Sugestões:**
- Aparecem quando não há mensagens
- 5 sugestões pré-definidas
- Clique para usar

---

## 🔧 Desenvolvimento

### Arquivos

```
src/
├── services/
│   └── rahAgent.ts          # Lógica do agente
├── components/
│   └── RAHAssistant.tsx     # Interface do chat
└── config/
    └── env.ts               # Configuração da API key
```

### Customização

**Adicionar Conhecimento:**
```typescript
// Em rahAgent.ts
const SYSTEM_CONTEXT = `
  ... contexto existente ...
  
  ## NOVA SEÇÃO
  Informações sobre nova funcionalidade...
`
```

**Modificar Sugestões:**
```typescript
// Em RAHAssistant.tsx
const suggestions = [
  "Nova sugestão 1",
  "Nova sugestão 2",
  // ...
]
```

**Ajustar Parâmetros:**
```typescript
// Em rahAgent.ts
body: JSON.stringify({
  model: 'gpt-4',           // Modelo da OpenAI
  temperature: 0.7,         // Criatividade (0-1)
  max_tokens: 1000          // Tamanho máximo da resposta
})
```

---

## 🐛 Troubleshooting

### "RAH não está configurado"

**Causa:** API key não configurada

**Solução:**
1. Adicione `VITE_OPENAI_API_KEY` no `.env`
2. Reinicie a aplicação
3. Teste novamente

### "Erro ao processar pergunta"

**Causas possíveis:**
- Sem conexão com internet
- API key inválida
- Limite de uso atingido
- Erro na API OpenAI

**Soluções:**
1. Verifique conexão
2. Valide API key
3. Verifique limites na OpenAI
4. Tente novamente em alguns minutos

### "Resposta muito lenta"

**Causas possíveis:**
- Pergunta muito complexa
- API OpenAI lenta
- Conexão lenta

**Soluções:**
1. Simplifique a pergunta
2. Aguarde alguns segundos
3. Tente novamente
4. Verifique conexão

### "Resposta não faz sentido"

**Causas possíveis:**
- Pergunta ambígua
- Contexto insuficiente
- Limitação do modelo

**Soluções:**
1. Reformule a pergunta
2. Seja mais específico
3. Forneça mais contexto
4. Tente variações

---

## 📈 Melhorias Futuras

### Planejadas

- [ ] Suporte a múltiplos idiomas
- [ ] Histórico persistente (localStorage)
- [ ] Busca na documentação
- [ ] Sugestões inteligentes baseadas em contexto
- [ ] Integração com analytics
- [ ] Comandos rápidos (/help, /docs, etc)
- [ ] Modo offline com respostas pré-definidas
- [ ] Feedback de qualidade das respostas

### Possíveis

- [ ] Voz (speech-to-text)
- [ ] Anexar imagens/screenshots
- [ ] Compartilhar conversas
- [ ] Exportar conversa para PDF
- [ ] Integração com sistema de tickets
- [ ] Treinamento personalizado

---

## 🎉 Conclusão

RAH é seu assistente pessoal no SpedRevio:

- ✅ Conhece toda a documentação
- ✅ Responde em segundos
- ✅ Sempre disponível
- ✅ Fácil de usar
- ✅ Mantém contexto
- ✅ Fornece exemplos práticos

**Experimente agora e veja como RAH pode ajudar!** 🚀

---

*Documentação atualizada em: Dezembro 2024*  
*Versão: 1.0.0*
