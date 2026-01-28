// MongoDB Initialization Script for Development
print('🚀 Inicializando MongoDB para desenvolvimento...');

// Criar usuário de desenvolvimento
db = db.getSiblingDB('fiscal_dev');

db.createUser({
  user: 'fiscal_user',
  pwd: 'fiscal_password',
  roles: [
    {
      role: 'readWrite',
      db: 'fiscal_dev'
    }
  ]
});

// Criar collections básicas para desenvolvimento
db.createCollection('nfe_documents');
db.createCollection('cte_documents');
db.createCollection('cfe_documents');

// Inserir dados de exemplo (opcional)
db.nfe_documents.insertOne({
  _id: ObjectId(),
  chNFe: '35200714200166000187550010000000001123456789',
  dhEmi: new Date(),
  emit: {
    CNPJ: '14200166000187',
    xNome: 'Empresa Exemplo LTDA'
  },
  dest: {
    CNPJ: '11222333000144',
    xNome: 'Cliente Exemplo'
  },
  total: {
    vNF: 1000.00
  },
  status: 'autorizada',
  createdAt: new Date()
});

print('✅ MongoDB inicializado com sucesso!');
print('📊 Collections criadas: nfe_documents, cte_documents, cfe_documents');
print('👤 Usuário criado: fiscal_user');
print('🔗 Connection string: mongodb://fiscal_user:fiscal_password@localhost:27017/fiscal_dev');