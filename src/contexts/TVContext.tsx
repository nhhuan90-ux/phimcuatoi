import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TVContextType {
  isTVMode: boolean;
  setTVMode: (val: boolean) => void;
}

const TVContext = createContext<TVContextType>({ isTVMode: false, setTVMode: () => {} });

export const useTVMode = () => useContext(TVContext);

function detectTVMode(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. URL param override (highest priority)
  const params = new URLSearchParams(window.location.search);
  if (params.get('tv') === '1') {
    localStorage.setItem('preferredMode', 'tv');
    return true;
  }
  if (params.get('tv') === '0') {
    localStorage.setItem('preferredMode', 'web');
    return false;
  }

  // 2. Check localStorage preference
  const pref = localStorage.getItem('preferredMode');
  if (pref === 'tv') return true;
  if (pref === 'web') return false;

  // 3. Smart TV and browser user-agent detection
  const ua = navigator.userAgent.toLowerCase();
  const isTV = 
    ua.includes('tv') ||
    ua.includes('smarttv') ||
    ua.includes('smart-tv') ||
    ua.includes('googletv') ||
    ua.includes('appletv') ||
    ua.includes('hbbtv') ||
    ua.includes('tizen') ||
    ua.includes('webos') ||
    ua.includes('aft') || // Amazon Fire TV
    ua.includes('firetv') || // Fire TV
    ua.includes('shield') || // Nvidia Shield
    ua.includes('chromecast') ||
    ua.includes('nexus player') ||
    ua.includes('mi box') ||
    ua.includes('bravia') || // Sony
    ua.includes('philips') ||
    ua.includes('playstation') ||
    ua.includes('xbox') ||
    ua.includes('nintendo') ||
    ua.includes('crkey') || // Chromecast
    ua.includes('dlnadoc');

  // 4. Check if running in Capacitor
  const isCapacitor = !!(window as any).Capacitor;

  // 5. Large screen with no touch
  const isLargeScreen = window.screen.width >= 960 && window.screen.height >= 540;
  const noTouch = !('ontouchstart' in window) && navigator.maxTouchPoints === 0;

  return isTV || (isCapacitor && isLargeScreen && noTouch);
}

export function TVProvider({ children }: { children: ReactNode }) {
  const [isTVMode, setTVMode] = useState(false);

  useEffect(() => {
    // Initial detection
    const isTV = detectTVMode();
    setTVMode(isTV);

    // Save initial status to localStorage if not set yet
    if (!localStorage.getItem('preferredMode')) {
      localStorage.setItem('preferredMode', isTV ? 'tv' : 'web');
    }

    const handleHashChange = () => {
      if (window.location.pathname.startsWith('/tv')) {
        setTVMode(true);
        localStorage.setItem('preferredMode', 'tv');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSetTVMode = (val: boolean) => {
    setTVMode(val);
    localStorage.setItem('preferredMode', val ? 'tv' : 'web');
  };

  return (
    <TVContext.Provider value={{ isTVMode, setTVMode: handleSetTVMode }}>
      {children}
    </TVContext.Provider>
  );
}
