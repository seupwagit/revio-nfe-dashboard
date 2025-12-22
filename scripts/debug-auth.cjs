/**
 * Script para debugar autenticação
 */

const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')

async function debugAuth() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  })

  try {
    console.log('🔍 Debugando autenticação...')

    const username = 'divino@grupochama.com.br'
    const password = '123456789'

    // Buscar usuário
    const user = await prisma.frUsuario.findUnique({
      where: {
        usrLogin: username
      }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log('  USR_CODIGO:', user.usrCodigo)
    console.log('  USR_LOGIN:', user.usrLogin)
    console.log('  USR_NOME:', user.usrNome)
    console.log('  ATIVO:', user.ativo)
    console.log('  BANCO_DE_DADOS:', user.bancoDeDados)
    console.log('  USR_SENHA (hash):', user.usrSenha)

    // Gerar hash da senha fornecida
    const paraHash = user.usrCodigo + password
    const expectedHash = crypto.createHash('md5').update(paraHash, 'utf8').digest('hex')
    
    console.log('\n🔐 Verificação de senha:')
    console.log('  Senha fornecida:', password)
    console.log('  String para hash:', paraHash)
    console.log('  Hash esperado:', expectedHash)
    console.log('  Hash no banco:', user.usrSenha)
    console.log('  Senhas coincidem:', user.usrSenha === expectedHash ? '✅ SIM' : '❌ NÃO')

    // Verificar permissões
    const permissions = await prisma.frUsuarioSistema.findFirst({
      where: {
        usrCodigo: user.usrCodigo,
        sisCodigo: '001'
      }
    })

    console.log('\n🔑 Permissões:')
    if (permissions) {
      console.log('  USS_ACESSO_EXTERNO:', permissions.ussAcessoExterno)
      console.log('  USS_ADMINISTRADOR:', permissions.ussAdministrador)
      console.log('  USS_ACESSAR:', permissions.ussAcessar)
    } else {
      console.log('  ❌ Nenhuma permissão encontrada para SIS_CODIGO = 001')
      
      // Listar todas as permissões do usuário
      const allPermissions = await prisma.frUsuarioSistema.findMany({
        where: {
          usrCodigo: user.usrCodigo
        }
      })
      
      console.log('  Todas as permissões:')
      allPermissions.forEach(perm => {
        console.log(`    SIS_CODIGO: ${perm.sisCodigo}, ACESSO_EXTERNO: ${perm.ussAcessoExterno}, ACESSAR: ${perm.ussAcessar}`)
      })
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAuth()