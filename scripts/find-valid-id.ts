
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../apps/backend/src/database/mongodb.js';

async function findValidId() {
  await connectMongoDB();
  try {
    const coll = mongoose.connection.db.collection('tbl_historico_upload');
    const doc = await coll.findOne({});
    if (doc) {
      console.log('VALID_ID:', doc._id.toString());
      console.log('ARQUIVO:', doc.ARQUIVO);
    } else {
      console.log('NO_DOCS_FOUND');
    }
  } finally {
    await disconnectMongoDB();
  }
}

findValidId().catch(console.error);
