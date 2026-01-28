export function validateBearerToken(token: string): { valid: boolean; message: string } {
  if (!token) {
    return { valid: false, message: 'Token vazio' }
  }

  if (token.length < 100) {
    return { valid: false, message: `Token muito curto (${token.length} caracteres)` }
  }

  // JWT tem 3 partes separadas por ponto
  const parts = token.split('.')
  if (parts.length !== 3) {
    return { valid: false, message: `Token JWT inválido (${parts.length} partes, esperado 3)` }
  }

  // Verifica se começa com eyJ (base64 de {"alg":...)
  if (!parts[0].startsWith('eyJ')) {
    return { valid: false, message: 'Token não parece ser um JWT válido' }
  }

  return { valid: true, message: 'Token parece válido' }
}

export function logTokenInfo(token: string) {
  console.group('🔐 INFORMAÇÕES DO TOKEN')
  console.log('Comprimento:', token.length)
  console.log('Primeiros 50 chars:', token.substring(0, 50))
  console.log('Últimos 50 chars:', token.substring(token.length - 50))
  
  const validation = validateBearerToken(token)
  console.log('Validação:', validation)
  
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      console.log('Header JWT:', header)
      console.log('Payload JWT:', payload)
      
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000)
        const now = new Date()
        console.log('Expira em:', expDate.toLocaleString())
        console.log('Expirado?', expDate < now ? '❌ SIM' : '✅ NÃO')
      }
    }
  } catch (e) {
    console.warn('Não foi possível decodificar o token:', e)
  }
  
  console.groupEnd()
}
