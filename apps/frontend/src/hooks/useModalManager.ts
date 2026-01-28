/**
 * Modal Manager Hook
 * 
 * Hook for managing multiple modal windows with z-index coordination
 */

import { useState, useCallback } from 'react';

export interface ModalInstance {
  id: string;
  title: string;
  isOpen: boolean;
  zIndex: number;
}

export const useModalManager = () => {
  const [modals, setModals] = useState<Map<string, ModalInstance>>(new Map());
  const [nextZIndex, setNextZIndex] = useState(1000);

  const openModal = useCallback((id: string, title: string) => {
    setModals(prev => {
      const newModals = new Map(prev);
      const zIndex = nextZIndex;
      
      newModals.set(id, {
        id,
        title,
        isOpen: true,
        zIndex
      });
      
      setNextZIndex(zIndex + 1);
      return newModals;
    });
  }, [nextZIndex]);

  const closeModal = useCallback((id: string) => {
    setModals(prev => {
      const newModals = new Map(prev);
      const modal = newModals.get(id);
      
      if (modal) {
        newModals.set(id, { ...modal, isOpen: false });
        // Remove after animation
        setTimeout(() => {
          setModals(current => {
            const updated = new Map(current);
            updated.delete(id);
            return updated;
          });
        }, 300);
      }
      
      return newModals;
    });
  }, []);

  const bringToFront = useCallback((id: string) => {
    setModals(prev => {
      const newModals = new Map(prev);
      const modal = newModals.get(id);
      
      if (modal) {
        const zIndex = nextZIndex;
        newModals.set(id, { ...modal, zIndex });
        setNextZIndex(zIndex + 1);
      }
      
      return newModals;
    });
  }, [nextZIndex]);

  const getModal = useCallback((id: string): ModalInstance | undefined => {
    return modals.get(id);
  }, [modals]);

  const isModalOpen = useCallback((id: string): boolean => {
    const modal = modals.get(id);
    return modal?.isOpen || false;
  }, [modals]);

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const newModals = new Map();
      prev.forEach((modal, id) => {
        newModals.set(id, { ...modal, isOpen: false });
      });
      
      // Remove all after animation
      setTimeout(() => {
        setModals(new Map());
      }, 300);
      
      return newModals;
    });
  }, []);

  return {
    modals: Array.from(modals.values()),
    openModal,
    closeModal,
    bringToFront,
    getModal,
    isModalOpen,
    closeAllModals
  };
};