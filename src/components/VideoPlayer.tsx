import { useState } from 'react';

interface VideoPlayerProps {
  m3u8Url?: string;
  embedUrl?: string;
  title: string;
  playerKey: number;
}

export default function VideoPlayer({ m3u8Url, embedUrl, title, playerKey }: VideoPlayerProps) {
  const [iframeError, setIframeError] = useState(false);

  const safeEmbed = embedUrl?.replace(/^http:\/\//i, 'https://');

  // Primary: Use the embed URL (player.phimapi.com handles HLS internally)
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

  // Fallback: Prominent button to open in new tab
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
