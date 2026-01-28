import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function checkTable() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('Checking table tbl_tipo_manifestacao...');
    const result = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'tbl_tipo_manifestacao'
    `;
    console.log('Columns:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error checking table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkTable();
