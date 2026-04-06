import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  m3u8Url?: string;
  embedUrl?: string;
  title: string;
  playerKey: number;
}

export default function VideoPlayer({ m3u8Url, embedUrl, title, playerKey }: VideoPlayerProps) {
  const [iframeError, setIframeError] = useState(false);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Attempt native player if we have m3u8.
    if (m3u8Url && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls({ maxMaxBufferLength: 100 });
        hls.loadSource(m3u8Url);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsPlayingNative(true);
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setIsPlayingNative(false);
                break;
            }
          }
        });
        return () => hls.destroy();
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback for Safari natively supporting HLS
        videoRef.current.src = m3u8Url;
        setIsPlayingNative(true);
      } else {
        setIsPlayingNative(false);
      }
    }
  }, [m3u8Url, playerKey]);

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const safeEmbed = embedUrl?.replace(/^http:\/\//i, 'https://');
  const showNativePlayer = m3u8Url && isPlayingNative;

  if (showNativePlayer) {
    return (
      <div className="absolute inset-0 bg-black w-full h-full group" key={`native-${playerKey}`}>
        <video 
          ref={videoRef}
          className="w-full h-full outline-none"
          controls
          autoPlay
          playsInline
          title={title}
        ></video>
        
        {/* Skip Buttons Overlay - Shown on Hover */}
        <div className="absolute bottom-20 left-4 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => handleSkip(85)}
            className="flex items-center gap-2 bg-black/60 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium border border-white/10 transition-colors backdrop-blur-md shadow-lg outline-none"
          >
            ⏭ Bỏ qua Phần giới thiệu
          </button>
          <button 
            onClick={() => handleSkip(20)}
            className="flex items-center gap-2 bg-black/60 hover:bg-gray-800 text-white px-4 py-2 rounded-md font-medium border border-white/10 transition-colors backdrop-blur-md shadow-lg outline-none"
          >
            ⏩ Bỏ qua Đoạn quảng cáo
          </button>
        </div>
      </div>
    );
  }

  // Primary Backup: Use the embed URL (usually handles HLS internally via iframe)
  if (safeEmbed && !iframeError) {
    return (
      <iframe
        key={`embed-${playerKey}`}
        src={safeEmbed}
        className="absolute top-0 left-0 w-full h-full border-0"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media"
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        onError={() => setIframeError(true)}
      ></iframe>
    );
  }

  // Ultimate Fallback: Prominent button to open in new tab
  const directUrl = safeEmbed || (m3u8Url ? `https://player.phimapi.com/player/?url=${encodeURIComponent(m3u8Url)}` : '');

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-gray-900 to-black px-4">
      <div className="text-center">
        <div className="text-5xl mb-3">🎬</div>
        <p className="text-white text-lg font-semibold mb-1">Nhấn nút bên dưới để xem phim</p>
        <p className="text-gray-400 text-sm">Trình phát sẽ mở trong tab mới</p>
      </div>
      {directUrl ? (
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-base font-bold transition-all hover:scale-105 shadow-lg shadow-red-600/30 flex items-center gap-2"
        >
          ▶️ Xem Phim Ngay
        </a>
      ) : (
        <p className="text-red-400 text-sm">Không tìm thấy nguồn phát video cho tập phim này.</p>
      )}
    </div>
  );
}
