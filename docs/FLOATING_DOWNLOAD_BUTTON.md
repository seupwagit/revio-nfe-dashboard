# Botão de Download Flutuante

## Visão Geral

O sistema de download flutuante foi implementado para melhorar a experiência do usuário ao selecionar documentos para download. O botão aparece automaticamente quando há itens selecionados e acompanha o scroll da página de forma inteligente.

## Características

### 🎯 Comportamento Inteligente

- **Aparece automaticamente** quando há documentos selecionados
- **Acompanha o scroll** quando o usuário rola a página para baixo
- **Retorna ao local original** quando a área original volta a ser visível
- **Desaparece automaticamente** quando a seleção é limpa

### 📱 Responsivo

- **Desktop**: Botão completo com todas as informações e dicas
- **Mobile**: Versão compacta otimizada para telas pequenas
- **Indicador visual** mostrando que o botão está flutuante

### ⚡ Performance

- **Throttle de scroll** para evitar cálculos excessivos
- **RequestAnimationFrame** para animações suaves
- **Listeners otimizados** com passive events

## Componentes

### FloatingDownloadButton

Componente principal que gerencia o botão de download flutuante.

```tsx
import FloatingDownloadButton from '../components/FloatingDownloadButton'
import { useRef } from 'react'

function MyPage() {
  const downloadContainerRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      {/* Seu conteúdo aqui */}
      
      {/* Container do botão de download */}
      <div ref={downloadContainerRef}>
        <FloatingDownloadButton 
          originalContainerRef={downloadContainerRef}
          className="mt-6"
          floatingTopOffset={20}
          floatingSideOffset={20}
        />
      </div>
    </div>
  )
}
```

#### Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `originalContainerRef` | `React.RefObject<HTMLElement>` | - | Referência ao elemento onde o botão deve aparecer originalmente |
| `className` | `string` | `''` | Classes CSS adicionais |
| `floatingTopOffset` | `number` | `20` | Distância do topo quando flutuante (px) |
| `floatingSideOffset` | `number` | `20` | Distância das laterais quando flutuante (px) |

### useFloatingPosition

Hook personalizado que gerencia a lógica de posicionamento flutuante.

```tsx
import { useFloatingPosition } from '../hooks/useFloatingPosition'

const position = useFloatingPosition({
  targetRef: myElementRef,
  shouldShow: selectionCount > 0,
  visibilityOffset: 50,
  scrollThrottle: 16
})

// position.isFloating - Se o elemento está flutuando
// position.shouldShow - Se o elemento deve ser mostrado
// position.isVisible - Se o elemento original está visível
```

#### Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `targetRef` | `React.RefObject<HTMLElement>` | - | Elemento de referência |
| `shouldShow` | `boolean` | - | Se deve mostrar o elemento |
| `visibilityOffset` | `number` | `0` | Offset para considerar visível |
| `scrollThrottle` | `number` | `16` | Throttle do scroll em ms (~60fps) |

### MobileSelectionIndicator

Indicador adicional para mobile que aparece no topo da tela.

```tsx
import MobileSelectionIndicator from '../components/MobileSelectionIndicator'

function MyPage() {
  const handleDownload = () => {
    // Lógica de download
  }

  return (
    <div>
      <MobileSelectionIndicator 
        onDownloadClick={handleDownload}
        showDownloadButton={true}
      />
      
      {/* Seu conteúdo aqui */}
    </div>
  )
}
```

## Fluxo de Funcionamento

### 1. Seleção de Documentos

```
Usuário seleciona documentos na grid
    ↓
SelectionManager atualiza o estado
    ↓
useSelection hook notifica componentes
    ↓
FloatingDownloadButton aparece
```

### 2. Scroll da Página

```
Usuário rola a página para baixo
    ↓
useFloatingPosition detecta mudança
    ↓
Calcula visibilidade do container original
    ↓
Se não visível: Botão flutua na parte inferior
Se visível: Botão volta ao local original
```

### 3. Confirmação de Download

```
Usuário clica em "Confirmar Download"
    ↓
Valida chaves selecionadas
    ↓
Envia requisição para backend
    ↓
Exibe mensagem de sucesso/erro
    ↓
Limpa seleção após 3 segundos
    ↓
Botão desaparece
```

## Animações

As animações são configuradas no `tailwind.config.js`:

```javascript
animation: {
  'slide-up': 'slideUp 0.3s ease-out',
  'fade-in': 'fadeIn 0.2s ease-out',
  'bounce-gentle': 'bounceGentle 0.6s ease-out',
}
```

### Animações Disponíveis

- **slide-up**: Desliza de baixo para cima quando flutua
- **fade-in**: Fade suave quando aparece
- **bounce-gentle**: Bounce suave para chamar atenção

## Estilos Responsivos

### Desktop (≥768px)

- Botão completo com ícone, texto e dicas
- Largura máxima de 600px
- Padding generoso para melhor clique
- Dicas adicionais visíveis

### Mobile (<768px)

- Botão compacto otimizado
- Texto reduzido ("Download" ao invés de "Confirmar Download")
- Indicador visual de estado flutuante
- Backdrop com blur quando flutuante

## Integração com Sistema de Seleção

O botão flutuante integra-se perfeitamente com o sistema de seleção existente:

```typescript
// SelectionManager gerencia o estado global
import { selectionManager } from '../services/SelectionManager'

// useSelection hook fornece interface React
import { useSelection } from '../hooks/useSelection'

// Componentes de seleção na grid
import SelectionCheckbox, { SelectionHeader } from '../components/SelectionCheckbox'
```

## Acessibilidade

- ✅ Suporte completo a teclado
- ✅ Labels ARIA apropriados
- ✅ Feedback visual claro
- ✅ Estados de loading e erro bem definidos
- ✅ Contraste adequado de cores

## Performance

### Otimizações Implementadas

1. **Throttle de Scroll**: Limita cálculos a ~60fps
2. **RequestAnimationFrame**: Sincroniza com refresh da tela
3. **Passive Event Listeners**: Não bloqueia scroll
4. **Cleanup Adequado**: Remove listeners quando desmonta
5. **Memoização**: Callbacks memoizados para evitar re-renders

### Métricas

- **Tempo de resposta ao scroll**: <16ms (60fps)
- **Tempo de animação**: 300ms (suave e perceptível)
- **Impacto no bundle**: ~3KB (gzipped)

## Troubleshooting

### Botão não aparece

1. Verifique se há documentos selecionados
2. Confirme que o `originalContainerRef` está definido
3. Verifique console para erros

### Botão não flutua

1. Verifique se o container original está fora da viewport
2. Confirme que o scroll está funcionando
3. Verifique se há erros no console

### Animações não funcionam

1. Confirme que o Tailwind está compilando corretamente
2. Verifique se as animações estão no `tailwind.config.js`
3. Limpe o cache do build

## Exemplos de Uso

### Exemplo Básico

```tsx
import { useRef } from 'react'
import FloatingDownloadButton from '../components/FloatingDownloadButton'

export default function MyGrid() {
  const downloadRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <GridPaginada data={data} columns={columns} />
      
      <div ref={downloadRef}>
        <FloatingDownloadButton originalContainerRef={downloadRef} />
      </div>
    </div>
  )
}
```

### Exemplo com Customização

```tsx
<FloatingDownloadButton 
  originalContainerRef={downloadRef}
  className="mt-8"
  floatingTopOffset={30}
  floatingSideOffset={15}
/>
```

### Exemplo com Indicador Mobile

```tsx
import MobileSelectionIndicator from '../components/MobileSelectionIndicator'
import FloatingDownloadButton from '../components/FloatingDownloadButton'

export default function MyGrid() {
  const downloadRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<{ handleDownload: () => void }>(null)

  return (
    <div>
      <MobileSelectionIndicator 
        onDownloadClick={() => buttonRef.current?.handleDownload()}
      />
      
      <GridPaginada data={data} columns={columns} />
      
      <div ref={downloadRef}>
        <FloatingDownloadButton 
          ref={buttonRef}
          originalContainerRef={downloadRef} 
        />
      </div>
    </div>
  )
}
```

## Manutenção

### Atualizando Animações

Edite `tailwind.config.js`:

```javascript
keyframes: {
  slideUp: {
    '0%': { transform: 'translateY(100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  }
}
```

### Ajustando Comportamento de Scroll

Edite `useFloatingPosition.ts`:

```typescript
const shouldFloat = !isElementVisible && rect.top < 0
```

### Modificando Estilos

Edite `FloatingDownloadButton.tsx`:

```typescript
const getContainerStyles = (): React.CSSProperties => {
  // Seus estilos personalizados aqui
}
```

## Roadmap

- [ ] Suporte a gestos de swipe no mobile
- [ ] Animação de contagem de itens selecionados
- [ ] Modo compacto para desktop
- [ ] Temas personalizáveis
- [ ] Suporte a múltiplos botões flutuantes

## Contribuindo

Para contribuir com melhorias:

1. Teste em diferentes dispositivos e navegadores
2. Mantenha a performance otimizada
3. Documente mudanças significativas
4. Adicione testes quando possível

## Licença

Este componente faz parte do sistema SpedRevio e segue a mesma licença do projeto principal.
