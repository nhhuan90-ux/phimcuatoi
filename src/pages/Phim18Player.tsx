import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Play, AlertCircle, RefreshCw } from 'lucide-react';

const PHIM18_API = import.meta.env.VITE_PHIM18_API || '';

interface MovieData {
  id: string;
  title: string;
  source: string;
  tag?: string;
  views?: string;
  embedUrls?: { url: string; label?: string }[];
}

interface VideoPayload {
  videoUrl?: string;
  url?: string;
  type?: 'hls' | 'iframe';
  error?: string;
}

export default function Phim18Player() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const source = searchParams.get('source') || '';
  const id = searchParams.get('id') || '';

  const [movie, setMovie] = useState<MovieData | null>(null);
  const [videoData, setVideoData] = useState<VideoPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeServer, setActiveServer] = useState(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch movie details
  useEffect(() => {
    if (!source || !id) return;
    let isMounted = true;
    const fetchMovie = async () => {
      try {
        const res = await fetch(`${PHIM18_API}/api/movie/${source}/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (isMounted) {
          setMovie(data);
          document.title = `${data.title} - Phim 18+`;
        }
      } catch (e) {
        if (isMounted) {
          setMovie({ id, title: 'Xem Phim 18+', source });
        }
      }
    };
    fetchMovie();
    return () => { isMounted = false; };
  }, [source, id]);

  // Fetch video stream payload for activeServer
  useEffect(() => {
    if (!source || !id) return;
    let isMounted = true;
    const fetchVideoPayload = async () => {
      setLoading(true);
      setError(null);
      try {
        const needsServer = ['vlxx', 'javsub', 'supjav'].includes(source);
        const url = `${PHIM18_API}/api/video/${source}/${encodeURIComponent(id)}${needsServer ? `?server=${activeServer}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Video resolve failed');
        const data = await res.json();
        if (isMounted) {
          setVideoData(data);
        }
      } catch (e: any) {
        if (isMounted) {
          setError('Không lấy được link phát video. Video có thể đã bị gỡ hoặc máy chủ đang bận.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchVideoPayload();
    return () => { isMounted = false; };
  }, [source, id, activeServer]);

  // Setup HLS.js if type === 'hls'
  useEffect(() => {
    if (!videoData || videoData.type !== 'hls' || !videoData.videoUrl || !videoRef.current) return;

    let hlsInstance: any = null;
    const videoEl = videoRef.current;
    const proxyUrl = `${PHIM18_API}/api/proxy/hls?url=${encodeURIComponent(videoData.videoUrl)}`;

    const loadHls = async () => {
      try {
        const HlsModule = await import('hls.js');
        const Hls = HlsModule.default;
        if (Hls.isSupported()) {
          hlsInstance = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 30 * 1024 * 1024
          });
          hlsInstance.loadSource(proxyUrl);
          hlsInstance.attachMedia(videoEl);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            videoEl.play().catch(() => {});
          });
        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
          videoEl.src = proxyUrl;
          videoEl.play().catch(() => {});
        }
      } catch (e) {
        // Fallback for native HLS
        if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
          videoEl.src = proxyUrl;
          videoEl.play().catch(() => {});
        }
      }
    };

    loadHls();

    return () => {
      if (hlsInstance) hlsInstance.destroy();
    };
  }, [videoData]);

  if (!source || !id) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center text-white p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-lg font-medium mb-4">Thiếu thông tin phim</p>
          <button onClick={() => navigate('/phim-18')} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const servers = movie?.embedUrls?.length
    ? movie.embedUrls.map((s, idx) => ({ id: idx + 1, label: s.label || `Server #${idx + 1}` }))
    : [{ id: 1, label: 'Server chính' }];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col select-none">
      {/* Header bar */}
      <div className="bg-[#141414] border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Quay lại</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-white text-sm sm:text-base font-bold truncate">
              {movie?.title || 'Xem Phim 18+'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span className="bg-red-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                {source}
              </span>
              {movie?.views && <span>• {movie.views} lượt xem</span>}
            </div>
          </div>
        </div>

        {/* Server selector */}
        {servers.length > 1 && (
          <div className="flex items-center gap-2 bg-[#222] p-1 rounded-lg">
            {servers.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveServer(s.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeServer === s.id
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main player area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Đang khởi tạo trình phát video...</p>
          </div>
        ) : error ? (
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-white text-base font-semibold mb-2">{error}</p>
            <p className="text-gray-400 text-xs mb-6">Bạn có thể thử chọn Server khác hoặc bấm Thử lại.</p>
            <button
              onClick={() => setActiveServer((prev) => prev)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <RefreshCw size={16} /> Thử lại
            </button>
          </div>
        ) : videoData?.type === 'hls' && videoData.videoUrl ? (
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            className="w-full h-full max-h-[85vh] object-contain bg-black"
          />
        ) : videoData?.url ? (
          <iframe
            src={videoData.url}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full h-full border-0 bg-black"
          />
        ) : (
          <div className="text-gray-500 text-sm">Không tìm thấy nguồn phát thích hợp</div>
        )}
      </div>
    </div>
  );
}
