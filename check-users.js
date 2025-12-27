/**
 * Script para verificar usuários na base de dados
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "sqlserver://10.0.0.4:1433;database=SpedRevio;user=sa;password=zaqwsx2001;encrypt=false;trustServerCertificate=true"
    }
  }
});

function generatePasswordHash(usrCodigo, senha) {
  const paraHash = usrCodigo + senha;
  return crypto.createHash('md5').update(paraHash, 'utf8').digest('hex');
}

async function checkUsers() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Conectado!');

    console.log('\n📋 Verificando usuários na tabela fr_usuario...');
    
    const users = await prisma.frUsuario.findMany({
      take: 10,
      select: {
        usrCodigo: true,
        usrNome: true,
        usrLogin: true,
        usrSenha: true,
        ativo: true,
        bancoDeDados: true,
        usrAdministrador: true
      }
    });

    console.log(`\n📊 Encontrados ${users.length} usuários:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. Usuário: ${user.usrLogin}`);
      console.log(`   Código: ${user.usrCodigo}`);
      console.log(`   Nome: ${user.usrNome}`);
      console.log(`   Ativo: ${user.ativo}`);
      console.log(`   Admin: ${user.usrAdministrador}`);
      console.log(`   Banco: ${user.bancoDeDados}`);
      console.log(`   Tem senha: ${user.usrSenha ? 'SIM' : 'NÃO'}`);
      
      if (user.usrSenha) {
        console.log(`   Hash armazenado: ${user.usrSenha}`);
        
        // Testar algumas senhas comuns
        const commonPasswords = ['123456', 'admin', user.usrLogin, '1', 'test'];
        commonPasswords.forEach(pwd => {
          const hash = generatePasswordHash(user.usrCodigo, pwd);
          if (hash === user.usrSenha) {
            console.log(`   🎯 SENHA ENCONTRADA: "${pwd}"`);
          }
        });
      }
    });

    // Se não encontrou usuários, vamos criar um usuário de teste
    if (users.length === 0) {
      console.log('\n🔧 Nenhum usuário encontrado. Criando usuário de teste...');
      
      const testUser = await prisma.frUsuario.create({
        data: {
          usrCodigo: '999',
          usrNome: 'Usuário Teste',
          usrLogin: 'test',
          usrSenha: generatePasswordHash('999', 'test'),
          ativo: 1,
          bancoDeDados: 'spedrevio',
          usrAdministrador: 'S'
        }
      });
      
      console.log('✅ Usuário de teste criado:');
      console.log('   Login: test');
      console.log('   Senha: test');
      console.log('   Código:', testUser.usrCodigo);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();