/**
 * DOM Manipulation Utilities
 * 
 * Utilities for direct DOM manipulation to avoid React re-renders
 * Optimized for performance-critical components like DANFE Viewer
 */

export class DOMUtils {
  /**
   * Safely update text content without triggering React re-renders
   */
  static updateTextContent(element: Element | null, text: string): void {
    if (element && element.textContent !== text) {
      element.textContent = text;
    }
  }

  /**
   * Safely update HTML content without triggering React re-renders
   */
  static updateInnerHTML(element: Element | null, html: string): void {
    if (element && element.innerHTML !== html) {
      element.innerHTML = html;
    }
  }

  /**
   * Toggle class without triggering React re-renders
   */
  static toggleClass(element: Element | null, className: string, condition: boolean): void {
    if (!element) return;

    if (condition) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  }

  /**
   * Show element by removing 'hidden' class
   */
  static showElement(element: Element | null): void {
    if (element) {
      element.classList.remove('hidden');
    }
  }

  /**
   * Hide element by adding 'hidden' class
   */
  static hideElement(element: Element | null): void {
    if (element) {
      element.classList.add('hidden');
    }
  }

  /**
   * Update attribute value without triggering React re-renders
   */
  static updateAttribute(element: Element | null, attribute: string, value: string): void {
    if (element && element.getAttribute(attribute) !== value) {
      element.setAttribute(attribute, value);
    }
  }

  /**
   * Update iframe src without triggering React re-renders
   */
  static updateIframeSrc(iframe: HTMLIFrameElement | null, src: string): void {
    if (iframe && iframe.src !== src) {
      iframe.src = src;
    }
  }

  /**
   * Clear iframe src
   */
  static clearIframeSrc(iframe: HTMLIFrameElement | null): void {
    if (iframe && iframe.src) {
      iframe.src = '';
    }
  }

  /**
   * Batch DOM updates to minimize reflows
   */
  static batchDOMUpdates(updates: () => void): void {
    // Use requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      updates();
    });
  }

  /**
   * Create element with attributes and classes
   */
  static createElement<T extends HTMLElement>(
    tagName: string,
    attributes?: Record<string, string>,
    classes?: string[],
    textContent?: string
  ): T {
    const element = document.createElement(tagName) as T;

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (classes) {
      element.classList.add(...classes);
    }

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  /**
   * Safely query selector with null check
   */
  static querySelector<T extends Element>(
    parent: Element | Document | null,
    selector: string
  ): T | null {
    if (!parent) return null;
    return parent.querySelector<T>(selector);
  }

  /**
   * Safely query all selectors with null check
   */
  static querySelectorAll<T extends Element>(
    parent: Element | Document | null,
    selector: string
  ): NodeListOf<T> | null {
    if (!parent) return null;
    return parent.querySelectorAll<T>(selector);
  }

  /**
   * Add event listener with cleanup tracking
   */
  static addEventListener<K extends keyof HTMLElementEventMap>(
    element: Element | null,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    if (!element) return () => {};

    element.addEventListener(type, listener as EventListener, options);

    // Return cleanup function
    return () => {
      element.removeEventListener(type, listener as EventListener, options);
    };
  }

  /**
   * Debounce DOM updates to prevent excessive manipulation
   */
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle DOM updates to limit frequency
   */
  static throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Measure DOM operation performance
   */
  static measurePerformance<T>(
    operation: () => T,
    label: string
  ): T {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    console.log(`[DOM Performance] ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  /**
   * Check if element is visible in viewport
   */
  static isElementVisible(element: Element | null): boolean {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Scroll element into view smoothly
   */
  static scrollIntoView(element: Element | null, behavior: ScrollBehavior = 'smooth'): void {
    if (element) {
      element.scrollIntoView({ behavior, block: 'center' });
    }
  }

  /**
   * Get computed style property value
   */
  static getComputedStyleProperty(element: Element | null, property: string): string {
    if (!element) return '';
    return window.getComputedStyle(element).getPropertyValue(property);
  }

  /**
   * Set CSS custom property (CSS variable)
   */
  static setCSSProperty(element: Element | null, property: string, value: string): void {
    if (element instanceof HTMLElement) {
      element.style.setProperty(property, value);
    }
  }

  /**
   * Remove CSS custom property
   */
  static removeCSSProperty(element: Element | null, property: string): void {
    if (element instanceof HTMLElement) {
      element.style.removeProperty(property);
    }
  }
}

/**
 * Performance Monitor for DOM operations
 */
export class DOMPerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();

  static startMeasurement(label: string): () => void {
    const start = performance.now();

    return () => {
      const end = performance.now();
      const duration = end - start;

      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }

      this.measurements.get(label)!.push(duration);

      // Log if operation is slow
      if (duration > 16) { // More than one frame at 60fps
        console.warn(`[DOM Performance] Slow operation: ${label} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  static getAverageTime(label: string): number {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) return 0;

    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  static getStats(label: string): { avg: number; min: number; max: number; count: number } {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    return {
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length
    };
  }

  static logAllStats(): void {
    console.group('[DOM Performance Stats]');
    for (const [label] of this.measurements) {
      const stats = this.getStats(label);
      console.log(`${label}:`, {
        average: `${stats.avg.toFixed(2)}ms`,
        min: `${stats.min.toFixed(2)}ms`,
        max: `${stats.max.toFixed(2)}ms`,
        operations: stats.count
      });
    }
    console.groupEnd();
  }

  static clearStats(): void {
    this.measurements.clear();
  }
}

/**
 * DOM State Manager for complex state without React re-renders
 */
export class DOMStateManager<T extends Record<string, any>> {
  private state: T;
  private listeners: Map<keyof T, Set<(value: any) => void>> = new Map();

  constructor(initialState: T) {
    this.state = { ...initialState };
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.state[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    if (this.state[key] !== value) {
      this.state[key] = value;
      this.notifyListeners(key, value);
    }
  }

  update(updates: Partial<T>): void {
    const changedKeys: (keyof T)[] = [];

    for (const [key, value] of Object.entries(updates) as [keyof T, T[keyof T]][]) {
      if (this.state[key] !== value) {
        this.state[key] = value;
        changedKeys.push(key);
      }
    }

    // Batch notify all changed keys
    DOMUtils.batchDOMUpdates(() => {
      changedKeys.forEach(key => {
        this.notifyListeners(key, this.state[key]);
      });
    });
  }

  subscribe<K extends keyof T>(key: K, listener: (value: T[K]) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  private notifyListeners<K extends keyof T>(key: K, value: T[K]): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => listener(value));
    }
  }

  getState(): Readonly<T> {
    return { ...this.state };
  }

  reset(newState: T): void {
    this.state = { ...newState };
    
    // Notify all listeners of the reset
    DOMUtils.batchDOMUpdates(() => {
      for (const [key, value] of Object.entries(this.state) as [keyof T, T[keyof T]][]) {
        this.notifyListeners(key, value);
      }
    });
  }
}