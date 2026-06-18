import { useEffect, useCallback, useRef } from 'react';

const FOCUSABLE_SELECTOR = '[data-focusable="true"]';

interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  cx: number;
  cy: number;
}

function getRect(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top,
    bottom: r.bottom,
    left: r.left,
    right: r.right,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };
}

function distance(a: Rect, b: Rect, direction: string): number {
  let primary = 0;
  let secondary = 0;

  switch (direction) {
    case 'ArrowRight':
      if (b.left <= a.right) return Infinity;
      primary = b.left - a.right;
      secondary = Math.abs(b.cy - a.cy);
      break;
    case 'ArrowLeft':
      if (b.right >= a.left) return Infinity;
      primary = a.left - b.right;
      secondary = Math.abs(b.cy - a.cy);
      break;
    case 'ArrowDown':
      if (b.top <= a.bottom - 5) return Infinity;
      primary = b.top - a.bottom;
      secondary = Math.abs(b.cx - a.cx);
      break;
    case 'ArrowUp':
      if (b.bottom >= a.top + 5) return Infinity;
      primary = a.top - b.bottom;
      secondary = Math.abs(b.cx - a.cx);
      break;
  }

  return primary + secondary * 0.3;
}

function findBestCandidate(
  current: HTMLElement,
  direction: string,
  container: HTMLElement
): HTMLElement | null {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => {
    if (el === current) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  if (candidates.length === 0) return null;

  const currentRect = getRect(current);
  let bestEl: HTMLElement | null = null;
  let bestDist = Infinity;

  for (const el of candidates) {
    const elRect = getRect(el);
    const d = distance(currentRect, elRect, direction);
    if (d < bestDist) {
      bestDist = d;
      bestEl = el;
    }
  }

  return bestEl;
}

export function useSpatialNavigation(containerRef?: React.RefObject<HTMLElement | null>) {
  const lastFocused = useRef<HTMLElement | null>(null);

  const focusElement = useCallback((el: HTMLElement) => {
    el.focus({ preventScroll: false });
    el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
    lastFocused.current = el;

    // Dispatch custom event for components to react
    el.dispatchEvent(new CustomEvent('spatialfocus', { bubbles: true }));
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const directions = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!directions.includes(e.key)) return;

      const container = containerRef?.current || document.body;
      const current = document.activeElement as HTMLElement;

      if (!current || !current.hasAttribute('data-focusable')) {
        // No current focus — focus first focusable
        const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        if (first) {
          e.preventDefault();
          focusElement(first);
        }
        return;
      }

      const next = findBestCandidate(current, e.key, container);
      if (next) {
        e.preventDefault();
        focusElement(next);
      }
    },
    [containerRef, focusElement]
  );

  // Back button handling for Android TV remote
  const handleBackKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Backspace' || e.key === 'GoBack' || e.keyCode === 4) {
      // Let the browser/router handle back navigation
      // But prevent default if we're at root
      if (window.location.pathname === '/' || window.location.pathname === '/tv') {
        e.preventDefault();
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleBackKey);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleBackKey);
    };
  }, [handleKeyDown, handleBackKey]);

  // Auto-focus first element on mount
  useEffect(() => {
    const container = containerRef?.current || document.body;
    const timer = setTimeout(() => {
      const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (first && !document.activeElement?.hasAttribute('data-focusable')) {
        focusElement(first);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [containerRef, focusElement]);

  return { focusElement, lastFocused };
}
