/**
 * DANFE Modal Window Component
 * 
 * Modal window component with desktop-like behavior for DANFE PDF viewing
 * Features: draggable, resizable, title bar, close button, z-index management
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface DANFEModalWindowProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

let zIndexCounter = 1000;

export const DANFEModalWindow: React.FC<DANFEModalWindowProps> = ({
  isOpen,
  title,
  onClose,
  children,
  initialWidth = 800,
  initialHeight = 600,
  minWidth = 400,
  minHeight = 300,
  maxWidth = window.innerWidth - 40,
  maxHeight = window.innerHeight - 40
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [position, setPosition] = useState<Position>({ 
    x: (window.innerWidth - initialWidth) / 2, 
    y: (window.innerHeight - initialHeight) / 2 
  });
  const [size, setSize] = useState<Size>({ 
    width: initialWidth, 
    height: initialHeight 
  });
  const [zIndex, setZIndex] = useState(1000);
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevSize, setPrevSize] = useState<Size>({ width: initialWidth, height: initialHeight });
  const [prevPosition, setPrevPosition] = useState<Position>({ 
    x: (window.innerWidth - initialWidth) / 2, 
    y: (window.innerHeight - initialHeight) / 2 
  });

  // Center modal when opened
  useEffect(() => {
    if (isOpen) {
      const centerX = (window.innerWidth - size.width) / 2;
      const centerY = (window.innerHeight - size.height) / 2;
      setPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
      setZIndex(++zIndexCounter);
    }
  }, [isOpen, size.width, size.height]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Dragging functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    
    if (e.target === titleBarRef.current || titleBarRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      setZIndex(++zIndexCounter);
    }
  }, [position, isMaximized]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragStart, size]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Toggle Maximize functionality
  const toggleMaximize = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (isMaximized) {
      // Restore
      setSize(prevSize);
      setPosition(prevPosition);
      setIsMaximized(false);
    } else {
      // Maximize
      setPrevSize(size);
      setPrevPosition(position);
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setPosition({ x: 0, y: 0 });
      setIsMaximized(true);
    }
  }, [isMaximized, size, position, prevSize, prevPosition]);

  // Update maximized size on window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (isMaximized) {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isMaximized]);

  // Resizing functionality
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setZIndex(++zIndexCounter);
  }, [isMaximized]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top));
      
      setSize({ width: newWidth, height: newHeight });
    }
  }, [isResizing, minWidth, minHeight, maxWidth, maxHeight]);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDragging ? 'move' : 'nw-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, isResizing, handleMouseMove, handleResizeMouseMove, handleMouseUp]);

  // Bring to front on click
  const handleModalClick = useCallback(() => {
    setZIndex(++zIndexCounter);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        style={{ zIndex: zIndex - 1 }}
      />

      {/* Modal Window */}
      <div
        ref={modalRef}
        className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          zIndex: zIndex,
          minWidth: isMaximized ? 'none' : minWidth,
          minHeight: isMaximized ? 'none' : minHeight,
          maxWidth: isMaximized ? 'none' : maxWidth,
          maxHeight: isMaximized ? 'none' : maxHeight,
          borderRadius: isMaximized ? '0' : undefined,
          transition: isDragging || isResizing ? 'none' : 'all 0.2s ease-out'
        }}
        onClick={handleModalClick}
        onMouseDown={handleMouseDown}
      >
        {/* Title Bar */}
        <div
          ref={titleBarRef}
          className={`bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between select-none ${isMaximized ? 'cursor-default' : 'cursor-move'}`}
          onDoubleClick={toggleMaximize}
          style={{ height: '40px' }}
        >
          <div className="flex items-center space-x-2">
            {/* Window Icon */}
            <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Title */}
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {title}
            </h3>
          </div>

          {/* Window Controls */}
          <div className="flex items-center space-x-1">
            {/* Minimize Button (placeholder) */}
            <button
              type="button"
              className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
              title="Minimizar"
              onClick={(e) => {
                e.stopPropagation();
                // Placeholder for minimize functionality
              }}
            >
              <div className="w-3 h-0.5 bg-gray-600"></div>
            </button>

            {/* Maximize/Restore Button */}
            <button
              type="button"
              className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
              title={isMaximized ? "Restaurar" : "Maximizar"}
              onClick={toggleMaximize}
            >
              {isMaximized ? (
                <div className="w-3 h-3 border-2 border-gray-600 relative">
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-gray-600"></div>
                </div>
              ) : (
                <div className="w-3 h-3 border-2 border-gray-600"></div>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded flex items-center justify-center"
              title="Fechar"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div 
          className="flex-1 overflow-hidden"
          style={{ height: 'calc(100% - 40px)' }}
        >
          {children}
        </div>

        {/* Resize Handle - only show when not maximized */}
        {!isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
            onMouseDown={handleResizeMouseDown}
            style={{
              background: 'linear-gradient(-45deg, transparent 0%, transparent 30%, #ccc 30%, #ccc 40%, transparent 40%, transparent 60%, #ccc 60%, #ccc 70%, transparent 70%)'
            }}
          />
        )}
      </div>
    </>
  );
};

export default DANFEModalWindow;