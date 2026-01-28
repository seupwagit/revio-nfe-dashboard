const fs = require('fs');
const path = require('path');

// Arquivos para corrigir
const files = [
  'apps/backend/src/services/__tests__/NFeQueryInterceptor.performance.test.ts',
  'apps/backend/src/services/__tests__/NFeQueryInterceptor.query-preservation.property.test.ts'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir objetos groupingConfig inline
    content = content.replace(
      /const groupingConfig = \{\s*enabled: true,\s*groupByFields: \[([^\]]+)\],\s*collection: '([^']+)',\s*globalEnabled: true\s*\};/g,
      'const groupingConfig = createTestGroupingConfig({\n        enabled: true,\n        groupByFields: [$1],\n        collection: \'$2\',\n        globalEnabled: true\n      });'
    );
    
    // Substituir objetos orderingConfig inline
    content = content.replace(
      /\{\s*fields: \[\{ field: 'DT_DOC', direction: 'DESC' \}\],\s*defaultOrdering: 'DT_DOC DESC'\s*\}/g,
      'createTestOrderingConfig({\n          fields: [{ field: \'DT_DOC\', direction: \'DESC\' }],\n          defaultOrdering: \'DT_DOC DESC\'\n        })'
    );
    
    // Substituir objetos orderingConfig mais simples
    content = content.replace(
      /\{\s*fields: \[\{ field: 'DT_DOC', direction: 'DESC' \}\],\s*defaultOrdering: 'DT_DOC DESC'\s*\}/g,
      'createTestOrderingConfig()'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
});

console.log('All files fixed!');