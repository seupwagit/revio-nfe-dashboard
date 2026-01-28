import dotenv from 'dotenv';
import { connectPrisma } from './apps/backend/src/database/prisma.js';
import { ManifestationTypeService } from './apps/backend/src/services/ManifestationTypeService.js';

// Carregar .env
dotenv.config();

async function testQuery() {
  console.log('🚀 Iniciando teste de query de tipos de manifestação...');
  
  try {
    // Inicializar conexão
    await connectPrisma();
    
    const service = new ManifestationTypeService();
    const usrCodigo = 'TEST_USER';
    console.log(`🔍 Buscando tipos para o usuário: ${usrCodigo}`);
    
    const result = await service.getAvailableTypes(usrCodigo);
    
    if (result.success) {
      console.log('✅ Sucesso ao obter tipos!');
      console.log(`📊 Quantidade de tipos: ${result.data?.length}`);
      console.log('📋 Tipos obtidos:', JSON.stringify(result.data, null, 2));
    } else {
      console.error('❌ Erro retornado pelo serviço:', result.error);
      console.error('Code:', result.errorCode);
    }
  } catch (error) {
    console.error('💥 Erro catastrófico no teste:', error);
  } finally {
    process.exit(0);
  }
}

testQuery();
