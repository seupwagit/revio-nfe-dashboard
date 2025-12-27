/**
 * Script para descobrir a senha do usuário master
 */

import crypto from 'crypto';

function generatePasswordHash(usrCodigo, senha) {
  const paraHash = usrCodigo + senha;
  return crypto.createHash('md5').update(paraHash, 'utf8').digest('hex');
}

const masterHash = '8fa8d2dfb502a78652b554fa033fc71c';
const usrCodigo = '1';

// Lista de senhas comuns para testar
const commonPasswords = [
  'master', 'admin', '123456', '1', 'test', 'password', 
  '12345', 'qwerty', 'abc123', 'senha', 'revio',
  '1234', '123', 'pass', 'root', 'user', 'login',
  'sistema', 'spedrevio', 'nfe', 'fiscal'
];

console.log('🔍 Testando senhas para usuário master (código: 1)');
console.log('Hash armazenado:', masterHash);
console.log('');

let found = false;

for (const password of commonPasswords) {
  const hash = generatePasswordHash(usrCodigo, password);
  console.log(`Testando "${password}": ${hash}`);
  
  if (hash === masterHash) {
    console.log(`🎯 SENHA ENCONTRADA: "${password}"`);
    found = true;
    break;
  }
}

if (!found) {
  console.log('❌ Senha não encontrada na lista de senhas comuns');
  console.log('');
  console.log('💡 Dica: O hash é gerado como MD5(usrCodigo + senha)');
  console.log('   Para o usuário master (código 1), seria MD5("1" + senha)');
}