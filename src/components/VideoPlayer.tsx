import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  m3u8Url?: string;
  embedUrl?: string;
  title: string;
  playerKey: number;
}

export default function VideoPlayer({ m3u8Url, embedUrl, title, playerKey }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'loading' | 'm3u8' | 'fallback'>('loading');
  const hlsRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setMode('loading');

    // Cleanup previous
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!m3u8Url) {
      setMode('fallback');
      return;
    }

    // Set a timeout - if HLS doesn't start within 8 seconds, go to fallback
    timeoutRef.current = window.setTimeout(() => {
      console.warn('HLS loading timeout, switching to fallback');
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setMode('fallback');
    }, 8000);

    // Try loading HLS
    const initPlayer = async () => {
      try {
        // Load HLS.js from CDN if not already loaded
        if (!(window as any).Hls) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src*="hls.js"]');
            if (existing) {
              // Wait for existing script to load
              const check = setInterval(() => {
                if ((window as any).Hls) { clearInterval(check); resolve(); }
              }, 100);
              setTimeout(() => { clearInterval(check); reject(new Error('HLS.js timeout')); }, 5000);
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load HLS.js'));
            document.head.appendChild(script);
          });
        }

        const Hls = (window as any).Hls;

        // Check native HLS support first (Safari / iOS)
        if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = m3u8Url;
          setMode('m3u8');
          videoRef.current.addEventListener('error', () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setMode('fallback');
          }, { once: true });
          videoRef.current.addEventListener('loadeddata', () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }, { once: true });
          return;
        }

        if (!Hls.isSupported()) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setMode('fallback');
          return;
        }

        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          xhrSetup: (xhr: XMLHttpRequest) => {
            xhr.timeout = 6000;
          }
        });
        hlsRef.current = hls;

        hls.loadSource(m3u8Url);
        hls.attachMedia(videoRef.current!);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setMode('m3u8');
          videoRef.current?.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            console.warn('HLS fatal error:', data.type, data.details);
            hls.destroy();
            hlsRef.current = null;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setMode('fallback');
          }
        });

      } catch (err) {
        console.warn('HLS init failed:', err);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setMode('fallback');
      }
    };

    // Small delay to ensure videoRef is mounted
    requestAnimationFrame(() => initPlayer());

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [m3u8Url, playerKey]);

  // Loading state
  if (mode === 'loading') {
    return (
      <>
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full bg-black"
          controls
          playsInline
          title={title}
          style={{ opacity: 0 }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Đang kết nối nguồn phim...</p>
        </div>
      </>
    );
  }

  // HLS m3u8 playing successfully
  if (mode === 'm3u8') {
    return (
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full bg-black"
        controls
        playsInline
        title={title}
      />
    );
  }

  // Fallback: Show prominent button to open embed directly
  const safeEmbedUrl = embedUrl?.replace(/^http:\/\//i, 'https://');
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-gray-900 to-black px-4">
      <div className="text-center">
        <div className="text-5xl mb-3">🎬</div>
        <p className="text-white text-lg font-semibold mb-1">Nguồn phim hiện không hỗ trợ phát trực tiếp</p>
        <p className="text-gray-400 text-sm">Nhấn nút bên dưới để mở trình phát trong tab mới</p>
      </div>
      {safeEmbedUrl && (
        <a
          href={safeEmbedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-base font-bold transition-all hover:scale-105 shadow-lg shadow-red-600/30 flex items-center gap-2"
        >
          ▶️ Xem Phim Ngay
        </a>
      )}
      {!safeEmbedUrl && (
        <p className="text-red-400 text-sm">Không tìm thấy nguồn phát video cho tập phim này.</p>
      )}
    </div>
  );
}
