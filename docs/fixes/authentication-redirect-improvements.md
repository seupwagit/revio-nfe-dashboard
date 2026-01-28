# Melhorias no Sistema de Redirecionamento de Autenticação

## 📋 Resumo

Documento com as melhorias recomendadas para o sistema de autenticação e redirecionamento, baseado na análise completa realizada em 2025-01-14.

**Status Atual:** ✅ Sistema funcionando corretamente  
**Objetivo:** Adicionar camada extra de proteção e melhorar experiência do usuário

---

## 🎯 Melhorias Prioritárias

### 1. Adicionar Disparo de Evento no httpService

**Prioridade:** 🔴 Alta  
**Arquivo:** `apps/frontend/src/services/httpService.ts`  
**Linha:** ~60-70 (no bloco de tratamento de erro)

**Problema:**
O evento `auth:unauthorized` não está sendo disparado quando o backend retorna 401, reduzindo a redundância de proteção.

**Solução:**

```typescript
// ANTES
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw {
    status: response.status,
    message: errorData.error?.message || 'Erro na requisição',
    code: errorData.error?.code || ERROR_CODES.NETWORK_ERROR,
    isNetworkError: response.status >= 500
  };
}

// DEPOIS
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  
  // 🔒 Disparar evento de não autorizado para AuthContext interceptar
  if (response.status === 401) {
    console.warn('[httpService] 🔒 Token inválido detectado, disparando evento auth:unauthorized');
    window.dispatchEvent(new CustomEvent('auth:unauthorized', {
      detail: {
        status: response.status,
        code: errorData.error?.code || 'UNAUTHORIZED',
        message: errorData.error?.message || 'Token inválido ou expirado'
      }
    }));
  }
  
  throw {
    status: response.status,
    message: errorData.error?.message || 'Erro na requisição',
    code: errorData.error?.code || ERROR_CODES.NETWORK_ERROR,
    isNetworkError: response.status >= 500
  };
}
```

**Benefícios:**
- ✅ Garante que AuthContext sempre intercepta erros 401
- ✅ Adiciona camada extra de proteção
- ✅ Melhora consistência do tratamento de erros
- ✅ Facilita debugging com logs estruturados

---

### 2. Melhorar Feedback Visual ao Usuário

**Prioridade:** 🟡 Média  
**Arquivo:** `apps/frontend/src/contexts/AuthContext.tsx`  
**Linha:** ~198 (no handler de unauthorized)

**Problema:**
Usuário é redirecionado sem feedback visual claro sobre o motivo.

**Solução:**

```typescript
// ANTES
useEffect(() => {
  const handleUnauthorized = () => {
    console.warn('Token inválido ou expirado, redirecionando para login')
    clearSession()
    window.location.href = '/login'
  }

  window.addEventListener('auth:unauthorized' as any, handleUnauthorized)
  
  return () => {
    window.removeEventListener('auth:unauthorized' as any, handleUnauthorized)
  }
}, [])

// DEPOIS
useEffect(() => {
  const handleUnauthorized = (event: CustomEvent) => {
    console.warn('Token inválido ou expirado, redirecionando para login')
    
    // 📢 Mostrar notificação ao usuário
    const detail = event.detail || {}
    const message = detail.message || 'Sua sessão expirou. Por favor, faça login novamente.'
    
    // Usar sistema de notificações se disponível
    if (window.notify) {
      window.notify.warning(message, {
        duration: 3000,
        position: 'top-right'
      })
    }
    
    // Aguardar um pouco para usuário ver a notificação
    setTimeout(() => {
      clearSession()
      window.location.href = '/login'
    }, 500)
  }

  window.addEventListener('auth:unauthorized' as any, handleUnauthorized)
  
  return () => {
    window.removeEventListener('auth:unauthorized' as any, handleUnauthorized)
  }
}, [])
```

**Benefícios:**
- ✅ Usuário entende por que foi deslogado
- ✅ Melhora experiência do usuário
- ✅ Reduz confusão e suporte

---

### 3. Adicionar Parâmetro de Redirecionamento

**Prioridade:** 🟡 Média  
**Arquivo:** `apps/frontend/src/contexts/AuthContext.tsx`  
**Linha:** ~188 e ~200

**Problema:**
Após login, usuário sempre vai para dashboard, mesmo que estivesse tentando acessar outra página.

**Solução:**

```typescript
// ANTES
if (!isAuth && window.location.pathname !== '/login') {
  window.location.href = '/login'
}

// DEPOIS
if (!isAuth && window.location.pathname !== '/login') {
  // 🔄 Salvar URL de destino para redirecionar após login
  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/login?returnUrl=${returnUrl}`
}
```

**E no Login.tsx:**

```typescript
// Após login bem-sucedido
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  try {
    await login(username.trim(), password)
    
    // 🔄 Redirecionar para URL original ou dashboard
    const params = new URLSearchParams(window.location.search)
    const returnUrl = params.get('returnUrl') || '/dashboard'
    
    setTimeout(() => {
      navigate(decodeURIComponent(returnUrl))
    }, 100)
  } catch (error: any) {
    setError(error.message || 'Erro ao fazer login')
  }
}
```

**Benefícios:**
- ✅ Melhor experiência do usuário
- ✅ Usuário retorna para onde estava
- ✅ Reduz frustração

---

## 🧪 Testes Recomendados

### Testes E2E com Cypress

**Arquivo:** `apps/frontend/src/e2e/auth/token-expiration.cy.ts`

```typescript
import { TEST_USERS } from '../fixtures/test-users'

describe('Token Expiration and Redirect', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should redirect to login when token does not exist', () => {
    // Limpar localStorage
    cy.clearLocalStorage()
    
    // Tentar acessar rota protegida
    cy.visit('/dashboard')
    
    // Deve redirecionar para login
    cy.url().should('include', '/login')
    cy.get('[data-testid="login-form"]').should('be.visible')
  })

  it('should redirect to login when token is expired', () => {
    // Fazer login
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password)
    cy.visit('/dashboard')
    
    // Simular token expirado
    cy.window().then((win) => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDk0NTkyMDB9.invalid'
      win.localStorage.setItem('revio_auth_token', expiredToken)
    })
    
    // Recarregar página
    cy.reload()
    
    // Deve redirecionar para login
    cy.url().should('include', '/login')
  })

  it('should redirect to login when backend returns 401', () => {
    // Fazer login
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password)
    cy.visit('/dashboard')
    
    // Interceptar próxima requisição para retornar 401
    cy.intercept('GET', '/api/**', {
      statusCode: 401,
      body: {
        success: false,
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      }
    }).as('unauthorizedRequest')
    
    // Fazer uma ação que dispare requisição
    cy.get('[data-testid="refresh-button"]').click()
    
    // Aguardar requisição
    cy.wait('@unauthorizedRequest')
    
    // Deve redirecionar para login
    cy.url().should('include', '/login', { timeout: 5000 })
  })

  it('should show notification when session expires', () => {
    // Fazer login
    cy.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password)
    cy.visit('/dashboard')
    
    // Disparar evento de unauthorized
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('auth:unauthorized', {
        detail: {
          message: 'Sua sessão expirou'
        }
      }))
    })
    
    // Deve mostrar notificação
    cy.get('[data-testid="notification"]').should('be.visible')
    cy.get('[data-testid="notification"]').should('contain', 'sessão expirou')
    
    // Deve redirecionar para login
    cy.url().should('include', '/login', { timeout: 2000 })
  })

  it('should redirect back to original page after login', () => {
    // Tentar acessar página específica sem autenticação
    cy.visit('/analytics')
    
    // Deve redirecionar para login com returnUrl
    cy.url().should('include', '/login')
    cy.url().should('include', 'returnUrl=%2Fanalytics')
    
    // Fazer login
    cy.get('[data-testid="email-input"]').type(TEST_USERS.ADMIN.email)
    cy.get('[data-testid="password-input"]').type(TEST_USERS.ADMIN.password)
    cy.get('[data-testid="login-button"]').click()
    
    // Deve redirecionar de volta para analytics
    cy.url().should('include', '/analytics')
    cy.get('[data-testid="analytics-page"]').should('be.visible')
  })
})
```

### Testes Unitários

**Arquivo:** `apps/frontend/src/__tests__/unit/contexts/AuthContext.test.tsx`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../../contexts/AuthContext'
import { storageService } from '../../../services/storageService'

describe('AuthContext - Token Expiration', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should redirect to login when token is expired', async () => {
    // Mock token expirado
    jest.spyOn(storageService, 'isTokenExpired').mockReturnValue(true)
    jest.spyOn(storageService, 'getUserData').mockReturnValue(null)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })
    
    // Verificar se clearSession foi chamado
    expect(storageService.clearAuthData).toHaveBeenCalled()
  })

  it('should handle unauthorized event', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })
    
    // Simular evento unauthorized
    act(() => {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    })
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
```

---

## 📊 Checklist de Implementação

### Fase 1: Correções Críticas
- [ ] Adicionar disparo de evento no httpService
- [ ] Testar redirecionamento com token inválido
- [ ] Testar redirecionamento com token expirado
- [ ] Verificar logs no console

### Fase 2: Melhorias de UX
- [ ] Adicionar notificação de sessão expirada
- [ ] Implementar parâmetro returnUrl
- [ ] Testar fluxo completo de redirecionamento
- [ ] Ajustar timing de notificações

### Fase 3: Testes
- [ ] Criar testes E2E para token expirado
- [ ] Criar testes E2E para token inválido
- [ ] Criar testes E2E para returnUrl
- [ ] Criar testes unitários para AuthContext
- [ ] Validar cobertura de testes > 80%

### Fase 4: Documentação
- [ ] Atualizar documentação de autenticação
- [ ] Documentar fluxo de redirecionamento
- [ ] Criar guia de troubleshooting
- [ ] Atualizar README com novos comportamentos

---

## 🎯 Resultados Esperados

Após implementação das melhorias:

✅ **Segurança:**
- 4 camadas de proteção funcionando perfeitamente
- Evento `auth:unauthorized` disparado em todos os casos
- Logs estruturados para auditoria

✅ **Experiência do Usuário:**
- Feedback visual claro sobre expiração de sessão
- Redirecionamento inteligente após login
- Menos frustração e confusão

✅ **Qualidade:**
- Cobertura de testes > 80%
- Testes E2E para todos os cenários
- Documentação completa e atualizada

---

## 📚 Referências

- Análise Completa: `docs/analysis/authentication-redirect-analysis.md`
- AuthContext: `apps/frontend/src/contexts/AuthContext.tsx`
- httpService: `apps/frontend/src/services/httpService.ts`
- ProtectedRoute: `apps/frontend/src/components/ProtectedRoute.tsx`
- Testing Rules: `.kiro/steering/ui-testing-workflow-rules.md`
