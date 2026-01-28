
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../apps/backend/src/database/mongodb.js';

async function findFullId() {
  await connectMongoDB();
  try {
    const coll = mongoose.connection.db.collection('tbl_historico_upload');
    // Find documents that DON'T have resNFe in the filename
    const doc = await coll.findOne({ ARQUIVO: { $not: /resNFe/ } });
    if (doc) {
      console.log('VALID_ID:', doc._id.toString());
      console.log('ARQUIVO:', doc.ARQUIVO);
    } else {
      // If not found, just find any large file
      const docAny = await coll.findOne({ });
      if (docAny) {
           console.log('ANY_ID:', docAny._id.toString());
           console.log('ARQUIVO:', docAny.ARQUIVO);
      } else {
          console.log('NO_DOCS_FOUND');
      }
    }
  } finally {
    await disconnectMongoDB();
  }
}

findFullId().catch(console.error);
