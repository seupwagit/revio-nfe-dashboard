# GEMINI.md - Antigravity Kit (Regras do Projeto)

Este arquivo define os padrões obrigatórios e o comportamento esperado do agente de IA neste repositório.

## 🔴 CRITICAL: AGENT & STEERING PROTOCOL

> **OBRIGATÓRIO:** Antes de qualquer implementação ou refatoração, você DEVE ler e aplicar as regras em `@[.kiro/steering]`.

### 1. Carregamento de Regras Modulares
- **Manual de Testes**: `[.kiro/steering/testing-environment-rules.md](file:///c:/Drive/Projetos/revio-nfe-dashboard/.kiro/steering/testing-environment-rules.md)`
- **Qualidade de Código**: `[.kiro/steering/code-quality-rules.md](file:///c:/Drive/Projetos/revio-nfe-dashboard/.kiro/steering/code-quality-rules.md)`
- **Regras de Idioma**: `[.kiro/steering/portuguese-language-rules.md](file:///c:/Drive/Projetos/revio-nfe-dashboard/.kiro/steering/portuguese-language-rules.md)`
- **Ambiente Windows**: `[.kiro/steering/windows-native-rules.md](file:///c:/Drive/Projetos/revio-nfe-dashboard/.kiro/steering/windows-native-rules.md)`
- **Organização de Tipos**: `[.kiro/steering/constants-and-types-organization-rules.md](file:///c:/Drive/Projetos/revio-nfe-dashboard/.kiro/steering/constants-and-types-organization-rules.md)`

---

## 🌐 TIER 0: REGRAS UNIVERSAIS

### 🇧🇷 Idioma e Comunicação
- **Comunicação com o Usuário**: SEMPRE em Português Brasileiro.
- **Documentação e Tasks**: SEMPRE em Português Brasileiro (incluindo `task.md`, `implementation_plan.md` e `walkthrough.md`).
- **Comentários de Código**: SEMPRE em Português Brasileiro.
- **Nomenclatura (Código)**: Pode ser em Inglês (padrão da indústria), mas documente a lógica em PT-BR.

### 🧹 Código Limpo e Organização
- **Clean Code**: Padrões `@[skills/clean-code]`.
- **Sem index.ts**: Proibido usar `index.ts` para re-exportações. Importe diretamente dos arquivos.
- **Um Tipo por Arquivo**: Enums, Interfaces e Classes devem estar em arquivos separados.

---

## 🛠️ TIER 1: DESENVOLVIMENTO E TESTES

### 🧪 Estratégia de Testes
- **Stack**: Vitest (Unitário/Integração), Cypress (E2E).
- **Cobertura**: Mínimo de 80% global.
- **Execução pelo Agente**: SEMPRE usar `--pool=forks` ao rodar Vitest.
- **E2E-First**: Priorize escrever o teste E2E antes da implementação de UI.

### 💻 Ambiente (Windows Native)
- **Comandos**: NÃO use WSL para comandos de desenvolvimento. Use PowerShell nativo.
- **Gerenciador**: SEMPRE use `pnpm`. `npm` e `yarn` são proibidos.

---

## 📦 TIER 2: ARQUITETURA E DADOS (NFe Dashboard)

### 🧩 DocumentTransformer
- Toda resposta de documento fiscal do banco (MongoDB/Flat) deve passar pela camada de transformação para aninhamento (Nesting).
- **Contrato Frontend**: Espera objetos `totais`, `emitente` e `destinatario`.

---

## 🦾 INTELLIGENT AGENT ROUTING

Use os especialistas apropriados para cada domínio e identifique-os no chat:
- **Backend**: `backend-specialist`
- **Frontend**: `frontend-specialist`
- **Testes**: `qa-automation-engineer` / `test-engineer`
