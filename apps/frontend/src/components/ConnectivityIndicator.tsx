// Componente de indicador de conectividade - OBRIGATÓRIO em todas as telas
import React from 'react';
import { useConnectivity } from '../hooks/useConnectivity';

export const ConnectivityIndicator: React.FC = () => {
  const { isOnline, isHealthy } = useConnectivity();

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        color: 'bg-red-500',
        text: 'Offline',
        icon: '🔴'
      };
    }
    
    if (!isHealthy) {
      return {
        color: 'bg-yellow-500',
        text: 'Conectividade limitada',
        icon: '🟡'
      };
    }
    
    return {
      color: 'bg-green-500',
      text: 'Online',
      icon: '🟢'
    };
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-sm text-gray-700">{config.text}</span>
    </div>
  );
};