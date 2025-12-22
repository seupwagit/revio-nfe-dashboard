/**
 * Exemplo de Uso Seguro do StorageService
 * 
 * Demonstra como usar o StorageService para operações seguras
 * de localStorage, especialmente para dados de autenticação
 */

import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { httpService } from '../services/httpService';
import { useAuth } from '../contexts/AuthContext';

export const StorageSecurityExample: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  // Atualizar estatísticas do storage
  const updateStats = () => {
    const storageStats = storageService.getStats();
    setStats(storageStats);

    if (isAuthenticated) {
      const token = storageService.getAuthToken();
      const isExpired = storageService.isTokenExpired();
      const timeRemaining = storageService.getTokenTimeRemaining();

      setTokenInfo({
        hasToken: !!token,
        isExpired,
        timeRemaining,
        timeRemainingFormatted: formatTime(timeRemaining)
      });
    } else {
      setTokenInfo(null);
    }
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Atualizar a cada 5 segundos
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return 'Expirado';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Demonstrar operações seguras
  const handleClearCache = () => {
    const removed = storageService.clearCache();
    alert(`${removed} entradas de cache removidas. Token de autenticação preservado!`);
    updateStats();
  };

  const handleClearGridCache = () => {
    const removed = storageService.clearCacheByPrefix('revio_grid_cache_');
    alert(`${removed} entradas de cache de grid removidas.`);
    updateStats();
  };

  const handleClearAnalyticsCache = () => {
    const removed = storageService.clearCacheByPrefix('revio_analytics_cache_');
    alert(`${removed} entradas de cache de analytics removidas.`);
    updateStats();
  };

  // Demonstrar tentativa de operação perigosa (será bloqueada)
  const handleDangerousOperation = () => {
    const success = storageService.removeItem('revio_auth_token');
    if (!success) {
      alert('❌ Operação bloqueada! Tentativa de remover token de autenticação foi impedida.');
    }
    updateStats();
  };

  // Testar requisições HTTP
  const handleTestHttpRequest = async () => {
    try {
      const response = await httpService.get('/api/test', {
        errorContext: 'Teste de requisição com token automático'
      });
      
      if (response.success) {
        alert('✅ Requisição bem-sucedida! Token incluído automaticamente.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    }
  };

  const handleTestPublicRequest = async () => {
    try {
      const response = await httpService.publicRequest('/api/public');
      
      if (response.success) {
        alert('✅ Requisição pública bem-sucedida! Token não incluído.');
      }
    } catch (error) {
      console.error('Erro na requisição pública:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Storage Seguro
        </h1>
        <p className="text-gray-600">
          Demonstração das funcionalidades de segurança do StorageService
        </p>
      </div>

      {/* Status de Autenticação */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Status de Autenticação</h2>
        
        {isAuthenticated && user ? (
          <div className="space-y-2 text-blue-800">
            <p><strong>Usuário:</strong> {user.usrNome} ({user.usrLogin})</p>
            <p><strong>Banco:</strong> {user.bancoDeDados}</p>
            <p><strong>Admin:</strong> {user.isAdmin ? 'Sim' : 'Não'}</p>
            
            {tokenInfo && (
              <div className="mt-4 p-4 bg-blue-100 rounded">
                <h3 className="font-semibold mb-2">Informações do Token:</h3>
                <p><strong>Token presente:</strong> {tokenInfo.hasToken ? '✅ Sim' : '❌ Não'}</p>
                <p><strong>Status:</strong> {tokenInfo.isExpired ? '❌ Expirado' : '✅ Válido'}</p>
                <p><strong>Tempo restante:</strong> {tokenInfo.timeRemainingFormatted}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-blue-800">❌ Não autenticado</p>
        )}
      </section>

      {/* Estatísticas do Storage */}
      {stats && (
        <section className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-green-900 mb-4">Estatísticas do LocalStorage</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-green-800">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalKeys}</div>
              <div className="text-sm">Total de Chaves</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.protectedKeys}</div>
              <div className="text-sm">Chaves Protegidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.cacheKeys}</div>
              <div className="text-sm">Chaves de Cache</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(stats.totalSize / 1024)}KB</div>
              <div className="text-sm">Tamanho Total</div>
            </div>
          </div>
        </section>
      )}

      {/* Operações Seguras */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Operações Seguras</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleClearCache}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🗑️ Limpar Todo Cache
            <div className="text-sm opacity-90">Preserva token de autenticação</div>
          </button>

          <button
            onClick={handleClearGridCache}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            📊 Limpar Cache de Grid
            <div className="text-sm opacity-90">Apenas dados de grid</div>
          </button>

          <button
            onClick={handleClearAnalyticsCache}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            📈 Limpar Cache Analytics
            <div className="text-sm opacity-90">Apenas dados de analytics</div>
          </button>

          <button
            onClick={updateStats}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🔄 Atualizar Estatísticas
            <div className="text-sm opacity-90">Recarregar informações</div>
          </button>
        </div>
      </section>

      {/* Teste de Requisições HTTP */}
      {isAuthenticated && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Testes de Requisições HTTP</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleTestHttpRequest}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🔐 Requisição Autenticada
              <div className="text-sm opacity-90">Token incluído automaticamente</div>
            </button>

            <button
              onClick={handleTestPublicRequest}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🌐 Requisição Pública
              <div className="text-sm opacity-90">Sem token de autenticação</div>
            </button>
          </div>
        </section>
      )}

      {/* Operação Perigosa (Demonstração) */}
      <section className="bg-red-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-red-900 mb-4">⚠️ Teste de Segurança</h2>
        <p className="text-red-800 mb-4">
          O botão abaixo tenta remover o token de autenticação diretamente. 
          Esta operação será <strong>bloqueada</strong> pelo sistema de segurança.
        </p>
        
        <button
          onClick={handleDangerousOperation}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          🚨 Tentar Remover Token (Será Bloqueado)
        </button>
      </section>

      {/* Instruções */}
      <section className="bg-yellow-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">💡 Como Funciona</h3>
        <div className="text-yellow-800 space-y-2">
          <p>• <strong>Chaves Protegidas:</strong> Token e dados do usuário não podem ser removidos por operações genéricas</p>
          <p>• <strong>Cache Inteligente:</strong> Sistema diferencia entre cache e dados críticos</p>
          <p>• <strong>Token Automático:</strong> Incluído automaticamente em todas as requisições HTTP</p>
          <p>• <strong>Validação Contínua:</strong> Token é verificado automaticamente quanto à expiração</p>
          <p>• <strong>Logs de Segurança:</strong> Tentativas de operações perigosas são logadas</p>
        </div>
      </section>
    </div>
  );
};