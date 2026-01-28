#!/bin/bash
# Script genérico para detectar o caminho do projeto
# Funciona em qualquer diretório e sistema
# Encoding: UTF-8 without BOM

set -e

# Forçar UTF-8
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

# Função para detectar o diretório raiz do projeto
get_project_root() {
    local current_dir="$(pwd)"
    local search_dir="$current_dir"
    
    # Procurar por arquivos que indicam a raiz do projeto
    while [[ "$search_dir" != "/" ]]; do
        # Verificar se é a raiz do projeto (tem package.json E docker-compose.debug.yml)
        if [[ -f "$search_dir/package.json" && -f "$search_dir/docker-compose.debug.yml" && -f "$search_dir/.env" ]]; then
            echo "$search_dir"
            return 0
        fi
        
        # Subir um nível
        search_dir="$(dirname "$search_dir")"
    done
    
    # Se não encontrou, usar diretório atual
    echo "$current_dir"
    return 1
}

# Função para converter caminho Windows para WSL se necessário
normalize_path() {
    local path="$1"
    
    # Se estamos no WSL e o caminho parece ser Windows
    if [[ -f /proc/version ]] && grep -qi microsoft /proc/version; then
        # Se o caminho começa com /mnt/c/ já está correto
        if [[ "$path" =~ ^/mnt/[a-z]/ ]]; then
            echo "$path"
        # Se o caminho parece ser Windows (C:\...)
        elif [[ "$path" =~ ^[A-Za-z]: ]]; then
            # Converter para formato WSL
            local drive=$(echo "$path" | cut -c1 | tr '[:upper:]' '[:lower:]')
            local rest=$(echo "$path" | cut -c3- | sed 's|\\|/|g')
            echo "/mnt/$drive$rest"
        else
            echo "$path"
        fi
    else
        echo "$path"
    fi
}

# Função principal
main() {
    local project_root
    local normalized_path
    
    # Detectar raiz do projeto
    project_root=$(get_project_root)
    
    # Normalizar caminho
    normalized_path=$(normalize_path "$project_root")
    
    # Retornar caminho
    echo "$normalized_path"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi