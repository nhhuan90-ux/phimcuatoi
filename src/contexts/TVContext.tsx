import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TVContextType {
  isTVMode: boolean;
  setTVMode: (val: boolean) => void;
}

const TVContext = createContext<TVContextType>({ isTVMode: false, setTVMode: () => {} });

export const useTVMode = () => useContext(TVContext);

function detectTVMode(): boolean {
  // 1. URL param override
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tv') === '1') return true;
    if (params.get('tv') === '0') return false;
  }

  // 2. Capacitor/WebView on TV detection
  const ua = navigator.userAgent.toLowerCase();
  const isAndroidTV = ua.includes('android') && (
    ua.includes('tv') ||
    ua.includes('aft') || // Amazon Fire TV
    ua.includes('shield') || // Nvidia Shield
    ua.includes('chromecast') ||
    ua.includes('nexus player') ||
    ua.includes('mi box') ||
    ua.includes('bravia') || // Sony
    ua.includes('smart-tv') ||
    ua.includes('smarttv') ||
    ua.includes('philips') ||
    ua.includes('hbbtv')
  );

  // 3. Check if running in Capacitor
  const isCapacitor = !!(window as any).Capacitor;

  // 4. Large screen with no touch
  const isLargeScreen = window.screen.width >= 960 && window.screen.height >= 540;
  const noTouch = !('ontouchstart' in window) && navigator.maxTouchPoints === 0;

  return isAndroidTV || (isCapacitor && isLargeScreen && noTouch);
}

export function TVProvider({ children }: { children: ReactNode }) {
  const [isTVMode, setTVMode] = useState(false);

  useEffect(() => {
    setTVMode(detectTVMode());

    // Also check for URL hash change
    const handleHashChange = () => {
      if (window.location.pathname.startsWith('/tv')) {
        setTVMode(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <TVContext.Provider value={{ isTVMode, setTVMode }}>
      {children}
    </TVContext.Provider>
  );
}
