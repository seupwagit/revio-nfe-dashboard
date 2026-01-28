export type CollectionType = 'tbl_nfe_100' | 'tbl_cfe_100' | 'tbl_cte_100'

interface CollectionSelectorProps {
  value: CollectionType
  onChange: (collection: CollectionType) => void
}

const collections = [
  { value: 'tbl_nfe_100' as CollectionType, label: 'NF-e', description: 'Notas Fiscais Eletrônicas', icon: '📄' },
  { value: 'tbl_cfe_100' as CollectionType, label: 'CF-e', description: 'Cupons Fiscais Eletrônicos', icon: '🧾' },
  { value: 'tbl_cte_100' as CollectionType, label: 'CT-e', description: 'Conhecimentos de Transporte', icon: '🚚' },
]

export default function CollectionSelector({ value, onChange }: CollectionSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipo de Documento</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {collections.map((collection) => (
          <button
            key={collection.value}
            onClick={() => onChange(collection.value)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              value === collection.value
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{collection.icon}</span>
              <div>
                <div className={`font-bold text-lg ${
                  value === collection.value ? 'text-blue-600' : 'text-gray-800'
                }`}>
                  {collection.label}
                </div>
                <div className="text-xs text-gray-600">{collection.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
