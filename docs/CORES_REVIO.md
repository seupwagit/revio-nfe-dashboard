# 🎨 Paleta de Cores - SpedRevio Dashboard

## Cores Principais da Revio

### Azul Principal
```
Hex: #1e40af
RGB: rgb(30, 64, 175)
Nome: revio-primary
Uso: Botões primários, títulos, elementos de destaque
```
🟦 **#1e40af** - Azul profissional que transmite confiança e estabilidade

### Azul Secundário
```
Hex: #3b82f6
RGB: rgb(59, 130, 246)
Nome: revio-secondary
Uso: Gradientes, hover states, elementos secundários
```
🔵 **#3b82f6** - Azul vibrante para elementos interativos

### Azul Claro (Accent)
```
Hex: #60a5fa
RGB: rgb(96, 165, 250)
Nome: revio-accent
Uso: Focus rings, highlights, elementos de ênfase
```
💙 **#60a5fa** - Azul claro para destaques suaves

### Azul Escuro
```
Hex: #1e3a8a
RGB: rgb(30, 58, 138)
Nome: revio-dark
Uso: Textos importantes, elementos de contraste
```
🔷 **#1e3a8a** - Azul escuro para contraste forte

### Azul Muito Claro
```
Hex: #dbeafe
RGB: rgb(219, 234, 254)
Nome: revio-light
Uso: Backgrounds, hover states, elementos sutis
```
🩵 **#dbeafe** - Azul muito claro para fundos

## Gradientes

### Gradiente Principal
```css
background: linear-gradient(to right, #1e40af, #3b82f6);
```
Uso: Botões primários, headers, elementos de destaque

### Gradiente de Fundo
```css
background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
```
Uso: Background da aplicação

### Gradiente de Cards
```css
background: linear-gradient(to bottom right, #1e40af, #3b82f6);
```
Uso: Ícones em cards, elementos decorativos

## Cores de Status

### Sucesso (Autorizada)
```
Background: #dcfce7 (green-100)
Text: #15803d (green-700)
```
✅ Verde para notas autorizadas

### Erro (Cancelada)
```
Background: #fee2e2 (red-100)
Text: #b91c1c (red-700)
```
❌ Vermelho para notas canceladas

### Aviso (Processando)
```
Background: #fef3c7 (yellow-100)
Text: #a16207 (yellow-700)
```
⚠️ Amarelo para notas em processamento

### Informação (Denegada)
```
Background: #fed7aa (orange-100)
Text: #c2410c (orange-700)
```
🔶 Laranja para notas denegadas

## Escala de Cinza

### Gray 50
```
Hex: #f9fafb
Uso: Backgrounds muito claros
```

### Gray 100
```
Hex: #f3f4f6
Uso: Backgrounds de cards, separadores
```

### Gray 200
```
Hex: #e5e7eb
Uso: Bordas, divisores
```

### Gray 300
```
Hex: #d1d5db
Uso: Bordas mais visíveis
```

### Gray 400
```
Hex: #9ca3af
Uso: Ícones secundários, placeholders
```

### Gray 500
```
Hex: #6b7280
Uso: Textos secundários
```

### Gray 600
```
Hex: #4b5563
Uso: Textos normais
```

### Gray 700
```
Hex: #374151
Uso: Textos importantes
```

### Gray 800
```
Hex: #1f2937
Uso: Textos muito importantes
```

### Gray 900
```
Hex: #111827
Uso: Títulos, textos principais
```

## Sombras Personalizadas

### Shadow Revio
```css
box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.1), 
            0 2px 4px -1px rgba(30, 64, 175, 0.06);
```
Uso: Cards, botões, elementos elevados

### Shadow Revio Large
```css
box-shadow: 0 10px 15px -3px rgba(30, 64, 175, 0.1), 
            0 4px 6px -2px rgba(30, 64, 175, 0.05);
```
Uso: Modais, dropdowns, elementos muito elevados

## Aplicação das Cores

### Botões

#### Primário
```tsx
className="bg-gradient-to-r from-revio-primary to-revio-secondary text-white"
```

#### Secundário
```tsx
className="bg-white text-revio-primary border-2 border-revio-primary"
```

### Cards
```tsx
className="bg-white rounded-xl shadow-revio"
```

### Inputs
```tsx
className="border-2 border-revio-gray-200 focus:ring-2 focus:ring-revio-accent"
```

### Títulos
```tsx
className="bg-gradient-to-r from-revio-primary to-revio-secondary bg-clip-text text-transparent"
```

## Acessibilidade

### Contraste de Cores

Todas as combinações de cores seguem as diretrizes WCAG 2.1 AA:

✅ **Texto Escuro em Fundo Claro**
- Gray-900 (#111827) em White (#ffffff) - Contraste: 16.1:1

✅ **Texto Claro em Fundo Escuro**
- White (#ffffff) em Primary (#1e40af) - Contraste: 7.2:1

✅ **Texto em Botões**
- White (#ffffff) em Primary (#1e40af) - Contraste: 7.2:1

### Recomendações

1. **Nunca use** texto cinza claro (gray-400) em fundo branco
2. **Sempre use** gray-600 ou mais escuro para textos
3. **Prefira** gray-900 para títulos e textos importantes
4. **Use** white apenas em fundos escuros (primary, secondary)

## Exemplos de Uso

### Dashboard
```tsx
// Card de Estatística
<div className="bg-white rounded-xl shadow-revio p-6">
  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
    <Icon className="h-8 w-8 text-white" />
  </div>
</div>
```

### Nota Fiscal
```tsx
// Card de Nota
<div className="card p-6 hover:scale-[1.02]">
  <div className="p-2 bg-gradient-to-br from-revio-primary to-revio-secondary rounded-lg">
    <Building2 className="h-5 w-5 text-white" />
  </div>
</div>
```

### Status Badge
```tsx
// Badge Autorizada
<span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
  AUTORIZADA
</span>
```

## Ferramentas Úteis

### Geradores de Gradiente
- [CSS Gradient](https://cssgradient.io/)
- [Gradient Hunt](https://gradienthunt.com/)

### Verificadores de Contraste
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)

### Paletas de Cores
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)
- [Color Hunt](https://colorhunt.co/)

## Exportação de Cores

### Para Figma
```
Primary: #1e40af
Secondary: #3b82f6
Accent: #60a5fa
Light: #dbeafe
Dark: #1e3a8a
```

### Para CSS Variables
```css
:root {
  --revio-primary: #1e40af;
  --revio-secondary: #3b82f6;
  --revio-accent: #60a5fa;
  --revio-light: #dbeafe;
  --revio-dark: #1e3a8a;
}
```

### Para JavaScript
```javascript
const colors = {
  primary: '#1e40af',
  secondary: '#3b82f6',
  accent: '#60a5fa',
  light: '#dbeafe',
  dark: '#1e3a8a'
}
```

---

**SpedRevio Dashboard** - Paleta de cores profissional e acessível

Baseado na identidade visual da [Revio](https://revio.global)
