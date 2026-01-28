/**
 * 🗄️ IndexedDB Service - Banco de Dados Local
 * Armazena grandes volumes de dados sem travar o navegador
 */

const DB_NAME = 'RevioGridDB'
const DB_VERSION = 1
const STORE_NAME = 'notas'

class IndexedDBService {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB inicializado')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Criar object store se não existir
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
          
          // Criar índices para busca rápida
          store.createIndex('collection', 'collection', { unique: false })
          store.createIndex('dataEmissao', 'dataEmissao', { unique: false })
          store.createIndex('numero', 'numero', { unique: false })
          store.createIndex('valorTotal', 'valorTotal', { unique: false })
          
          console.log('📦 Object store criado com índices')
        }
      }
    })
  }

  async salvarNotas(collection: string, notas: any[]): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      // Limpar dados antigos da collection
      const index = store.index('collection')
      const request = index.openCursor(IDBKeyRange.only(collection))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        // Adicionar novos dados
        const addTransaction = this.db!.transaction([STORE_NAME], 'readwrite')
        const addStore = addTransaction.objectStore(STORE_NAME)

        notas.forEach(nota => {
          addStore.add({ ...nota, collection })
        })

        addTransaction.oncomplete = () => {
          console.log(`✅ ${notas.length} notas salvas no IndexedDB`)
          resolve()
        }
        addTransaction.onerror = () => reject(addTransaction.error)
      }

      transaction.onerror = () => reject(transaction.error)
    })
  }

  async buscarNotas(collection: string, filtros?: any): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('collection')
      const request = index.getAll(IDBKeyRange.only(collection))

      request.onsuccess = () => {
        let notas = request.result

        // Aplicar filtros se fornecidos
        if (filtros) {
          notas = this.aplicarFiltros(notas, filtros)
        }

        console.log(`📊 ${notas.length} notas recuperadas do IndexedDB`)
        resolve(notas)
      }

      request.onerror = () => reject(request.error)
    })
  }

  private aplicarFiltros(notas: any[], filtros: any): any[] {
    return notas.filter(nota => {
      // Filtro por data
      if (filtros.dataInicio && nota.dataEmissao < filtros.dataInicio) return false
      if (filtros.dataFim && nota.dataEmissao > filtros.dataFim) return false

      // Filtro por valor
      if (filtros.valorMin && nota.valorTotal < filtros.valorMin) return false
      if (filtros.valorMax && nota.valorTotal > filtros.valorMax) return false

      // Filtro por status
      if (filtros.status && nota.status !== filtros.status) return false

      // Filtro por texto
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase()
        const texto = JSON.stringify(nota).toLowerCase()
        if (!texto.includes(busca)) return false
      }

      return true
    })
  }

  async limparCollection(collection: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('collection')
      const request = index.openCursor(IDBKeyRange.only(collection))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        console.log(`🗑️ Collection ${collection} limpa do IndexedDB`)
        resolve()
      }

      transaction.onerror = () => reject(transaction.error)
    })
  }

  async contarNotas(collection: string): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('collection')
      const request = index.count(IDBKeyRange.only(collection))

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async limparTudo(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('🗑️ IndexedDB limpo completamente')
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton
export const indexedDBService = new IndexedDBService()
