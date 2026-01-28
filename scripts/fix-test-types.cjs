const fs = require('fs');
const path = require('path');

// Arquivos de teste para corrigir
const testFiles = [
  'apps/backend/src/services/__tests__/NFeQueryInterceptor.logging.property.test.ts',
  'apps/backend/src/services/__tests__/NFeQueryInterceptor.performance.test.ts',
  'apps/backend/src/services/__tests__/NFeQueryInterceptor.query-preservation.property.test.ts'
];

testFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Adicionar import do helper se não existir
    if (!content.includes('createTestGroupingConfig')) {
      content = content.replace(
        /import { OrderingProcessor } from '\.\.\/OrderingProcessor';/,
        `import { OrderingProcessor } from '../OrderingProcessor';
import { createTestGroupingConfig, createTestOrderingConfig } from './test-helpers';`
      );
    }
    
    // Corrigir toBeFinite para verificação manual
    content = content.replace(
      /expect\(([^)]+)\.processingTime\)\.toBeFinite\(\);/g,
      'expect(typeof $1.processingTime).toBe(\'number\');\n        expect($1.processingTime).toBeGreaterThan(0);'
    );
    
    // Corrigir definições de groupingConfig simples
    content = content.replace(
      /const groupingConfig = \{\s*enabled: true,\s*groupByFields: (\[[^\]]+\]),\s*collection: ([^,]+),\s*globalEnabled: true\s*\};/g,
      'const groupingConfig = createTestGroupingConfig({\n          collection: $2,\n          groupByFields: $1\n        });'
    );
    
    // Corrigir definições de orderingConfig simples
    content = content.replace(
      /const orderingConfig = \{\s*fields: \[\{ field: '[^']+', direction: 'DESC' \}\],\s*defaultOrdering: '[^']+'\s*\};/g,
      'const orderingConfig = createTestOrderingConfig();'
    );
    
    // Corrigir mocks inline de orderingConfig
    content = content.replace(
      /mockReturnValue\(\{\s*fields: \[\{ field: '[^']+', direction: 'DESC' \}\],\s*defaultOrdering: '[^']+'\s*\}\)/g,
      'mockReturnValue(createTestOrderingConfig())'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigido: ${filePath}`);
  } else {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
  }
});

console.log('🎉 Correção de tipos concluída!');