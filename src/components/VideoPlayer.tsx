import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  m3u8Url?: string;
  embedUrl?: string;
  title: string;
  playerKey: number;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  forceEmbed?: boolean;
}

export default function VideoPlayer({
  m3u8Url,
  embedUrl,
  title,
  playerKey,
  initialTime = 0,
  onTimeUpdate,
  forceEmbed = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);

  const safeEmbed = embedUrl ? embedUrl.replace(/^http:\/\//i, 'https://') : '';
  const safeM3u8 = m3u8Url ? (m3u8Url.startsWith('//') ? `https:${m3u8Url}` : m3u8Url) : '';

  // Device & browser detection
  const detectDevice = useCallback(() => {
    let isCocCoc = false;
    let isTvOrProjector = false;
    let isOldBrowser = false;
    try {
      const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '').toLowerCase();
      if (ua.includes('coc_coc') || ua.includes('coccoc')) isCocCoc = true;
      if (
        ua.includes('tv') ||
        ua.includes('smarttv') ||
        ua.includes('tizen') ||
        ua.includes('webos') ||
        ua.includes('androidtv') ||
        ua.includes('googletv') ||
        ua.includes('projector') ||
        ua.includes('aftb') || // FireTV
        (ua.includes('android') && (ua.includes('large') || ua.includes('box')))
      ) {
        isTvOrProjector = true;
      }
      const chromeMatch = ua.match(/chrome\/(\d+)/);
      if (chromeMatch && parseInt(chromeMatch[1], 10) < 80) isOldBrowser = true;
    } catch (e) {}
    return { isCocCoc, isTvOrProjector, isOldBrowser };
  }, []);

  const deviceInfo = detectDevice();

  // Active player mode: 'hls' | 'native' | 'embed'
  const [playerMode, setPlayerMode] = useState<'hls' | 'native' | 'embed'>(() => {
    if (forceEmbed && safeEmbed) return 'embed';
    if (!safeM3u8 && safeEmbed) return 'embed';
    // On Cốc Cốc, Smart TV, or Android projector: Native HTML5 provides direct hardware decoding!
    if (safeM3u8 && (deviceInfo.isCocCoc || deviceInfo.isTvOrProjector || deviceInfo.isOldBrowser)) {
      return 'native';
    }
    return safeM3u8 ? 'hls' : 'embed';
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExternalMenu, setShowExternalMenu] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Sync mode if forceEmbed changes
  useEffect(() => {
    if (forceEmbed && safeEmbed) {
      setPlayerMode('embed');
    }
  }, [forceEmbed, safeEmbed]);

  // Video aspect ratio height
  const h = typeof window !== 'undefined' ? Math.round(window.innerWidth / 1.777) : 340;

  // Initialize playback based on current mode
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || playerMode === 'embed' || !safeM3u8) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    setErrorMessage(null);

    // Mode: NATIVE HTML5 (Pure hardware acceleration for TV, Cốc Cốc, old Android)
    if (playerMode === 'native') {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoEl.src = safeM3u8;
      videoEl.play().catch(() => {});
      return;
    }

    // Mode: HLS.js
    if (playerMode === 'hls') {
      if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        try {
          const hls = new Hls({
            maxBufferLength: 8,
            maxMaxBufferLength: 16,
            maxBufferSize: 12 * 1024 * 1024,
            enableWorker: false, // Avoid WebWorker crashes on old Android WebView / TVs
            lowLatencyMode: false,
          });
          hlsRef.current = hls;
          hls.loadSource(safeM3u8);
          hls.attachMedia(videoEl);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoEl.play().catch(() => {});
          });

          hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  // Fatal unrecoverable Hls.js error -> Auto-fallback to Native HTML5
                  console.warn('[VideoPlayer] Hls.js fatal error, switching to Native HTML5...');
                  hls.destroy();
                  hlsRef.current = null;
                  setPlayerMode('native');
                  break;
              }
            }
          });
        } catch (err) {
          // If Hls.js initialization throws, fallback to Native immediately
          setPlayerMode('native');
        }
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl') || videoEl.canPlayType('application/x-mpegURL')) {
        // Native HLS support (Safari, Android stock browser)
        videoEl.src = safeM3u8;
        videoEl.play().catch(() => {});
      } else if (safeEmbed) {
        // Fallback to embed if no HLS support
        setPlayerMode('embed');
      } else {
        videoEl.src = safeM3u8;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [safeM3u8, playerMode, playerKey, safeEmbed]);

  // Track playback time
  useEffect(() => {
    const v = videoRef.current;
    if (!v || playerMode === 'embed') return;

    let sought = false;
    const onLoad = () => {
      if (!sought && initialTime > 0) {
        try {
          v.currentTime = initialTime;
        } catch (e) {}
        sought = true;
      }
    };

    const onTime = () => {
      if (onTimeUpdate && v.currentTime > 0) {
        onTimeUpdate(v.currentTime, v.duration || 0);
      }
    };

    const onError = () => {
      // Native video failed
      if (playerMode === 'native' && safeEmbed) {
        setErrorMessage('Trình phát Native không đọc được luồng này. Bấm vào bên dưới để đổi sang Trình phát Nhúng.');
      }
    };

    v.addEventListener('loadedmetadata', onLoad);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('error', onError);

    return () => {
      v.removeEventListener('loadedmetadata', onLoad);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('error', onError);
    };
  }, [initialTime, onTimeUpdate, playerMode, safeEmbed]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const el = outerRef.current || videoRef.current;
    if (!el) return;
    try {
      const doc: any = document;
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      } else {
        if (el.requestFullscreen) el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
      }
    } catch (e) {}
  };

  // Launch external player via Android Intent / custom scheme
  const openExternalApp = (appType: 'vlc' | 'mx' | 'system') => {
    if (!safeM3u8) return;
    const cleanStream = safeM3u8;

    if (appType === 'vlc') {
      const intentUrl = `intent:${cleanStream}#Intent;action=android.intent.action.VIEW;type=video/*;package=org.videolan.vlc;end`;
      window.location.href = intentUrl;
      setTimeout(() => {
        window.location.href = `vlc://${cleanStream}`;
      }, 600);
      return;
    }

    if (appType === 'mx') {
      const intentUrl = `intent:${cleanStream}#Intent;action=android.intent.action.VIEW;type=video/*;package=com.mxtech.videoplayer.ad;end`;
      window.location.href = intentUrl;
      return;
    }

    // Generic system player
    const intentUrl = `intent:${cleanStream}#Intent;action=android.intent.action.VIEW;type=video/*;end`;
    window.location.href = intentUrl;
  };

  // Copy m3u8 link to clipboard
  const handleCopyStream = () => {
    if (!safeM3u8) return;
    navigator.clipboard?.writeText(safeM3u8).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }).catch(() => {
      const input = document.createElement('input');
      input.value = safeM3u8;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  // Open standalone lightweight TV player
  const openLitePlayer = () => {
    if (!safeM3u8) return;
    const liteUrl = `/player.html?url=${encodeURIComponent(safeM3u8)}&title=${encodeURIComponent(title)}`;
    window.open(liteUrl, '_blank');
  };

  return (
    <div ref={outerRef} className="w-full flex flex-col bg-black rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
      {/* Video / Iframe viewport */}
      <div style={{ width: '100%', height: h, position: 'relative', background: '#000' }}>
        {playerMode === 'embed' && safeEmbed ? (
          <iframe
            key={'e-' + playerKey}
            src={safeEmbed}
            style={{ display: 'block', width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media"
            title={title}
          />
        ) : safeM3u8 ? (
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            title={title}
            style={{ display: 'block', width: '100%', height: '100%', background: '#000', objectFit: 'contain' }}
          />
        ) : safeEmbed ? (
          <iframe
            key={'e-fb-' + playerKey}
            src={safeEmbed}
            style={{ display: 'block', width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media"
            title={title}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
            <span className="text-4xl mb-3">🎬</span>
            <p className="text-rose-400 font-semibold mb-2">Không tìm thấy luồng phát video</p>
            <p className="text-xs text-zinc-500">Vui lòng thử đổi máy chủ hoặc kiểm tra lại đường truyền.</p>
          </div>
        )}

        {/* In-player Error banner with quick switch */}
        {errorMessage && (
          <div className="absolute top-3 left-3 right-3 bg-red-900/90 border border-red-500 text-white p-3 rounded-md text-xs flex items-center justify-between z-20 backdrop-blur-sm">
            <span>{errorMessage}</span>
            {safeEmbed && (
              <button
                onClick={() => setPlayerMode('embed')}
                className="ml-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow"
              >
                Đổi sang Nhúng
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modern Player Toolbar & Mode Switcher */}
      <div className="bg-[#111115] border-t border-zinc-800 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Player Mode Switcher */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-zinc-400 font-medium mr-1 text-[11px] hidden sm:inline">Chế độ phát:</span>

          {/* Mode 1: Native HTML5 (Best for TV / Cốc Cốc / Old Android) */}
          {safeM3u8 && (
            <button
              onClick={() => setPlayerMode('native')}
              title="Khuyên dùng cho Cốc Cốc, Smart TV và Máy chiếu Android (sử dụng chip giải mã phần cứng)"
              className={`px-2.5 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                playerMode === 'native'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              <span>📺</span>
              <span>TV / Cốc Cốc (Native)</span>
            </button>
          )}

          {/* Mode 2: Hls.js Modern Player */}
          {safeM3u8 && (
            <button
              onClick={() => setPlayerMode('hls')}
              title="Trình phát HLS JavaScript tối ưu cho trình duyệt hiện đại (Chrome, Edge, Firefox, Safari)"
              className={`px-2.5 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                playerMode === 'hls'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              <span>🚀</span>
              <span>HLS Tối ưu</span>
            </button>
          )}

          {/* Mode 3: Embed Iframe */}
          {safeEmbed && (
            <button
              onClick={() => setPlayerMode('embed')}
              title="Dùng luồng phát nhúng dự phòng khi video trực tiếp gặp lỗi"
              className={`px-2.5 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                playerMode === 'embed'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              <span>🔄</span>
              <span>Nhúng Dự phòng</span>
            </button>
          )}
        </div>

        {/* Right: Device / External player options */}
        <div className="flex items-center flex-wrap gap-1.5">
          {safeM3u8 && (
            <div className="relative">
              <button
                onClick={() => setShowExternalMenu(!showExternalMenu)}
                className="px-2.5 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded font-medium transition-colors flex items-center gap-1"
                title="Mở video bằng ứng dụng VLC, MX Player hoặc trình phát ngoài trên TV / Android"
              >
                <span>📱</span>
                <span>Mở bằng App TV</span>
                <span className="text-[10px]">▼</span>
              </button>

              {showExternalMenu && (
                <div className="absolute right-0 bottom-full mb-1.5 w-60 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 z-50 text-left">
                  <div className="text-[11px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider border-b border-zinc-800 mb-1">
                    Trình phát ngoài cho TV & Máy chiếu
                  </div>
                  <button
                    onClick={() => { openExternalApp('vlc'); setShowExternalMenu(false); }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded text-zinc-200 flex items-center gap-2"
                  >
                    <span className="text-orange-500 font-bold">🟠</span> Mở bằng VLC Player
                  </button>
                  <button
                    onClick={() => { openExternalApp('mx'); setShowExternalMenu(false); }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded text-zinc-200 flex items-center gap-2"
                  >
                    <span className="text-blue-400 font-bold">🔵</span> Mở bằng MX Player
                  </button>
                  <button
                    onClick={() => { openExternalApp('system'); setShowExternalMenu(false); }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded text-zinc-200 flex items-center gap-2"
                  >
                    <span className="text-purple-400 font-bold">🎬</span> Mở bằng App Video của máy
                  </button>
                  <button
                    onClick={() => { openLitePlayer(); setShowExternalMenu(false); }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded text-amber-300 flex items-center gap-2"
                  >
                    <span className="font-bold">⚡</span> Mở Player Siêu nhẹ (Lite)
                  </button>
                  <button
                    onClick={() => { handleCopyStream(); setShowExternalMenu(false); }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded text-zinc-300 flex items-center gap-2 border-t border-zinc-800 mt-1"
                  >
                    <span>📋</span> {copySuccess ? 'Đã sao chép link!' : 'Sao chép link luồng M3U8'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Standalone Lite Player shortcut for TV */}
          {safeM3u8 && (
            <button
              onClick={openLitePlayer}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded font-medium transition-colors hidden md:flex items-center gap-1"
              title="Mở trang phát siêu nhẹ không có React, dành cho Smart TV đời cổ hoặc máy chiếu RAM yếu"
            >
              <span>⚡</span>
              <span>Player Siêu nhẹ</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium transition-colors flex items-center gap-1"
            title="Toàn màn hình"
          >
            <span>⛶</span>
            <span className="hidden sm:inline">Toàn màn hình</span>
          </button>
        </div>
      </div>
    </div>
  );
}