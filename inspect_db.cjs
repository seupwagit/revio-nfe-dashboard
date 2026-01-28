
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function inspect() {
  const uri = process.env.VITE_MONGODB_CONNECTION_STRING;
  if (!uri) {
    console.error('MONGODB_URI não definida');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    // Tenta pegar o banco do URI ou usa o padrão
    const dbName = uri.split('/').pop().split('?')[0] || 'revio';
    const db = client.db(dbName);
    const collection = db.collection('tbl_nfe_100');
    
    const doc = await collection.findOne({});
    console.log('--- DOCUMENTO ENCONTRADO ---');
    console.log(JSON.stringify(doc, null, 2));
    console.log('--- FIM DO DOCUMENTO ---');
    
    if (doc) {
      console.log('Chaves de primeiro nível:', Object.keys(doc));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

inspect();
