# 🚀 Debug Fullstack - Quick Start

## Início Rápido (3 passos)

### 1️⃣ Pressione F5

Isso iniciará automaticamente o debug fullstack com Chrome e Backend.

### 2️⃣ Adicione Breakpoints

Clique na margem esquerda de qualquer arquivo `.ts` ou `.tsx` para adicionar breakpoints.

### 3️⃣ Use a Aplicação

Navegue pela aplicação e os breakpoints serão acionados automaticamente.

---

## 🎯 Perfis Disponíveis

Pressione `Ctrl+Shift+D` para ver todos os perfis:

- **🚀 Full Stack Debug (Chrome + Backend)** ← RECOMENDADO
- **🚀 Full Stack Debug (Edge + Backend)**
- **🔌 Attach Full Stack** (para servidores já rodando)
- **🔧 Backend (Node.js)** (apenas backend)
- **🚀 Launch Chrome (Dev)** (apenas frontend)

---

## 🔍 Onde Adicionar Breakpoints

### Frontend (React)

```typescript
// src/pages/Dashboard.tsx
// src/hooks/useDocuments.ts
// src/services/api.ts
```

### Backend (Node.js)

```typescript
// server/backoffice/routes/documents.ts
// server/backoffice/routes/analytics.ts
// server/backoffice/database/mongodb.ts
```

---

## 🎮 Controles Básicos

| Tecla      | Ação             |
| ---------- | ---------------- |
| `F5`       | Continuar        |
| `F10`      | Próxima linha    |
| `F11`      | Entrar na função |
| `Shift+F5` | Parar debug      |

---

## 🚨 Problemas?

### Porta já em uso

```bash
npm run kill-ports
```

### Breakpoints não funcionam

1. Recarregue a página (`Ctrl+R`)
2. Restart debug (`Ctrl+Shift+F5`)

---

## 📚 Documentação Completa

Veja `docs/DEBUG_FULLSTACK.md` para guia completo com exemplos avançados.

---

## 💡 Dica Pro

Use **Conditional Breakpoints** para debugar apenas casos específicos:

1. Clique com botão direito no breakpoint
2. "Edit Breakpoint"
3. Adicione condição: `data.length > 100`
