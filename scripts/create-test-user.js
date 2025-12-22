/**
 * Script para criar usuário de teste
 */

const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

async function createTestUser() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  })

  try {
    console.log('🔐 Criando usuário de teste...')

    // Hash da senha "123456"
    const hashedPassword = await bcrypt.hash('123456', 10)
    console.log('✅ Senha hasheada')

    // Criar usuário
    const user = await prisma.frUsuario.create({
      data: {
        usrCodigo: 'TEST001',
        usrLogin: 'teste',
        usrSenha: hashedPassword,
        usrNome: 'Usuário Teste',
        usrEmail: 'teste@revio.com.br',
        empresa: 'Empresa Teste',
        cnpj: '12345678000195',
        bancoDeDados: 'C67624577000145',
        ativo: 1,
        usrAdministrador: 'S'
      }
    })

    console.log('✅ Usuário criado:', user.usrLogin)

    // Criar permissões do sistema
    const permissions = await prisma.frUsuarioSistema.create({
      data: {
        usrCodigo: 'TEST001',
        sisCodigo: '001',
        ussAcessoExterno: 'S',
        ussAdministrador: 'S',
        ussAcessar: 'S'
      }
    })

    console.log('✅ Permissões criadas')

    console.log('\n🎉 Usuário de teste criado com sucesso!')
    console.log('📧 Login: teste')
    console.log('🔑 Senha: 123456')

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()