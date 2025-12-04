# 🎉 Bem-vindo ao SpedRevio Dashboard!

Obrigado por escolher o **SpedRevio Dashboard** para gerenciar suas notas fiscais eletrônicas!

## 🚀 Primeiros Passos

### 1. Instalação Rápida

```bash
# Instale as dependências
npm install

# Configure o ambiente
copy .env.example .env

# Inicie o servidor
npm run dev
```

### 2. Configure suas Credenciais

Edite o arquivo `.env` com suas informações:

```env
VITE_API_BEARER_TOKEN=seu_token_aqui
VITE_DB_DATABASE=seu_cnpj_aqui
VITE_DB_COLLECTION=tbl_nfe_100
```

### 3. Acesse o Dashboard

Abra seu navegador em: `http://localhost:5173`

## 📚 Documentação

Temos documentação completa para você:

### 🎯 Para Começar
- **[INICIO_RAPIDO.md](INICIO_RAPIDO.md)** - Setup em 3 passos
- **[CONFIGURACAO.md](CONFIGURACAO.md)** - Guia de configuração
- **[EXEMPLOS_USO.md](EXEMPLOS_USO.md)** - Casos de uso práticos

### 📖 Para Aprender Mais
- **[INDEX.md](INDEX.md)** - Índice completo da documentação
- **[ESTRUTURA_PROJETO.md](ESTRUTURA_PROJETO.md)** - Arquitetura do projeto
- **[DESIGN.md](DESIGN.md)** - Guia de design

### 🎨 Para Designers
- **[CORES_REVIO.md](CORES_REVIO.md)** - Paleta de cores
- **[PREVIEW.md](PREVIEW.md)** - Overview visual

## ✨ Principais Funcionalidades

### 📊 Dashboard
Visualize estatísticas em tempo real:
- Total de notas fiscais
- Valor total processado
- Taxa de autorização
- Análise de performance

### 📋 Listagem de Notas
Gerencie suas notas com facilidade:
- Busca avançada
- Filtros por data e CNPJ
- Ordenação personalizada
- Visualização em cards ou grid

### 🔍 Detalhes Completos
Acesse informações detalhadas:
- Dados do emitente
- Dados do destinatário
- Lista de itens
- Chave de acesso

### 📈 Grid Avançada
Análise profissional com:
- TanStack Table
- Ordenação por colunas
- Paginação completa
- Exportação de dados

## 🎨 Interface Moderna

O SpedRevio Dashboard apresenta:
- ✨ Design inspirado na Revio
- 🎨 Paleta de cores azul profissional
- 💫 Animações suaves
- 📱 100% responsivo
- 🚀 Performance otimizada

## 🆘 Precisa de Ajuda?

### Documentação
- Consulte o [INDEX.md](INDEX.md) para navegar pela documentação
- Veja [EXEMPLOS_USO.md](EXEMPLOS_USO.md) para casos práticos
- Leia [CONFIGURACAO.md](CONFIGURACAO.md) para troubleshooting

### Problemas Comuns

**"Variáveis não configuradas"**
→ Configure o arquivo `.env` com suas credenciais

**"401 Unauthorized"**
→ Verifique se o token está correto no `.env`

**"Nenhuma nota encontrada"**
→ Verifique o CNPJ e o período de datas

### Suporte
- Site oficial: [revio.global](https://revio.global)
- Documentação: [INDEX.md](INDEX.md)
- Issues: Abra uma issue no GitHub

## 🎯 Próximos Passos

Agora que você está configurado:

1. ✅ Explore o Dashboard
2. ✅ Teste os filtros de busca
3. ✅ Visualize detalhes de uma nota
4. ✅ Experimente a grid avançada
5. ✅ Personalize conforme necessário

## 🌟 Recursos Destacados

### Para Contadores
- Gestão de múltiplos clientes
- Relatórios detalhados
- Análise fiscal completa

### Para Empresas
- Controle interno de NF-e
- Dashboard executivo
- Integração via API

### Para Desenvolvedores
- Código limpo e organizado
- TypeScript para type safety
- Documentação completa
- Fácil customização

## 💡 Dicas Úteis

### Atalhos
- Use a busca rápida para encontrar notas
- Clique nas colunas para ordenar
- Use filtros para análises específicas

### Performance
- Ajuste o tamanho da página conforme necessário
- Use filtros de data para períodos menores
- Filtre por CNPJ para resultados mais rápidos

### Personalização
- Edite `tailwind.config.js` para cores
- Customize componentes em `src/components/`
- Adicione novos filtros em `src/pages/`

## 🏆 Você Está Pronto!

Tudo configurado! Agora você pode:
- ✅ Gerenciar suas notas fiscais
- ✅ Analisar dados fiscais
- ✅ Gerar relatórios
- ✅ Integrar com seus sistemas

## 📞 Fale Conosco

Gostou do SpedRevio Dashboard?
- Visite: [revio.global](https://revio.global)
- Contribua: [CONTRIBUTING.md](CONTRIBUTING.md)
- Compartilhe com sua equipe!

## 🎊 Bem-vindo à Família Revio!

Estamos felizes em tê-lo conosco. O SpedRevio Dashboard foi desenvolvido com muito cuidado para facilitar sua gestão fiscal.

**Bom trabalho e sucesso!** 🚀

---

**SpedRevio Dashboard** - Desenvolvido com ❤️ pela equipe Revio

Para começar: `npm run dev` ⚡
