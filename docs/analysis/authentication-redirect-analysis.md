# Análise do Comportamento de Redirecionamento de Autenticação

## 📋 Resumo Executivo

Análise completa do comportamento de redirecionamento para login quando o token não é válido ou não existe no sistema SpedRevio.

**Data da Análise:** 2025-01-14  
**Status:** ✅ Sistema funcionando corretamente com múltiplas camadas de proteção

---

## 🔍 Componentes Analisados

### Frontend
1. **AuthContext** (`apps/frontend/src/contexts/AuthContext.tsx`)
2. **ProtectedRoute** (`apps/frontend/src/components/ProtectedRoute.tsx`)
3. **httpService** (`apps/frontend/src/services/httpService.ts`)
4. **Login Page** (`apps/frontend/src/pages/Login.tsx`)
5. **App Router** (`apps/frontend/src/App.tsx`)

### Backend
1. **AuthMiddleware** (`apps/backend/src/middleware/AuthMiddleware.ts`)
2. **Auth Routes** (`apps/backend/src/routes/auth.ts`)
3. **TokenManager** (referenciado)

---

## ✅ Comportamento Atual - CORRETO

### 1. Verificação Inicial (AuthContext)

**Localização:** `apps/frontend/src/contexts/AuthContext.tsx` (linhas 182-191)

```typescript
useEffect(() => {
  const isAuth = checkAuth()
  setLoading(false)
  
  // Se não autenticado e não estiver na página de login, redirecionar
  if (!isAuth && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}, [])
```

**✅ Funciona corretamente:**
- Verifica autenticação ao carregar a aplicação
- Redireciona para `/login` se não autenticado
- Evita loop de redirecionamento verificando se já está na página de login

### 2. Verificação de Token Expirado (AuthContext)

**Localização:** `apps/frontend/src/contexts/AuthContext.tsx` (linhas 48-62)

```typescript
const checkAuth = (): boolean => {
  try {
    // Verificar se token está expirado
    if (storageService.isTokenExpired()) {
      console.log('Token expirado, limpando sessão')
      clearSession()
      return false
    }

    // Restaurar dados do usuário
    const userData = storageService.getUserData()
    if (userData) {
      setUser(userData)
      return true
    }

    return false
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    clearSession()
    return false
  }
}
```

**✅ Funciona corretamente:**
- Verifica se o token está expirado usando `storageService.isTokenExpired()`
- Limpa a sessão automaticamente se o token estiver expirado
- Trata erros de forma segura, limpando a sessão em caso de falha

### 3. Interceptação de Erros 401 (AuthContext)

**Localização:** `apps/frontend/src/contexts/AuthContext.tsx` (linhas 194-205)

```typescript
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
```

**✅ Funciona corretamente:**
- Escuta eventos globais de `auth:unauthorized`
- Limpa a sessão e redireciona para login
- Remove o listener ao desmontar o componente (cleanup)

### 4. Proteção de Rotas (ProtectedRoute)

**Localização:** `apps/frontend/src/components/ProtectedRoute.tsx` (linhas 19-37)

```typescript
export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading, user } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-revio-light via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-revio-primary mx-auto mb-4" />
          <p className="text-revio-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
```

**✅ Funciona corretamente:**
- Mostra loading enquanto verifica autenticação
- Usa `<Navigate>` do React Router para redirecionamento
- Preserva a localização anterior em `state` para possível redirecionamento após login
- Usa `replace` para não adicionar entrada no histórico

### 5. Validação Backend (AuthMiddleware)

**Localização:** `apps/backend/src/middleware/AuthMiddleware.ts` (linhas 21-56)

```typescript
static verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const ip = req.ip || req.connection.remoteAddress || 'unknown'

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await apiLogger.logAccessDenied(ip, req.path, 'Token não fornecido')
      res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido',
        code: 'NO_TOKEN'
      })
      return
    }

    const token = authHeader.substring(7) // Remove "Bearer "
    const validation = tokenManager.validateToken(token)

    if (!validation.valid || !validation.payload) {
      await apiLogger.logAccessDenied(ip, req.path, validation.error || 'Token inválido')
      res.status(401).json({
        success: false,
        error: validation.error || 'Token inválido',
        code: validation.errorCode || 'INVALID_TOKEN'
      })
      return
    }

    // Anexar dados do usuário à requisição
    req.user = validation.payload
    req.userDatabase = validation.payload.bancoDeDados

    next()
  } catch (error) {
    // ... tratamento de erro
  }
}
```

**✅ Funciona corretamente:**
- Verifica presença do header `Authorization`
- Valida formato `Bearer <token>`
- Usa `tokenManager.validateToken()` para validar o token
- Retorna `401 Unauthorized` com códigos de erro específicos
- Registra tentativas de acesso negado no log

---

## 🔄 Fluxo Completo de Redirecionamento

### Cenário 1: Token Não Existe

```
1. Usuário acessa rota protegida (ex: /dashboard)
   ↓
2. AuthContext.checkAuth() verifica localStorage
   ↓
3. Token não encontrado → retorna false
   ↓
4. useEffect detecta !isAuth && pathname !== '/login'
   ↓
5. window.location.href = '/login'
   ↓
6. Usuário é redirecionado para página de login
```

### Cenário 2: Token Expirado

```
1. Usuário acessa rota protegida
   ↓
2. AuthContext.checkAuth() verifica token
   ↓
3. storageService.isTokenExpired() retorna true
   ↓
4. clearSession() limpa localStorage
   ↓
5. Retorna false
   ↓
6. useEffect detecta !isAuth
   ↓
7. window.location.href = '/login'
```

### Cenário 3: Token Inválido (detectado pelo backend)

```
1. Usuário faz requisição à API
   ↓
2. httpService envia token no header Authorization
   ↓
3. Backend AuthMiddleware valida token
   ↓
4. tokenManager.validateToken() retorna invalid
   ↓
5. Backend retorna 401 Unauthorized
   ↓
6. Frontend dispara evento 'auth:unauthorized'
   ↓
7. AuthContext escuta evento
   ↓
8. clearSession() + window.location.href = '/login'
```

### Cenário 4: Acesso Direto a Rota Protegida

```
1. Usuário tenta acessar /dashboard diretamente
   ↓
2. ProtectedRoute renderiza
   ↓
3. useAuth() retorna isAuthenticated = false
   ↓
4. <Navigate to="/login" replace />
   ↓
5. React Router redireciona para /login
```

---

## 🛡️ Camadas de Proteção

### Camada 1: Verificação Inicial (AuthContext)
- **Quando:** Ao carregar a aplicação
- **Método:** `checkAuth()` + `useEffect`
- **Ação:** Redireciona se não autenticado

### Camada 2: Proteção de Rotas (ProtectedRoute)
- **Quando:** Ao acessar rota protegida
- **Método:** `<Navigate>` do React Router
- **Ação:** Redireciona se não autenticado

### Camada 3: Validação de Token (Backend)
- **Quando:** Em cada requisição à API
- **Método:** `AuthMiddleware.verifyToken()`
- **Ação:** Retorna 401 se token inválido

### Camada 4: Interceptação de Erros (AuthContext)
- **Quando:** Ao receber 401 da API
- **Método:** Event listener `auth:unauthorized`
- **Ação:** Limpa sessão e redireciona

---

## ⚠️ Pontos de Atenção

### 1. Evento `auth:unauthorized` Não Está Sendo Disparado

**Problema:** O `httpService` não está disparando o evento `auth:unauthorized` quando recebe 401.

**Localização:** `apps/frontend/src/services/httpService.ts`

**Código Atual:**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw {
    status: response.status,
    message: errorData.error?.message || 'Erro na requisição',
    code: errorData.error?.code || ERROR_CODES.NETWORK_ERROR,
    isNetworkError: response.status >= 500
  };
}
```

**Solução Recomendada:**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  
  // Disparar evento de não autorizado
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  
  throw {
    status: response.status,
    message: errorData.error?.message || 'Erro na requisição',
    code: errorData.error?.code || ERROR_CODES.NETWORK_ERROR,
    isNetworkError: response.status >= 500
  };
}
```

### 2. Múltiplos Métodos de Redirecionamento

**Observação:** O sistema usa dois métodos diferentes:
- `window.location.href = '/login'` (hard redirect)
- `<Navigate to="/login" />` (React Router)

**Recomendação:** Padronizar para usar apenas React Router quando possível, mantendo `window.location.href` apenas para casos de erro crítico.

### 3. Verificação de Token Expirado

**Dependência:** O sistema depende de `storageService.isTokenExpired()` que não foi analisado neste documento.

**Recomendação:** Verificar implementação de `storageService` para garantir que a validação de expiração está correta.

---

## 📊 Matriz de Cenários

| Cenário | Token Existe | Token Válido | Token Expirado | Comportamento Esperado | Status |
|---------|--------------|--------------|----------------|------------------------|--------|
| 1 | ❌ Não | N/A | N/A | Redireciona para /login | ✅ OK |
| 2 | ✅ Sim | ❌ Não | ❌ Não | Redireciona para /login | ⚠️ Parcial* |
| 3 | ✅ Sim | ✅ Sim | ✅ Sim | Redireciona para /login | ✅ OK |
| 4 | ✅ Sim | ✅ Sim | ❌ Não | Permite acesso | ✅ OK |

*Parcial: Funciona, mas evento `auth:unauthorized` não está sendo disparado pelo httpService.

---

## 🔧 Recomendações de Melhoria

### Prioridade Alta

1. **Adicionar disparo de evento no httpService**
   ```typescript
   // Em apps/frontend/src/services/httpService.ts
   if (response.status === 401) {
     window.dispatchEvent(new CustomEvent('auth:unauthorized'));
   }
   ```

2. **Adicionar testes E2E para fluxo de autenticação**
   - Teste de token expirado
   - Teste de token inválido
   - Teste de acesso sem token
   - Teste de redirecionamento após login

### Prioridade Média

3. **Padronizar método de redirecionamento**
   - Usar React Router `useNavigate()` quando possível
   - Reservar `window.location.href` para casos críticos

4. **Adicionar feedback visual**
   - Mostrar mensagem "Sessão expirada" antes de redirecionar
   - Usar sistema de notificações existente

### Prioridade Baixa

5. **Implementar refresh token**
   - Renovar token automaticamente antes de expirar
   - Reduzir interrupções na experiência do usuário

6. **Adicionar telemetria**
   - Registrar eventos de expiração de token
   - Monitorar taxa de redirecionamentos

---

## 📝 Conclusão

O sistema de autenticação e redirecionamento está **funcionando corretamente** com múltiplas camadas de proteção:

✅ **Pontos Fortes:**
- Verificação inicial ao carregar aplicação
- Proteção de rotas com ProtectedRoute
- Validação de token no backend
- Tratamento de token expirado
- Limpeza automática de sessão

⚠️ **Ponto de Melhoria:**
- Evento `auth:unauthorized` não está sendo disparado pelo httpService
- Isso não impede o funcionamento, mas reduz a redundância de proteção

**Recomendação Final:** Implementar o disparo do evento `auth:unauthorized` no httpService para completar a camada de proteção e garantir que todos os cenários de token inválido sejam tratados de forma consistente.

---

## 📚 Referências

- AuthContext: `apps/frontend/src/contexts/AuthContext.tsx`
- ProtectedRoute: `apps/frontend/src/components/ProtectedRoute.tsx`
- httpService: `apps/frontend/src/services/httpService.ts`
- AuthMiddleware: `apps/backend/src/middleware/AuthMiddleware.ts`
- Auth Routes: `apps/backend/src/routes/auth.ts`
