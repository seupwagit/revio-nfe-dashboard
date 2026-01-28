/**
 * useFloatingPosition - Hook para gerenciar posicionamento flutuante
 * 
 * Hook que gerencia o comportamento de elementos flutuantes baseado no scroll
 * e visibilidade de elementos de referência
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface FloatingPosition {
  isFloating: boolean
  shouldShow: boolean
  isVisible: boolean
}

export interface UseFloatingPositionOptions {
  /** Elemento de referência para calcular posicionamento */
  targetRef: React.RefObject<HTMLElement>
  /** Se deve mostrar o elemento (ex: baseado em seleção) */
  shouldShow: boolean
  /** Offset do topo para considerar elemento visível */
  visibilityOffset?: number
  /** Throttle do scroll em ms */
  scrollThrottle?: number
}

export function useFloatingPosition({
  targetRef,
  shouldShow,
  visibilityOffset = 0,
  scrollThrottle = 16 // ~60fps
}: UseFloatingPositionOptions) {
  const [position, setPosition] = useState<FloatingPosition>({
    isFloating: false,
    shouldShow: false,
    isVisible: false
  })

  const lastScrollTime = useRef<number>(0)
  const animationFrameId = useRef<number>()

  /**
   * Calcula a posição baseada no scroll e visibilidade
   */
  const calculatePosition = useCallback(() => {
    if (!targetRef.current || !shouldShow) {
      setPosition({
        isFloating: false,
        shouldShow,
        isVisible: false
      })
      return
    }

    const element = targetRef.current
    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight

    // Verificar se o elemento está visível na viewport
    const isElementVisible = (
      rect.bottom > visibilityOffset && 
      rect.top < (windowHeight - visibilityOffset)
    )

    // Determinar se deve flutuar
    // Flutua quando o elemento sai da parte inferior da tela
    const shouldFloat = !isElementVisible && rect.top < 0

    setPosition({
      isFloating: shouldFloat,
      shouldShow,
      isVisible: isElementVisible
    })
  }, [targetRef, shouldShow, visibilityOffset])

  /**
   * Handler de scroll com throttle
   */
  const handleScroll = useCallback(() => {
    const now = Date.now()
    
    // Throttle simples
    if (now - lastScrollTime.current < scrollThrottle) {
      return
    }
    
    lastScrollTime.current = now

    // Cancelar frame anterior se existir
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
    }

    // Agendar cálculo para próximo frame
    animationFrameId.current = requestAnimationFrame(calculatePosition)
  }, [calculatePosition, scrollThrottle])

  /**
   * Handler de resize
   */
  const handleResize = useCallback(() => {
    // Recalcular imediatamente no resize
    calculatePosition()
  }, [calculatePosition])

  /**
   * Effect para gerenciar listeners
   */
  useEffect(() => {
    if (shouldShow) {
      // Calcular posição inicial
      calculatePosition()
      
      // Adicionar listeners
      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', handleResize, { passive: true })
      
      return () => {
        // Cleanup
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
        
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current)
        }
      }
    } else {
      // Limpar quando não deve mostrar
      setPosition({
        isFloating: false,
        shouldShow: false,
        isVisible: false
      })
    }
  }, [shouldShow, calculatePosition, handleScroll, handleResize])

  /**
   * Effect para limpeza quando componente desmonta
   */
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  return position
}