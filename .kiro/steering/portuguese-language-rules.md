# Steering: Regras de Idioma - Português Brasileiro Obrigatório

## **REGRA CRÍTICA DE IDIOMA**

### **Português Brasileiro Obrigatório para Toda Comunicação**

**SEMPRE usar português brasileiro em:**
- ✅ **Respostas do chat**: Todas as respostas devem ser em português brasileiro
- ✅ **Documentação (.md)**: Todos os arquivos markdown devem ser em português
- ✅ **Comentários de código**: Comentários explicativos em português
- ✅ **Mensagens de commit**: Commits em português brasileiro
- ✅ **Logs e mensagens de erro**: Mensagens para usuário em português
- ✅ **Especificações**: Requirements, design e tasks em português
- ✅ **Testes**: Descrições de testes em português
- ✅ **README e documentação técnica**: Toda documentação em português

**Exceções permitidas (apenas quando necessário):**
- ⚠️ **Código fonte**: Nomes de variáveis, funções e classes podem ser em inglês (padrão da indústria)
- ⚠️ **APIs externas**: Quando integrar com APIs que exigem inglês
- ⚠️ **Bibliotecas**: Nomes de bibliotecas e frameworks mantêm nomenclatura original

### **Padrões de Comunicação**

**Respostas do chat:**
```
✅ CORRETO:
"Vou implementar a funcionalidade de manifestação de NFe seguindo os requisitos especificados."

❌ INCORRETO:
"I will implement the NFe manifestation functionality following the specified requirements."
```

**Documentação:**
```markdown
✅ CORRETO:
# Funcionalidade de Manifestação de NFe

## Visão Geral
Esta funcionalidade permite aos usuários agendar manifestações...

❌ INCORRETO:
# NFe Manifestation Feature

## Overview
This feature allows users to schedule manifestations...
```

**Comentários de código:**
```typescript
✅ CORRETO:
// Valida se o tipo de manifestação foi selecionado
if (!selectedManifestationType) {
  throw new ValidationError('Tipo de manifestação é obrigatório');
}

❌ INCORRETO:
// Validate if manifestation type was selected
if (!selectedManifestationType) {
  throw new ValidationError('Manifestation type is required');
}
```

### **Mensagens de Sistema**

**Mensagens de erro e feedback:**
```typescript
✅ CORRETO:
const ERROR_MESSAGES = {
  'MANIFESTATION_TYPE_REQUIRED': 'Por favor, selecione um tipo de manifestação antes de continuar.',
  'NO_DOCUMENTS_SELECTED': 'Selecione pelo menos um documento para manifestar.',
  'INVALID_ACCESS_KEY': 'Uma ou mais chaves de acesso possuem formato inválido.'
};

❌ INCORRETO:
const ERROR_MESSAGES = {
  'MANIFESTATION_TYPE_REQUIRED': 'Please select a manifestation type before continuing.',
  'NO_DOCUMENTS_SELECTED': 'Select at least one document to manifest.',
  'INVALID_ACCESS_KEY': 'One or more access keys have invalid format.'
};
```

**Logs estruturados:**
```typescript
✅ CORRETO:
logger.info('Manifestação agendada com sucesso', {
  userId: user.id,
  totalDocuments: documents.length,
  manifestationType: type
});

❌ INCORRETO:
logger.info('Manifestation scheduled successfully', {
  userId: user.id,
  totalDocuments: documents.length,
  manifestationType: type
});
```

### **Especificações e Documentação Técnica**

**Estrutura de documentos:**
```markdown
✅ CORRETO:
# Documento de Requisitos

## Introdução
O sistema de agendamento de manifestação de NFe permite...

## Glossário
- **Sistema**: O Sistema de Agendamento de Manifestação de NFe
- **Usuário**: Usuário autenticado com acesso ao dashboard
- **Manifestação**: Declaração formal ou resposta a um documento NFe

## Requisitos

### Requisito 1: Seleção de Tipo de Manifestação
**História do Usuário:** Como usuário, eu quero selecionar um tipo de manifestação...

❌ INCORRETO:
# Requirements Document

## Introduction
The NFe manifestation scheduling system allows...

## Glossary
- **System**: The NFe Manifestation Scheduling System
- **User**: Authenticated user with dashboard access
- **Manifestation**: A formal declaration or response to an NFe document

## Requirements

### Requirement 1: Manifestation Type Selection
**User Story:** As a user, I want to select a manifestation type...
```

### **Testes e Validação**

**Descrições de testes:**
```typescript
✅ CORRETO:
describe('Serviço de Manifestação', () => {
  describe('agendarManifestacoes', () => {
    it('deve criar registros únicos para cada chave de acesso', async () => {
      // Implementação do teste
    });

    it('deve prevenir duplicatas para mesma chave e tipo', async () => {
      // Implementação do teste
    });
  });
});

❌ INCORRETO:
describe('Manifestation Service', () => {
  describe('scheduleManifestations', () => {
    it('should create unique records for each access key', async () => {
      // Test implementation
    });

    it('should prevent duplicates for same key and type', async () => {
      // Test implementation
    });
  });
});
```

### **Commits e Versionamento**

**Mensagens de commit:**
```bash
✅ CORRETO:
git commit -m "feat: implementa seleção de tipo de manifestação"
git commit -m "fix: corrige validação de chaves de acesso"
git commit -m "docs: atualiza documentação de manifestação"

❌ INCORRETO:
git commit -m "feat: implement manifestation type selection"
git commit -m "fix: fix access key validation"
git commit -m "docs: update manifestation documentation"
```

### **Interface do Usuário**

**Textos da interface:**
```typescript
✅ CORRETO:
const UI_TEXTS = {
  manifestationButton: 'Manifestar',
  selectType: 'Selecionar Tipo',
  confirmAction: 'Confirmar Manifestação',
  loadingMessage: 'Agendando manifestações...',
  successMessage: 'Manifestações agendadas com sucesso!',
  errorMessage: 'Erro ao agendar manifestações. Tente novamente.'
};

❌ INCORRETO:
const UI_TEXTS = {
  manifestationButton: 'Manifest',
  selectType: 'Select Type',
  confirmAction: 'Confirm Manifestation',
  loadingMessage: 'Scheduling manifestations...',
  successMessage: 'Manifestations scheduled successfully!',
  errorMessage: 'Error scheduling manifestations. Please try again.'
};
```

### **Validação de Conformidade**

**Checklist obrigatório antes de qualquer entrega:**
- [ ] ✅ Todas as respostas do chat estão em português brasileiro
- [ ] ✅ Documentação (.md) está em português brasileiro
- [ ] ✅ Comentários de código estão em português
- [ ] ✅ Mensagens de erro e feedback estão em português
- [ ] ✅ Logs estruturados estão em português
- [ ] ✅ Descrições de testes estão em português
- [ ] ✅ Textos da interface estão em português
- [ ] ✅ Commits estão em português brasileiro

### **Exceções Técnicas Permitidas**

**Código fonte (nomenclatura):**
```typescript
✅ PERMITIDO:
interface ManifestationType {
  id: string;
  codigo: string;
  descricao: string;
}

class ManifestationService {
  async scheduleManifestations(params: ManifestationParams) {
    // Comentário em português: Valida parâmetros de entrada
    return this.processManifestations(params);
  }
}
```

**APIs e bibliotecas externas:**
```typescript
✅ PERMITIDO:
import express from 'express';
import { Request, Response } from 'express';

// Comentário em português: Configura rota para manifestações
app.post('/api/manifestations/schedule', async (req: Request, res: Response) => {
  // Lógica em português nos comentários
});
```

### **Aplicação Retroativa**

**Para documentos existentes:**
- Documentos existentes em inglês devem ser traduzidos quando modificados
- Novos documentos devem sempre ser criados em português
- Especificações e designs devem ser atualizados para português

**Para código existente:**
- Comentários novos devem ser em português
- Mensagens de usuário devem ser traduzidas
- Logs devem ser atualizados para português quando modificados

---

**IMPORTANTE**: Esta regra se aplica a TODA comunicação e documentação do projeto. O português brasileiro é o idioma oficial para interação com usuários, documentação técnica e comunicação da equipe.