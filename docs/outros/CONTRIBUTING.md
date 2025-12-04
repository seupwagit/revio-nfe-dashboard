# 🤝 Guia de Contribuição - SpedRevio Dashboard

Obrigado por considerar contribuir com o SpedRevio Dashboard! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Melhorias](#sugerir-melhorias)

## 📜 Código de Conduta

Este projeto segue um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e colaborativo.

### Nossos Padrões

✅ **Comportamentos Esperados:**
- Usar linguagem acolhedora e inclusiva
- Respeitar diferentes pontos de vista
- Aceitar críticas construtivas
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros

❌ **Comportamentos Inaceitáveis:**
- Uso de linguagem ou imagens sexualizadas
- Comentários insultuosos ou depreciativos
- Assédio público ou privado
- Publicar informações privadas de terceiros
- Outras condutas antiéticas ou não profissionais

## 🚀 Como Contribuir

### 1. Fork o Projeto

```bash
# Clone seu fork
git clone https://github.com/seu-usuario/spedrevio-dashboard.git
cd spedrevio-dashboard
```

### 2. Crie uma Branch

```bash
# Crie uma branch para sua feature/fix
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-fix
```

### 3. Faça suas Alterações

- Siga os [Padrões de Código](#padrões-de-código)
- Adicione testes se aplicável
- Atualize a documentação se necessário

### 4. Commit suas Mudanças

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade X"
```

### 5. Push para o GitHub

```bash
git push origin feature/minha-feature
```

### 6. Abra um Pull Request

- Descreva suas mudanças claramente
- Referencie issues relacionadas
- Aguarde review

## 💻 Padrões de Código

### TypeScript

```typescript
// ✅ BOM
interface NotaFiscal {
  id: string
  numero: string
  valorTotal: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// ❌ RUIM
interface nota {
  ID: string
  Numero: string
  valor: number
}

function format(v) {
  return v.toFixed(2)
}
```

### React Components

```tsx
// ✅ BOM
export default function NotaCard({ nota }: NotaCardProps) {
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate(`/notas/${nota.id}`)
  }
  
  return (
    <div onClick={handleClick} className="card">
      {/* conteúdo */}
    </div>
  )
}

// ❌ RUIM
export default function NotaCard(props) {
  return (
    <div onClick={() => window.location.href = '/notas/' + props.nota.id}>
      {/* conteúdo */}
    </div>
  )
}
```

### CSS/Tailwind

```tsx
// ✅ BOM - Use classes utilitárias do tema
<button className="btn-primary">
  Clique Aqui
</button>

<div className="card p-6">
  Conteúdo
</div>

// ❌ RUIM - Evite estilos inline
<button style={{ background: 'blue', color: 'white' }}>
  Clique Aqui
</button>
```

### Nomenclatura

#### Arquivos
- Componentes: `PascalCase.tsx` (ex: `NotaCard.tsx`)
- Utilitários: `camelCase.ts` (ex: `formatters.ts`)
- Páginas: `PascalCase.tsx` (ex: `Dashboard.tsx`)

#### Variáveis e Funções
```typescript
// ✅ BOM
const totalNotas = 10
const valorTotal = 1000.50
function calcularTotal() { }
function formatarData() { }

// ❌ RUIM
const TotalNotas = 10
const valor_total = 1000.50
function CalcularTotal() { }
function formatar_data() { }
```

#### Componentes
```typescript
// ✅ BOM
function NotaCard() { }
function LoadingSpinner() { }
function StatsCard() { }

// ❌ RUIM
function notaCard() { }
function loading_spinner() { }
function statscard() { }
```

### Commits

Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Tipos de commit
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação, ponto e vírgula, etc
refactor: refatoração de código
test: adição de testes
chore: atualização de build, etc

# Exemplos
git commit -m "feat: adiciona filtro por CNPJ"
git commit -m "fix: corrige ordenação na grid"
git commit -m "docs: atualiza README com novos exemplos"
git commit -m "style: formata código com prettier"
git commit -m "refactor: simplifica lógica de filtros"
```

## 🔄 Processo de Pull Request

### Checklist

Antes de abrir um PR, verifique:

- [ ] Código segue os padrões do projeto
- [ ] Testes passam (`npm run test` se aplicável)
- [ ] Build funciona (`npm run build`)
- [ ] Documentação atualizada
- [ ] Commits seguem o padrão
- [ ] Branch está atualizada com main

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Passo 3

## Screenshots (se aplicável)
Cole screenshots aqui

## Checklist
- [ ] Código testado
- [ ] Documentação atualizada
- [ ] Padrões seguidos
```

## 🐛 Reportar Bugs

### Antes de Reportar

1. Verifique se o bug já foi reportado
2. Verifique se está usando a versão mais recente
3. Tente reproduzir o bug

### Template de Bug Report

```markdown
## Descrição do Bug
Descrição clara e concisa do bug

## Como Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## Comportamento Esperado
O que deveria acontecer

## Comportamento Atual
O que está acontecendo

## Screenshots
Se aplicável, adicione screenshots

## Ambiente
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 120]
- Versão: [ex: 1.0.0]

## Informações Adicionais
Qualquer outra informação relevante
```

## 💡 Sugerir Melhorias

### Template de Feature Request

```markdown
## Descrição da Funcionalidade
Descrição clara da funcionalidade desejada

## Problema que Resolve
Qual problema esta funcionalidade resolve?

## Solução Proposta
Como você imagina que funcione?

## Alternativas Consideradas
Outras soluções que você considerou?

## Informações Adicionais
Mockups, exemplos, etc
```

## 🎨 Contribuindo com Design

### Diretrizes de Design

1. **Siga a identidade visual da Revio**
   - Use a paleta de cores definida
   - Mantenha consistência com componentes existentes

2. **Acessibilidade**
   - Contraste mínimo WCAG AA
   - Navegação por teclado
   - Textos alternativos

3. **Responsividade**
   - Mobile-first
   - Teste em diferentes tamanhos
   - Use breakpoints do Tailwind

### Recursos

- [DESIGN.md](DESIGN.md) - Guia de design
- [CORES_REVIO.md](CORES_REVIO.md) - Paleta de cores
- [Tailwind CSS](https://tailwindcss.com)

## 📚 Contribuindo com Documentação

### O que Documentar

- Novas funcionalidades
- Mudanças em APIs
- Exemplos de uso
- Troubleshooting

### Estilo de Documentação

- Use Markdown
- Seja claro e conciso
- Adicione exemplos de código
- Use emojis para melhor visualização

## 🧪 Testes

### Executar Testes

```bash
# Executar todos os testes
npm run test

# Executar com coverage
npm run test:coverage

# Executar em watch mode
npm run test:watch
```

### Escrever Testes

```typescript
// Exemplo de teste
describe('NotaCard', () => {
  it('deve renderizar corretamente', () => {
    const nota = {
      id: '1',
      numero: '000001',
      // ...
    }
    
    render(<NotaCard nota={nota} />)
    
    expect(screen.getByText('NF-e 000001/1')).toBeInTheDocument()
  })
})
```

## 🏆 Reconhecimento

Contribuidores serão reconhecidos:
- No CHANGELOG.md
- Na seção de contribuidores do GitHub
- Nos releases notes

## 📞 Dúvidas?

- Abra uma issue com a tag `question`
- Consulte a [documentação completa](INDEX.md)
- Entre em contato com a equipe Revio

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

**Obrigado por contribuir com o SpedRevio Dashboard!** 🎉

Desenvolvido com ❤️ pela comunidade Revio
