# ❓ FAQ - Perguntas Frequentes

## 📋 Índice

- [Instalação e Configuração](#instalação-e-configuração)
- [Uso do Sistema](#uso-do-sistema)
- [API e Integração](#api-e-integração)
- [Problemas Comuns](#problemas-comuns)
- [Customização](#customização)
- [Performance](#performance)
- [Segurança](#segurança)

## 🔧 Instalação e Configuração

### Como instalar o SpedRevio Dashboard?
```bash
npm install
```

### Quais são os requisitos mínimos?
- Node.js 16 ou superior
- npm ou yarn
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Como configurar as variáveis de ambiente?
1. Copie `.env.example` para `.env`
2. Edite o `.env` com suas credenciais
3. Reinicie o servidor

### Onde encontro o Bearer Token?
O token deve ser fornecido pela equipe Revio ou gerado no sistema de autenticação da API.

### Como trocar de cliente/banco?
Edite apenas a variável `VITE_DB_DATABASE` no `.env` com o novo CNPJ.

## 💻 Uso do Sistema

### Como acessar o dashboard?
Após iniciar o servidor (`npm run dev`), acesse `http://localhost:5173`

### Como filtrar notas por período?
1. Acesse "Grid Completa"
2. Preencha "Data Início" e "Data Fim"
3. Clique em "Consultar"

### Como buscar uma nota específica?
Use o campo de busca rápida na página "Notas Fiscais" ou "Grid Completa".

### Como ordenar as notas?
Na Grid Completa, clique no cabeçalho da coluna desejada.

### Como ver detalhes de uma nota?
Clique no ícone de olho (👁️) ou no card da nota.

### Qual o período máximo de consulta?
1 ano (365 dias) entre data início e data fim.

## 🌐 API e Integração

### Quais endpoints são utilizados?
- `GET /api/WebView/Consultar` - Busca de notas
- `GET /api/WebView/ContadorConsulta` - Total de registros

### Como funciona a autenticação?
Via Bearer Token no header `Authorization: Bearer {token}`

### Posso integrar com meu sistema?
Sim! O código é aberto e pode ser customizado conforme necessário.

### Como adicionar novos filtros?
Edite `src/services/api.ts` e adicione os parâmetros desejados.

### A API tem limite de requisições?
Depende da configuração do servidor. Consulte a documentação da API.

## 🐛 Problemas Comuns

### "Variáveis de ambiente não configuradas"
**Solução**: Configure o arquivo `.env` com todas as variáveis obrigatórias.

### "401 Unauthorized"
**Solução**: Verifique se o `VITE_API_BEARER_TOKEN` está correto e não expirou.

### "Nenhuma nota encontrada"
**Possíveis causas**:
- CNPJ incorreto
- Período sem notas
- Filtros muito restritivos

**Solução**: Verifique o CNPJ, amplie o período ou remova filtros.

### "Erro ao carregar dados"
**Solução**:
1. Verifique a conexão com internet
2. Verifique se o host está acessível
3. Consulte o console do navegador (F12)

### Tabela não carrega
**Solução**:
1. Limpe o cache do navegador
2. Recarregue a página (Ctrl+F5)
3. Verifique o console por erros

### Página em branco
**Solução**:
1. Verifique se o servidor está rodando
2. Limpe o cache
3. Verifique o console por erros

## 🎨 Customização

### Como mudar as cores?
Edite `tailwind.config.js` na seção `colors.revio`.

### Como adicionar uma nova página?
1. Crie o arquivo em `src/pages/`
2. Adicione a rota em `src/App.tsx`
3. Adicione o link em `src/components/Layout.tsx`

### Como customizar o logo?
Substitua o arquivo em `src/assets/logo.svg` ou edite o componente `Layout.tsx`.

### Como adicionar novos componentes?
Crie um arquivo em `src/components/` seguindo o padrão dos existentes.

### Posso usar outra biblioteca de ícones?
Sim! Instale a biblioteca desejada e substitua os imports.

## ⚡ Performance

### O sistema está lento, o que fazer?
1. Reduza o tamanho da página (menos registros)
2. Use filtros mais específicos
3. Limpe o cache do navegador
4. Verifique a conexão com a API

### Como otimizar o carregamento?
- Use filtros de data para períodos menores
- Filtre por CNPJ quando possível
- Ajuste o tamanho da página

### Posso fazer cache dos dados?
Sim! Implemente cache no `src/services/api.ts` usando localStorage ou sessionStorage.

## 🔐 Segurança

### O sistema é seguro?
Sim! Usa:
- Variáveis de ambiente para dados sensíveis
- Bearer Token para autenticação
- TypeScript para type safety
- Validação de dados

### Como proteger o token?
- Nunca commite o `.env`
- Use HTTPS em produção
- Renove o token periodicamente
- Não exponha no código

### Posso usar em produção?
Sim! O sistema está pronto para produção. Certifique-se de:
- Configurar HTTPS
- Usar tokens seguros
- Fazer backup regular
- Monitorar logs

### Como fazer backup dos dados?
Os dados estão na API. Configure backup no servidor da API.

## 📱 Responsividade

### Funciona em mobile?
Sim! O sistema é 100% responsivo.

### Quais dispositivos são suportados?
- Smartphones (iOS e Android)
- Tablets
- Notebooks
- Desktops

### Como testar em mobile?
Use as ferramentas de desenvolvedor do navegador (F12) e ative o modo responsivo.

## 🔄 Atualizações

### Como atualizar o sistema?
```bash
git pull
npm install
npm run build
```

### Com que frequência devo atualizar?
Recomendamos verificar atualizações mensalmente.

### Como saber se há atualizações?
Consulte o `CHANGELOG.md` ou o repositório Git.

## 📚 Documentação

### Onde encontro mais informações?
- [INDEX.md](INDEX.md) - Índice completo
- [WELCOME.md](WELCOME.md) - Boas-vindas
- [CONFIGURACAO.md](CONFIGURACAO.md) - Configuração
- [EXEMPLOS_USO.md](EXEMPLOS_USO.md) - Exemplos

### Como contribuir com a documentação?
Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes.

## 🤝 Suporte

### Onde obter ajuda?
1. Consulte a documentação
2. Verifique o FAQ (este arquivo)
3. Abra uma issue no GitHub
4. Entre em contato com a equipe Revio

### Como reportar um bug?
Abra uma issue no GitHub seguindo o template em [CONTRIBUTING.md](CONTRIBUTING.md).

### Como sugerir melhorias?
Abra uma issue com a tag "enhancement" ou envie um Pull Request.

## 💡 Dicas

### Dica 1: Atalhos de Teclado
- `Ctrl+F` - Buscar na página
- `F5` - Recarregar
- `Ctrl+Shift+I` - Abrir DevTools

### Dica 2: Filtros Eficientes
Use múltiplos filtros simultaneamente para resultados mais precisos.

### Dica 3: Exportação
Para exportar dados, use a funcionalidade de impressão do navegador (Ctrl+P).

### Dica 4: Múltiplos Clientes
Crie múltiplos arquivos `.env` (ex: `.env.cliente1`, `.env.cliente2`) e troque conforme necessário.

### Dica 5: Desenvolvimento
Use `npm run dev` para desenvolvimento com hot reload.

## 🎓 Aprendizado

### Onde aprender React?
- [React Docs](https://react.dev)
- [React Tutorial](https://react.dev/learn)

### Onde aprender TypeScript?
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Onde aprender Tailwind CSS?
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind UI](https://tailwindui.com)

## ❓ Ainda Tem Dúvidas?

Se sua pergunta não foi respondida:
1. Consulte a [documentação completa](INDEX.md)
2. Abra uma issue com a tag "question"
3. Entre em contato com a equipe Revio

---

**SpedRevio Dashboard** - FAQ atualizado regularmente

Última atualização: Janeiro 2025

Para mais informações: [INDEX.md](INDEX.md)
