const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function check() {
  try {
    const uri = process.env.VITE_MONGODB_CONNECTION_STRING;
    await mongoose.connect(uri);
    const db = mongoose.connection.useDb('C03205493000941');
    const coll = db.collection('tbl_nfe_100');
    
    // Simular o filtro da rota
    const dtIni = new Date('2025-02-02');
    const dtFin = new Date('2026-02-02');
    dtFin.setHours(23, 59, 59, 999);
    
    const filter = { DT_DOC: { $gte: dtIni, $lte: dtFin } };
    
    // Simular o pipeline do interceptor (com o bug de agrupamento compulsório)
    const pipeline = [
      { $match: filter },
      // Normalização
      { $addFields: {
          CHV_NFE_NORMALIZED: { $cond: [{ $and: [{ $ne: ['$CHV_NFE', null] }, { $eq: [{ $type: '$CHV_NFE' }, 'string'] }] }, '$CHV_NFE', '$CHV_NFE'] },
          ORIGINAL_DOC: '$$ROOT'
      }},
      // Agrupamento
      { $group: {
          _id: { CHV_NFE_NORMALIZED: '$CHV_NFE_NORMALIZED' },
          doc: { $first: '$ORIGINAL_DOC' }
      }},
      // ReplaceRoot
      { $replaceRoot: { newRoot: '$doc' } },
      // Stats group
      { $group: {
          _id: null,
          total: { $sum: 1 }
      }}
    ];
    
    const stats = await coll.aggregate(pipeline).toArray();
    console.log('Result with grouping:', stats);
    
    const countSimple = await coll.countDocuments(filter);
    console.log('Count simple:', countSimple);

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
}
check();
