# 📊 Analytics MongoDB - LEIA-ME

## 🎯 O Que É?

Uma tela de análise de dados fiscais com gráficos interativos que usa **conexão direta ao MongoDB** para máxima performance.

## ⚡ Início Rápido (3 Passos)

### 1️⃣ Iniciar Servidor MongoDB
Abra um terminal e execute:
```bash
npm run aggregation
```

### 2️⃣ Manter Frontend Rodando
Em outro terminal (ou já deve estar rodando):
```bash
npm run dev
```

### 3️⃣ Acessar a Tela
Abra no navegador:
```
http://localhost:5173/analytics
```

## 🎁 Atalho Automático (Windows)

Clique duas vezes em:
```
iniciar-completo.bat
```

Isso abre automaticamente os 2 terminais necessários!

## ✅ Verificar se Está Funcionando

Clique duas vezes em:
```
testar-analytics.bat
```

Ou acesse manualmente:
```
http://localhost:3002/health
```

## 📚 Documentação Completa

Consulte o índice completo:
```
INDICE_ANALYTICS.md
```

### Documentos Principais

1. **RESUMO_ANALYTICS_MONGODB.md** - Resumo executivo
2. **GUIA_RAPIDO_ANALYTICS.md** - Passo a passo detalhado
3. **COMO_USAR_ANALYTICS.txt** - Instruções visuais
4. **README_ANALYTICS_MONGODB.md** - Documentação técnica completa

## 🎨 O Que Você Vai Ver

- 📊 **4 KPIs**: Total, Faturamento, Ticket Médio, Maior Nota
- 📈 **5 Gráficos**: Diário, Mensal, Emitentes, Tipos, Status
- 🔍 **Filtros**: Período, Tipo de Documento, Datas Customizadas

## ⚡ Por Que É Rápido?

| Método | Tempo para 90 dias |
|--------|-------------------|
| **MongoDB** | 2-5 segundos ⚡⚡⚡ |
| API REST | 30-60 segundos 🐌 |

## ❓ Problemas?

### "Servidor de Agregação Não Disponível"
```bash
npm run aggregation
```

### Gráficos não aparecem
1. Mude o período (ex: últimos 90 dias)
2. Verifique se há dados no banco
3. Abra o console (F12) para ver erros

### Mais ajuda
Consulte: `GUIA_RAPIDO_ANALYTICS.md` → Seção "Problemas Comuns"

## 🔗 Links Rápidos

- Frontend: http://localhost:5173
- Analytics: http://localhost:5173/analytics
- Health Check: http://localhost:3002/health

## 📞 Suporte

1. Execute: `testar-analytics.bat`
2. Consulte: `GUIA_RAPIDO_ANALYTICS.md`
3. Leia: `README_ANALYTICS_MONGODB.md`

## 🎉 Pronto!

Agora você tem acesso a análises ultra-rápidas dos seus dados fiscais!

---

**Dúvidas?** Leia `INDICE_ANALYTICS.md` para ver toda a documentação disponível.
