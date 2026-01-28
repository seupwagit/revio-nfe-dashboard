import { ManifestationType } from '@fiscal/shared/types/manifestation/manifestation-type.interface';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { manifestationService } from '../services/manifestationService';

interface ManifestationTypeSelectorProps {
  selectedType: string | null;
  onTypeChange: (typeCode: string | null) => void;
  disabled?: boolean;
}

export function ManifestationTypeSelector({
  selectedType,
  onTypeChange,
  disabled = false
}: ManifestationTypeSelectorProps) {
  const [types, setTypes] = useState<ManifestationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoading(true);
        const availableTypes = await manifestationService.getAvailableTypes();
        setTypes(availableTypes.filter(t => t.ativo));
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar tipos de manifestação:', err);
        setError('Erro ao carregar tipos');
      } finally {
        setIsLoading(false);
      }
    }

    loadTypes();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTypes = types.filter(type =>
    type.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTypeData = types.find(t => t.codigo === selectedType);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-revio-gray-500 text-sm py-2 px-3 border border-revio-gray-200 rounded-lg bg-revio-gray-50 animate-pulse w-full sm:w-64">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando tipos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm py-2 px-3 border border-red-200 rounded-lg bg-red-50 w-full sm:w-64">
        {error}
      </div>
    );
  }

  return (
    <div className="relative inline-block w-full sm:w-72" ref={wrapperRef}>
      <label className="block text-xs font-bold text-revio-gray-500 uppercase tracking-wider mb-1 px-1">
        Tipo de Manifestação
      </label>
      <div
        className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-lg bg-white cursor-pointer transition-all duration-200 ${
          isOpen ? 'border-revio-primary ring-2 ring-revio-primary/10' : 'border-revio-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-revio-gray-400'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`truncate ${!selectedTypeData ? 'text-revio-gray-400' : 'text-revio-gray-900 font-medium'}`}>
          {selectedTypeData ? selectedTypeData.descricao : 'Selecione a Manifestação'}
        </span>
        <div className="flex items-center ml-2 space-x-1">
          {selectedType && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTypeChange(null);
                setSearchTerm('');
              }}
              className="p-1 hover:bg-revio-gray-100 rounded-full text-revio-gray-400 hover:text-revio-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-revio-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-revio-gray-200 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-revio-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-revio-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar tipo..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-revio-gray-200 rounded-md focus:outline-none focus:border-revio-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredTypes.length > 0 ? (
              filteredTypes.map((type) => (
                <button
                  key={type.codigo}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedType === type.codigo
                      ? 'bg-revio-primary/10 text-revio-primary font-semibold'
                      : 'text-revio-gray-700 hover:bg-revio-gray-50'
                  }`}
                  onClick={() => {
                    onTypeChange(type.codigo);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="flex flex-col">
                    <span>{type.descricao}</span>
                    <span className="text-[10px] opacity-60 uppercase tracking-tighter">Código: {type.codigo}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-revio-gray-500 text-center italic">
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
