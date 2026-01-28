import { useNF } from '../contexts/NFContext'
import CollectionSelector from '../components/CollectionSelector'
import FiltroNotas from '../components/FiltroNotas'
import GridNFeSimples from './GridNFeSimples'
import GridCFeSimples from './GridCFeSimples'
import GridCTeSimples from './GridCTeSimples'

export default function NotasFiscaisUnificada() {
  const { collection, setCollection } = useNF()

  const titles = {
    tbl_nfe_100: 'Notas Fiscais Eletrônicas (NF-e)',
    tbl_cfe_100: 'Cupons Fiscais Eletrônicos (CF-e/SAT)',
    tbl_cte_100: 'Conhecimentos de Transporte Eletrônicos (CT-e)'
  }

  const grids = {
    tbl_nfe_100: <GridNFeSimples />,
    tbl_cfe_100: <GridCFeSimples />,
    tbl_cte_100: <GridCTeSimples />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-revio-primary to-revio-secondary bg-clip-text text-transparent">
          {titles[collection]}
        </h2>
        <p className="text-revio-gray-600 mt-2 font-medium">
          Consulta e gerenciamento de documentos fiscais eletrônicos
        </p>
      </div>

      {/* Collection Selector */}
      <CollectionSelector value={collection} onChange={setCollection} />

      {/* Filtros */}
      <FiltroNotas />

      {/* Grid baseada na collection */}
      {grids[collection]}
    </div>
  )
}
