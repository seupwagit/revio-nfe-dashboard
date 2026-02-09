# 📄 Documentação: Modal de Termos de Uso

Esta documentação descreve a implementação, o comportamento e o conteúdo do modal de aceite de termos de uso integrado ao sistema SpedRevio.

## 🚀 Implementação Técnica

O modal foi implementado como um componente React autônomo que gerencia sua própria visibilidade e persistência.

### Detalhes do Componente
- **Arquivo**: `apps/frontend/src/components/TermsModal.tsx`
- **Integração**: Renderizado globalmente no `Layout.tsx` para assegurar a cobertura de todas as rotas protegidas.
- **Estilização**: Utiliza Tailwind CSS com os tokens de design do Revio (cores `revio-primary`, `revio-secondary`, sombras e animações).

### Lógica de Persistência
O aceite do usuário é armazenado localmente no navegador para evitar exibições repetitivas.
- **Mecanismo**: `localStorage`
- **Chave**: `revio_terms_accepted_v1`
- **Valor**: `true` (quando aceito)

---

## 📝 Conteúdo dos Termos

Abaixo está o texto íntegro contido no modal (Versão V1):

### 1. Aceitação dos Termos
Ao utilizar a plataforma SpedRevio, você concorda expressamente com os presentes Termos de Uso e Política de Privacidade. Este dashboard é uma ferramenta de uso profissional para gestão de documentos fiscais eletrônicos.

### 2. Uso dos Dados
O sistema processa informações extraídas de NF-e, CT-e e CF-e armazenadas no banco de dados da sua organização. O usuário é responsável por manter o sigilo de suas credenciais de acesso e pela legalidade das consultas realizadas.

### 3. Responsabilidades
A Revio garante a disponibilidade das funcionalidades descritas, mas não se responsabiliza por inconsistências nos dados originários da SEFAZ ou de outros órgãos emissores. O uso das informações contidas aqui é de inteira responsabilidade do cliente.

### 4. Privacidade e LGPD
Seguimos rigorosamente a LGPD (Lei Geral de Proteção de Dados). Nenhum dado fiscal carregado nesta ferramenta é compartilhado com terceiros sem autorização expressa do contratante, sendo utilizado exclusivamente para os fins de auditoria e gestão previstos no contrato de licença.

---

## 🛠️ Manutenção e Alterações

Se houver necessidade de atualizar o texto dos termos e forçar um novo aceite de todos os usuários:
1. Altere o texto no arquivo `TermsModal.tsx`.
2. Incremente a versão na constante `STORAGE_KEY` (ex: de `_v1` para `_v2`).

---
*Última atualização: 02 de Fevereiro de 2026*
