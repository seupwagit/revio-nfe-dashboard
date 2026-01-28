# Como Desabilitar a Caixa de Busca de Documentos

## Visão Geral

Foi implementada uma funcionalidade simples para ocultar a caixa de busca natural nos componentes de grid do sistema. Esta funcionalidade usa o mínimo de código possível e é facilmente reversível.

## Implementação

### Propriedade `hideBusca`

Todos os componentes de grid agora aceitam uma propriedade opcional `hideBusca`:

- `GridPaginada`
- `GridPaginadaInteligente` 
- `GridPaginadaLocal`

### Como Usar

#### 1. Para Ocultar a Busca

```tsx
// Em qualquer página que usa GridPaginada
<GridPaginada
  data={notas}
  columns={columns}
  pageSize={50}
  hideBusca={true} // ← Adicionar esta linha para ocultar
/>
```

#### 2. Para Manter a Busca (Padrão)

```tsx
// Comportamento padrão - busca visível
<GridPaginada
  data={notas}
  columns={columns}
  pageSize={50}
  // hideBusca não especificado = false (busca visível)
/>

// Ou explicitamente
<GridPaginada
  data={notas}
  columns={columns}
  pageSize={50}
  hideBusca={false} // ← Busca visível
/>
```

## Exemplos Práticos

### Desabilitar em GridNFeSimples

```tsx
// apps/frontend/src/pages/GridNFeSimples.tsx
<GridPaginada
  data={notas}
  columns={columns}
  pageSize={50}
  hideBusca={true} // ← Oculta a caixa de busca
/>
```

### Desabilitar em GridCTeSimples

```tsx
// apps/frontend/src/pages/GridCTeSimples.tsx
<GridPaginada
  data={notas}
  columns={columns}
  pageSize={50}
  hideBusca={true} // ← Oculta a caixa de busca
/>
```

### Desabilitar em GridCFeSimples

```tsx
// apps/frontend/src/pages/GridCFeSimples.tsx
<GridPaginada
  data={notas}
  columns={columns}
  pageSize={50}
  hideBusca={true} // ← Oculta a caixa de busca
/>
```

## Componentes Afetados

### 1. GridPaginada
- **Arquivo**: `apps/frontend/src/components/GridPaginada.tsx`
- **Busca**: `BuscaNatural` (busca avançada com IA)
- **Uso**: Páginas principais de NFe, CTe, CFe

### 2. GridPaginadaInteligente
- **Arquivo**: `apps/frontend/src/components/GridPaginadaInteligente.tsx`
- **Busca**: `BuscaNatural` (busca avançada com IA)
- **Uso**: Grids com paginação inteligente

### 3. GridPaginadaLocal
- **Arquivo**: `apps/frontend/src/components/GridPaginadaLocal.tsx`
- **Busca**: `BuscaNaturalSimples` (busca simplificada)
- **Uso**: Grids com dados locais

## Vantagens da Implementação

### ✅ Mínimo de Código
- Apenas uma propriedade opcional adicionada
- Não quebra código existente
- Fácil de implementar e reverter

### ✅ Flexibilidade
- Pode ser aplicado seletivamente por página
- Pode ser controlado dinamicamente via estado
- Mantém toda funcionalidade existente

### ✅ Compatibilidade
- Totalmente compatível com código existente
- Não requer alterações em páginas que não querem ocultar
- Padrão é manter busca visível

## Controle Dinâmico

### Via Estado do Componente

```tsx
function MinhaPage() {
  const [ocultarBusca, setOcultarBusca] = useState(false)

  return (
    <div>
      <button onClick={() => setOcultarBusca(!ocultarBusca)}>
        {ocultarBusca ? 'Mostrar' : 'Ocultar'} Busca
      </button>
      
      <GridPaginada
        data={notas}
        columns={columns}
        hideBusca={ocultarBusca} // ← Controle dinâmico
      />
    </div>
  )
}
```

### Via Configuração Global

```tsx
// Criar um contexto ou configuração global
const HIDE_SEARCH_GLOBALLY = true

<GridPaginada
  data={notas}
  columns={columns}
  hideBusca={HIDE_SEARCH_GLOBALLY}
/>
```

## Reversão

Para reverter e mostrar a busca novamente:

1. **Remover a propriedade**:
   ```tsx
   <GridPaginada
     data={notas}
     columns={columns}
     // hideBusca={true} ← Remover esta linha
   />
   ```

2. **Ou definir como false**:
   ```tsx
   <GridPaginada
     data={notas}
     columns={columns}
     hideBusca={false} // ← Busca visível
   />
   ```

## Implementação Técnica

### Código Adicionado

```tsx
// Interface atualizada
interface GridPaginadaProps {
  data: any[]
  columns: ColumnDef<any, any>[]
  pageSize?: number
  hideBusca?: boolean // ← Nova propriedade
}

// Componente atualizado
export default function GridPaginada({ 
  data, 
  columns, 
  pageSize = 50, 
  hideBusca = false // ← Padrão false
}: GridPaginadaProps) {

// Renderização condicional
{!hideBusca && (
  <BuscaNatural onSearch={handleBuscaNatural} onClear={handleClearBusca} />
)}
```

### Arquivos Modificados

1. `apps/frontend/src/components/GridPaginada.tsx`
2. `apps/frontend/src/components/GridPaginadaInteligente.tsx`
3. `apps/frontend/src/components/GridPaginadaLocal.tsx`

## Conclusão

Esta implementação fornece uma maneira simples e eficaz de ocultar a caixa de busca de documentos usando o mínimo de código possível. A funcionalidade é:

- **Simples**: Apenas uma propriedade boolean
- **Flexível**: Pode ser aplicada seletivamente
- **Compatível**: Não quebra código existente
- **Reversível**: Fácil de desfazer

Para desabilitar a busca em qualquer página, basta adicionar `hideBusca={true}` ao componente de grid correspondente.