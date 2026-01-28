import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function inspectData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('Sample from tbl_tipo_manifestacao:');
    const types = await prisma.$queryRaw`SELECT TOP 5 * FROM tbl_tipo_manifestacao`;
    console.log(JSON.stringify(types, null, 2));

    console.log('\nSample from tbl_manifestacao:');
    const manifests = await prisma.$queryRaw`SELECT TOP 5 * FROM tbl_manifestacao`;
    console.log(JSON.stringify(manifests, null, 2));
  } catch (err) {
    console.error('Error inspecting data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectData();
