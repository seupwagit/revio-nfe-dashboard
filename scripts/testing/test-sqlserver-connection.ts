import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing SQL Server connection...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Connection successful!');
    console.log('Result:', result);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
