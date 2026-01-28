
import dotenv from 'dotenv';
import { connectPrisma } from './apps/backend/src/database/prisma.js';
import { ManifestationService } from './apps/backend/src/services/ManifestationService.js';

// Carregar .env
dotenv.config();

async function testSchedule() {
  console.log('🚀 Iniciando teste de agendamento de manifestação (Fallback Legado)...');
  
  try {
    // Inicializar conexão
    await connectPrisma();
    
    const service = new ManifestationService();
    const usrCodigo = 'TEST_USER';
    const request = {
      manifestationType: '1', // Conforme vimos, o ID legado é 1, 2, 3, 4
      chaves: ['43210987654321098765432109876543210987654321'] // 44 dígitos fictícios
    };
    
    console.log(`📝 Agendando para usuário: ${usrCodigo}, chaves: ${request.chaves.length}`);
    
    // scheduleManifestations(request, userCode, ipAddress)
    const result = await service.scheduleManifestations(request, usrCodigo, '127.0.0.1');
    
    console.log('✅ Resultado do agendamento:', JSON.stringify(result, null, 2));
    
    // Verificar se salvou no banco
    const { prisma } = await import('./apps/backend/src/database/prisma.js');
    if (prisma) {
      console.log('🔍 Verificando registro no banco legado...');
      const records = await prisma.$queryRaw`SELECT TOP 1 * FROM tbl_manifestacao ORDER BY dthr DESC`;
      console.log('📋 Registro encontrado:', JSON.stringify(records, null, 2));
    }

  } catch (error) {
    console.error('💥 Erro no teste de agendamento:', error);
  } finally {
    process.exit(0);
  }
}

testSchedule();
