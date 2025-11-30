# 🎨 Guia de Design - SpedRevio Dashboard

## Identidade Visual

O SpedRevio Dashboard foi desenvolvido seguindo a identidade visual da **Revio**, com foco em modernidade, profissionalismo e usabilidade.

## 🎨 Paleta de Cores

### Cores Principais
```css
--revio-primary: #1e40af    /* Azul Principal */
--revio-secondary: #3b82f6  /* Azul Secundário */
--revio-accent: #60a5fa     /* Azul Claro (Accent) */
--revio-dark: #1e3a8a       /* Azul Escuro */
--revio-light: #dbeafe      /* Azul Muito Claro */
```

### Gradientes
```css
/* Gradiente Principal */
background: linear-gradient(to right, #1e40af, #3b82f6);

/* Gradiente de Fundo */
background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
```

### Escala de Cinza
```css
--revio-gray-50: #f9fafb
--revio-gray-100: #f3f4f6
--revio-gray-200: #e5e7eb
--revio-gray-300: #d1d5db
--revio-gray-400: #9ca3af
--revio-gray-500: #6b7280
--revio-gray-600: #4b5563
--revio-gray-700: #374151
--revio-gray-800: #1f2937
--revio-gray-900: #111827
```

## 📐 Componentes

### Botões

#### Botão Primário
```tsx
<button className="btn-primary">
  Ação Principal
</button>
```
- Gradiente azul
- Sombra suave
- Efeito hover com elevação
- Transição suave

#### Botão Secundário
```tsx
<button className="btn-secondary">
  Ação Secundária
</button>
```
- Fundo branco
- Borda azul
- Hover com fundo azul claro

### Cards

```tsx
<div className="card p-6">
  Conteúdo do Card
</div>
```
- Fundo branco
- Bordas arredondadas (12px)
- Sombra personalizada
- Hover com elevação

### Inputs

```tsx
<input className="input-field" />
```
- Borda dupla
- Focus com anel azul
- Transição suave
- Padding generoso

## 🎭 Elementos de Interface

### Header
- Fundo branco com transparência (backdrop-blur)
- Altura: 80px
- Logo com gradiente
- Menu de usuário

### Sidebar
- Cards com navegação
- Ícones com fundo colorido
- Estado ativo com gradiente
- Dica informativa no rodapé

### Footer
- Fundo semi-transparente
- Informações da empresa
- Links úteis

## 🌈 Status e Estados

### Status de Notas
```tsx
// Autorizada
className="bg-green-100 text-green-700"

// Cancelada
className="bg-red-100 text-red-700"

// Processando
className="bg-yellow-100 text-yellow-700"

// Denegada
className="bg-orange-100 text-orange-700"
```

### Loading
- Spinner duplo com gradiente
- Animação suave
- Texto informativo

## 📊 Cards de Estatísticas

### Estrutura
- Ícone com gradiente em destaque
- Título em uppercase
- Valor grande e bold
- Hover com scale

### Cores por Tipo
- **Azul**: Informações gerais
- **Verde**: Valores financeiros positivos
- **Vermelho**: Alertas e cancelamentos
- **Roxo**: Métricas especiais

## 🎯 Princípios de Design

### 1. Hierarquia Visual
- Títulos com gradiente para destaque
- Uso de peso de fonte (300-800)
- Espaçamento consistente (múltiplos de 4px)

### 2. Feedback Visual
- Transições suaves (200ms)
- Hover states em todos os elementos interativos
- Loading states claros

### 3. Responsividade
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Menu colapsável em mobile

### 4. Acessibilidade
- Contraste adequado (WCAG AA)
- Foco visível em elementos
- Textos alternativos

## 🖼️ Ícones

Utilizamos **Lucide React** para ícones:
- Tamanho padrão: 20px (h-5 w-5)
- Tamanho grande: 24px (h-6 w-6)
- Sempre com cor consistente

## 📱 Responsividade

### Mobile (< 768px)
- Menu hambúrguer
- Cards empilhados
- Tabelas com scroll horizontal

### Tablet (768px - 1024px)
- Sidebar visível
- Grid de 2 colunas

### Desktop (> 1024px)
- Layout completo
- Grid de 4 colunas
- Sidebar fixa

## ✨ Animações

### Transições
```css
transition: all 200ms ease-in-out
```

### Hover Effects
- Scale: `hover:scale-105`
- Translate: `hover:-translate-y-0.5`
- Shadow: `hover:shadow-revio-lg`

### Loading
- Spin: `animate-spin`
- Pulse: `animate-pulse`

## 🎨 Boas Práticas

1. **Consistência**: Use sempre as classes utilitárias definidas
2. **Espaçamento**: Múltiplos de 4px (1, 2, 3, 4, 6, 8, 12, 16...)
3. **Cores**: Sempre use as variáveis do tema
4. **Sombras**: Use `shadow-revio` e `shadow-revio-lg`
5. **Bordas**: Arredondamento padrão `rounded-lg` (8px) ou `rounded-xl` (12px)

## 🔧 Customização

Para personalizar o tema, edite:
- `tailwind.config.js` - Cores e configurações
- `src/index.css` - Classes utilitárias customizadas

## 📚 Referências

- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Revio Global](https://revio.global)
