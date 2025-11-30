# 📚 Documentação SpedRevio Dashboard

Bem-vindo à documentação completa do SpedRevio Dashboard - Sistema de gerenciamento de documentos fiscais eletrônicos.

## 📁 Estrutura da Documentação

### 🏗️ Arquitetura
Documentação sobre a estrutura e organização do sistema.

- **[Estrutura do Projeto](./arquitetura/ESTRUTURA_PROJETO.md)** - Organização de pastas e arquivos
- **[Stack Tecnológica](./arquitetura/STACK_TECNOLOGICA.md)** - Tecnologias utilizadas
- **[Componentes](./arquitetura/COMPONENTES.md)** - Arquitetura de componentes React

### 🧠 Lógica de Negócio
Documentação sobre regras de negócio e funcionamento do sistema.

- **[Integração com API](./logica/INTEGRACAO_API.md)** - Como funciona a comunicação com a API Revio
- **[Mapeamento de Campos](./logica/MAPEAMENTO_CAMPOS.md)** - Conversão de dados da API para o sistema
- **[Collections](./logica/COLLECTIONS.md)** - Tipos de documentos fiscais (NF-e, CF-e, CT-e)
- **[Filtros e Consultas](./logica/FILTROS_CONSULTAS.md)** - Sistema de filtros e buscas

### 🔧 Solução de Problemas
Documentação de problemas resolvidos e suas soluções.

- **[Solução: Mapeamento API](./solucoes/SOLUCAO_MAPEAMENTO_API.md)** - Como resolvemos o problema da grid em branco
- **[Status das Collections](./solucoes/STATUS_COLLECTIONS.md)** - Análise de dados disponíveis
- **[Troubleshooting](./solucoes/TROUBLESHOOTING.md)** - Guia de resolução de problemas comuns

### 🚀 Guias de Uso
Documentação para usuários e desenvolvedores.

- **[Início Rápido](./guias/INICIO_RAPIDO.md)** - Como começar a usar o sistema
- **[Guia do Usuário](./guias/GUIA_USUARIO.md)** - Manual completo para usuários
- **[Guia do Desenvolvedor](./guias/GUIA_DESENVOLVEDOR.md)** - Manual para desenvolvedores
- **[Exemplos de Uso](./guias/EXEMPLOS_USO.md)** - Casos de uso práticos

### 🧪 Testes
Documentação sobre testes e validações.

- **[Scripts de Teste](./testes/SCRIPTS_TESTE.md)** - Scripts para testar a API
- **[Validação de Dados](./testes/VALIDACAO_DADOS.md)** - Como validar os dados

## 🎯 Links Rápidos

### Para Usuários
- [Como usar o sistema](./guias/INICIO_RAPIDO.md)
- [Filtrar documentos](./logica/FILTROS_CONSULTAS.md)
- [Exportar para Excel](./guias/GUIA_USUARIO.md#exportação)

### Para Desenvolvedores
- [Estrutura do código](./arquitetura/ESTRUTURA_PROJETO.md)
- [Como funciona a API](./logica/INTEGRACAO_API.md)
- [Adicionar novos campos](./guias/GUIA_DESENVOLVEDOR.md#campos)

### Resolução de Problemas
- [Grid em branco](./solucoes/SOLUCAO_MAPEAMENTO_API.md)
- [Erro de autenticação](./solucoes/TROUBLESHOOTING.md#autenticação)
- [Dados não aparecem](./solucoes/STATUS_COLLECTIONS.md)

## 📊 Visão Geral do Sistema

O SpedRevio Dashboard é um sistema web moderno para visualização e gerenciamento de documentos fiscais eletrônicos, incluindo:

- **NF-e** - Notas Fiscais Eletrônicas
- **CF-e** - Cupons Fiscais Eletrônicos
- **CT-e** - Conhecimentos de Transporte Eletrônicos

### Principais Funcionalidades

✅ Visualização em grid avançada com filtros  
✅ Exportação para Excel  
✅ Filtros por data e CNPJ  
✅ Suporte a múltiplos tipos de documentos  
✅ Interface moderna e responsiva  
✅ Integração com API Revio  

## 🔄 Última Atualização

**Data:** 28/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Operacional

---

**Desenvolvido com ❤️ usando React, TypeScript e TanStack Table**
