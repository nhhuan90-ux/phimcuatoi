import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  m3u8Url?: string;
  embedUrl?: string;
  title: string;
  playerKey: number;
}

export default function VideoPlayer({ m3u8Url, embedUrl, title, playerKey }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'m3u8' | 'embed'>('m3u8');
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    // Reset state on key change
    setError(null);
    if (m3u8Url) {
      setMode('m3u8');
    } else if (embedUrl) {
      setMode('embed');
    }
  }, [playerKey, m3u8Url, embedUrl]);

  useEffect(() => {
    if (mode !== 'm3u8' || !m3u8Url || !videoRef.current) return;

    const video = videoRef.current;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if native HLS is supported (Safari / iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = m3u8Url;
      video.addEventListener('error', () => {
        console.warn('Native HLS failed, trying embed...');
        if (embedUrl) {
          setMode('embed');
        } else {
          setError('Không thể phát video. Vui lòng thử lại sau.');
        }
      }, { once: true });
      return;
    }

    // Load HLS.js dynamically
    const loadHls = async () => {
      try {
        // @ts-ignore - dynamic import from CDN
        if (!(window as any).Hls) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load HLS.js'));
            document.head.appendChild(script);
          });
        }

        const Hls = (window as any).Hls;
        if (!Hls.isSupported()) {
          console.warn('HLS.js not supported, trying embed...');
          if (embedUrl) {
            setMode('embed');
          } else {
            setError('Trình duyệt không hỗ trợ phát video HLS.');
          }
          return;
        }

        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hlsRef.current = hls;

        hls.loadSource(m3u8Url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {
            // Autoplay blocked, user needs to click play
          });
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            console.warn('HLS fatal error, trying embed...', data);
            hls.destroy();
            hlsRef.current = null;
            if (embedUrl) {
              setMode('embed');
            } else {
              setError('Lỗi phát video. Vui lòng thử lại sau.');
            }
          }
        });
      } catch (err) {
        console.warn('HLS.js load failed, trying embed...', err);
        if (embedUrl) {
          setMode('embed');
        } else {
          setError('Không thể tải trình phát video.');
        }
      }
    };

    loadHls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [mode, m3u8Url, embedUrl, playerKey]);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-4 bg-black">
        <p>{error}</p>
        {embedUrl && (
          <a
            href={embedUrl.replace(/^http:\/\//i, 'https://')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
          >
            🔗 Mở link trực tiếp
          </a>
        )}
      </div>
    );
  }

  if (mode === 'm3u8' && m3u8Url) {
    return (
      <video
        ref={videoRef}
        key={`m3u8-${playerKey}`}
        className="absolute top-0 left-0 w-full h-full bg-black"
        controls
        playsInline
        title={title}
      />
    );
  }

  if (mode === 'embed' && embedUrl) {
    return (
      <iframe
        key={`embed-${playerKey}`}
        src={embedUrl.replace(/^http:\/\//i, 'https://')}
        className="absolute top-0 left-0 w-full h-full border-0"
        allowFullScreen
        title={title}
      ></iframe>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
      Không tìm thấy link phát video.
    </div>
  );
}
