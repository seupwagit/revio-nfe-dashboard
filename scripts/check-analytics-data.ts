
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function run() {
  const connectionString = process.env.VITE_MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/spedrevio';
  console.log('Connecting to:', connectionString);
  
  try {
    const conn = await mongoose.createConnection(connectionString).asPromise();
    console.log('Connected to MongoDB');
    
    // Switch to the user's database
    const dbName = 'C03205493000941';
    const userDb = conn.useDb(dbName);
    console.log('Switched to database:', dbName);
    
    const collections = await userDb.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    if (collections.some(c => c.name === 'tbl_nfe_100')) {
      const coll = userDb.collection('tbl_nfe_100');
      const count = await coll.countDocuments();
      console.log('Total documents in tbl_nfe_100:', count);
      
      const sample = await coll.findOne();
      if (sample) {
        console.log('Sample document:', {
          _id: sample._id,
          CHV_NFE: sample.CHV_NFE,
          DT_DOC: sample.DT_DOC,
          DT_DOC_TYPE: typeof sample.DT_DOC,
          DT_DOC_CONSTRUCTOR: sample.DT_DOC?.constructor?.name,
          VL_DOC: sample.VL_DOC,
          CNPJ_EMIT: sample.CNPJ_EMIT
        });
        
        // Check date range
        const latest = await coll.findOne({}, { sort: { DT_DOC: -1 } });
        const oldest = await coll.findOne({}, { sort: { DT_DOC: 1 } });
        
        console.log('Latest DT_DOC:', latest?.DT_DOC);
        console.log('Oldest DT_DOC:', oldest?.DT_DOC);
      }
    } else {
      console.log('tbl_nfe_100 not found in this database');
    }
    
    await conn.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
