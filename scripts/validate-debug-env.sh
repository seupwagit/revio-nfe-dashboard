#!/bin/bash

# Script to validate debug environment variables
echo "🔍 Validating Debug Environment Variables"
echo "========================================"

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "✅ .env file found"
    source .env
else
    echo "❌ .env file not found"
    exit 1
fi

# Check required environment variables
echo ""
echo "📋 Environment Variables:"
echo "VITE_PORT=${VITE_PORT:-'NOT SET'}"
echo "BACKOFFICE_PORT=${BACKOFFICE_PORT:-'NOT SET'}"
echo "PORT=${PORT:-'NOT SET'}"

# Validate ports are numeric
if [[ "$VITE_PORT" =~ ^[0-9]+$ ]]; then
    echo "✅ VITE_PORT is valid: $VITE_PORT"
else
    echo "❌ VITE_PORT is invalid or not set: $VITE_PORT"
fi

if [[ "$BACKOFFICE_PORT" =~ ^[0-9]+$ ]]; then
    echo "✅ BACKOFFICE_PORT is valid: $BACKOFFICE_PORT"
else
    echo "❌ BACKOFFICE_PORT is invalid or not set: $BACKOFFICE_PORT"
fi

# Check if ports are available
echo ""
echo "🔌 Port Availability Check:"

check_port() {
    local port=$1
    local name=$2
    
    if command -v netstat >/dev/null 2>&1; then
        if netstat -an | grep ":$port " >/dev/null 2>&1; then
            echo "⚠️  Port $port ($name) is already in use"
        else
            echo "✅ Port $port ($name) is available"
        fi
    else
        echo "ℹ️  netstat not available, skipping port check for $port ($name)"
    fi
}

check_port "$VITE_PORT" "Frontend"
check_port "$BACKOFFICE_PORT" "Backend"

echo ""
echo "🚀 Debug URLs that will be used:"
echo "Frontend: http://localhost:$VITE_PORT"
echo "Backend API: http://localhost:$BACKOFFICE_PORT"

echo ""
echo "✅ Environment validation complete!"