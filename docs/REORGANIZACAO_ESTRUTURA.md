# Reorganização da Estrutura do Projeto

**Data:** 2025-12-22  
**Status:** ✅ Completo

## 📋 Resumo

O projeto foi reorganizado para manter uma estrutura clara dentro de `src/`:

- **src/frontend/** - Todo o código React/TypeScript do frontend
- **src/backend/** - Servidor Node.js/Express

## 🔄 Estrutura Final

```
src/
├── frontend/            # Todo o código do frontend
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── contexts/
│   ├── types/
│   ├── utils/
│   ├── assets/
│   ├── config/
│   ├── schemas/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
└── backend/             # Todo o código do backend
    ├── routes/
    ├── database/
    ├── utils/
    └── index.ts
```

## 📝 Arquivos Atualizados

### Configuração

1. **package.json**
   - `backend`: `npx tsx src/backend/index.ts`
   - `backend:debug`: `npx tsx --inspect=9229 src/backend/index.ts`
   - `fullstack:debug`: `set SERVE_FRONTEND=true&& npx tsx --inspect=9229 src/backend/index.ts`

2. **tsconfig.json**
   - `paths`: `"@/*": ["./src/frontend/*"]`
   - `include`: `["src/frontend"]`

3. **tsconfig.prod.json**
   - `exclude`: `"src/backend"`

4. **vite.config.ts**
   - Alias comentado: `./src/frontend`

5. **tailwind.config.js**
   - `content`: `"./src/frontend/**/*.{js,ts,jsx,tsx}"`

6. **index.html**
   - Script: `<script type="module" src="/src/frontend/main.tsx"></script>`

### Scripts

7. **start-fullstack.bat**
   - Comando: `npx tsx src/backend/index.ts`

8. **restart-fullstack.bat**
   - Comando: `npx tsx src/backend/index.ts`

9. **rebuild-and-restart.bat**
   - Comando: `npx tsx src/backend/index.ts`

10. **start-fullstack.sh**
    - Comando: `tsx src/backend/index.ts`

11. **start-fullstack-simple.sh**
    - Comando: `exec tsx src/backend/index.ts`

### Docker

12. **Dockerfile.fullstack.optimized**
    - `COPY src/backend ./src/backend`
    - `CMD ["tsx", "src/backend/index.ts"]`

### Scripts de Monitoramento

13. **scripts/validation/validate-deploy.mjs**
    - Arquivos requeridos: `src/backend/index.ts` e `src/frontend/main.tsx`

14. **scripts/monitoring/auto-monitor.mjs**
    - Comando: `["tsx", "src/backend/index.ts"]`

### VS Code

15. **.vscode/launch.json**
    - `runtimeArgs`: `["tsx", "--inspect=9229", "src/backend/index.ts"]`
    - `sourceMapPathOverrides`: `/src/frontend/*`

16. **.vscode/tasks.json**
    - `args`: `["tsx", "--inspect=9229", "src/backend/index.ts"]`

### Documentação

17. **README.md**
    - Estrutura do projeto atualizada

18. **src/frontend/README.md**
    - Caminho atualizado

## ✅ Verificações

- [x] Todos os arquivos do frontend movidos para `src/frontend/`
- [x] Todos os arquivos do backend movidos para `src/backend/`
- [x] Configurações do TypeScript atualizadas
- [x] Configurações do Vite atualizadas
- [x] Scripts de inicialização atualizados
- [x] Dockerfiles atualizados
- [x] Scripts de monitoramento atualizados
- [x] Configurações do VS Code atualizadas
- [x] Documentação atualizada

## 🚀 Próximos Passos

1. Testar o typecheck: `npm run checktype`
2. Testar o build do frontend: `npm run build:prod`
3. Testar o backend: `npm run backend`
4. Testar o fullstack: `npm run fullstack`
5. Verificar se o Docker build funciona: `npm run docker:build:optimized`

## 📌 Notas Importantes

- A estrutura agora está organizada em `src/frontend/` e `src/backend/`
- Todos os imports no código são relativos, então não precisaram de alteração
- O backend já usava imports relativos (`./routes/`, `./database/`), então não foi necessário alterar
- Diretórios temporários `frontend/` e `backend/` na raiz podem ser removidos
