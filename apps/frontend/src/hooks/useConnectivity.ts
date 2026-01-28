// Hook de conectividade conforme steering rules
import { useState, useEffect } from 'react';
import { connectivityService } from '../services/ConnectivityService';

export const useConnectivity = () => {
  const [status, setStatus] = useState(connectivityService.getStatus());

  useEffect(() => {
    const handleConnectivityChange = (event: CustomEvent) => {
      setStatus(event.detail);
    };

    window.addEventListener('connectivityChange', handleConnectivityChange as EventListener);
    
    return () => {
      window.removeEventListener('connectivityChange', handleConnectivityChange as EventListener);
    };
  }, []);

  return status;
};