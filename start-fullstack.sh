#!/bin/sh

# Script de inicialização Fullstack
# Inicia Backend e Frontend no mesmo container

set -e

echo "=========================================="
echo "  🚀 SpedRevio Fullstack Application"
echo "=========================================="
echo ""

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo "${RED}❌ $1${NC}"
}

# Verificar variáveis de ambiente essenciais
log_info "Verificando variáveis de ambiente..."

if [ -z "$VITE_MONGODB_CONNECTION_STRING" ]; then
    log_error "VITE_MONGODB_CONNECTION_STRING não definida!"
    exit 1
fi

if [ -z "$VITE_API_BEARER_TOKEN" ]; then
    log_warning "VITE_API_BEARER_TOKEN não definida (algumas funcionalidades podem não funcionar)"
fi

log_success "Variáveis de ambiente OK"
echo ""

# Configurações
BACKEND_PORT=${BACKOFFICE_PORT:-3001}
FRONTEND_PORT=${PORT:-3000}
BACKEND_LOG="/tmp/backend.log"
FRONTEND_LOG="/tmp/frontend.log"

# Função para cleanup
cleanup() {
    log_warning "Recebido sinal de término..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        log_info "Parando Backend (PID: $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        log_info "Parando Frontend (PID: $FRONTEND_PID)..."
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    
    log_success "Aplicação encerrada"
    exit 0
}

# Registrar handler de sinais
trap cleanup SIGTERM SIGINT SIGQUIT

# Iniciar Backend
log_info "Iniciando Backend na porta $BACKEND_PORT..."
tsx server/backoffice/index.ts > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

log_success "Backend iniciado (PID: $BACKEND_PID)"
echo ""

# Aguardar backend iniciar
log_info "Aguardando Backend inicializar..."
sleep 5

# Verificar se backend está rodando
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    log_error "Backend falhou ao iniciar!"
    log_info "Últimas linhas do log:"
    tail -n 20 "$BACKEND_LOG"
    exit 1
fi

# Verificar se backend está respondendo
RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $RETRIES ]; do
    if wget -q --spider "http://localhost:$BACKEND_PORT/api/health" 2>/dev/null; then
        log_success "Backend está respondendo!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $RETRIES ]; then
        log_info "Tentativa $RETRY_COUNT/$RETRIES - Aguardando backend..."
        sleep 2
    else
        log_warning "Backend não respondeu ao health check (continuando mesmo assim)"
    fi
done

echo ""

# Iniciar Frontend
log_info "Iniciando Frontend na porta $FRONTEND_PORT..."
npx serve -s dist -l "$FRONTEND_PORT" > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

log_success "Frontend iniciado (PID: $FRONTEND_PID)"
echo ""

# Aguardar frontend iniciar
log_info "Aguardando Frontend inicializar..."
sleep 3

# Verificar se frontend está rodando
if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log_error "Frontend falhou ao iniciar!"
    log_info "Últimas linhas do log:"
    tail -n 20 "$FRONTEND_LOG"
    exit 1
fi

echo ""
log_success "=========================================="
log_success "  ✅ Aplicação iniciada com sucesso!"
log_success "=========================================="
echo ""
log_info "URLs disponíveis:"
log_info "  Frontend: http://localhost:$FRONTEND_PORT"
log_info "  Backend:  http://localhost:$BACKEND_PORT"
log_info "  Health:   http://localhost:$BACKEND_PORT/api/health"
echo ""
log_info "Logs:"
log_info "  Backend:  $BACKEND_LOG"
log_info "  Frontend: $FRONTEND_LOG"
echo ""
log_info "Pressione Ctrl+C para parar"
echo ""

# Monitorar processos
while true; do
    # Verificar se backend ainda está rodando
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        log_error "Backend parou inesperadamente!"
        log_info "Últimas linhas do log:"
        tail -n 20 "$BACKEND_LOG"
        cleanup
        exit 1
    fi
    
    # Verificar se frontend ainda está rodando
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        log_error "Frontend parou inesperadamente!"
        log_info "Últimas linhas do log:"
        tail -n 20 "$FRONTEND_LOG"
        cleanup
        exit 1
    fi
    
    # Aguardar antes de verificar novamente
    sleep 10
done
