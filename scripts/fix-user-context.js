#!/usr/bin/env node

/**
 * Script to fix UserContext objects in test files
 * Adds missing usrLogin and isAdmin properties
 */

const fs = require('fs');
const path = require('path');

const testFiles = [
  'apps/backend/src/tests/automatic-query-routing.test.ts',
  'apps/backend/src/tests/auth-routes.test.ts', 
  'apps/backend/src/tests/auth-services.test.ts'
];

function fixUserContextInFile(filePath) {
  console.log(`Fixing UserContext objects in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern to match UserContext objects missing usrLogin and isAdmin
  const pattern = /(\s+const\s+\w+:\s*UserContext\s*=\s*{\s*usrCodigo:\s*'[^']+',\s*usrNome:\s*'[^']+',\s*bancoDeDados:\s*'[^']+',\s*isAuthenticated:\s*true\s*})/g;
  
  content = content.replace(pattern, (match, group) => {
    // Extract the usrCodigo to generate a login
    const usrCodigoMatch = group.match(/usrCodigo:\s*'([^']+)'/);
    const usrCodigo = usrCodigoMatch ? usrCodigoMatch[1] : 'user';
    const usrLogin = `user${usrCodigo}`;
    
    // Replace the UserContext object
    return group.replace(
      /(usrNome:\s*'[^']+',)/,
      `$1\n        usrLogin: '${usrLogin}',`
    ).replace(
      /(bancoDeDados:\s*'[^']+',)/,
      `$1\n        isAdmin: false,`
    );
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed UserContext objects in ${filePath}`);
}

// Fix all test files
testFiles.forEach(fixUserContextInFile);

console.log('All UserContext objects fixed!');