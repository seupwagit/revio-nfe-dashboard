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
    
    const dateDistribution = await coll.aggregate([
      { $group: {
          _id: { 
            year: { $year: '$DT_DOC' },
            month: { $month: '$DT_DOC' }
          },
          count: { $sum: 1 }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]).toArray();
    console.log('Date Distribution:', JSON.stringify(dateDistribution, null, 2));

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
}
check();
