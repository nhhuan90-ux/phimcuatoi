import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw, Info, ExternalLink, Play } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';

const PHIM18_API = import.meta.env.VITE_PHIM18_API || '';
const SOURCE_NAMES: Record<string, string> = {
  javhdz: 'JAVHDz', vlxx: 'VLXX', javsub: 'JAVSub',
  javtiful: 'JavTiful', phimxyz: 'PhimXYZ', subjav: 'SubJAV'
};

const isFullWebpageUrl = (u?: string) => {
  if (!u) return false;
  // If URL is an entire website page rather than a dedicated video player iframe
  if (u.includes('vlstream.net') || u.includes('/embed/') || u.includes('/play/')) return false;
  return (
    (u.includes('/video/') && !u.includes('/videos/')) ||
    u.includes('/phim/') ||
    u.includes('.html') ||
    u.includes('vlxx.phd') ||
    u.includes('javhdz.') ||
    u.includes('subjav.') ||
    u.includes('phimxyz.')
  );
};


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


async function fetchStaticMovieDetail(source: string, id: string) {
  try {
    const filename = source === 'all' ? 'movies_all.json' : `movies_${source}.json`;
    const res = await fetch(`/data/${filename}?t=${Date.now()}`);
    if (res.ok) {
      const text = await res.text();
      if (text.startsWith('[') || text.startsWith('{')) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : (parsed[source] || parsed.all || []);
        const found = list.find((m: any) => m.id === id);
        if (found) return found;
      }
    }
  } catch (e) {}

  try {
    const ghUrl = `https://raw.githubusercontent.com/nhhuan90-ux/phimcuatoi/main/server/movies.json?t=${Date.now()}`;
    const ghRes = await fetch(ghUrl);
    if (ghRes.ok) {
      const ghData = await ghRes.json();
      const list = ghData[source] || ghData.all || [];
      const found = list.find((m: any) => m.id === id);
      if (found) return found;
    }
  } catch (e) {}

  return null;
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

  // Fetch movie details
  useEffect(() => {
    if (!source || !id) return;
    let isMounted = true;
    const fetchMovie = async () => {
      let data: any = null;
      const apiBase = PHIM18_API || '';
      try {
        const res = await fetch(`${apiBase}/api/movie/${source}/${encodeURIComponent(id)}`);
        if (res.ok) {
          const text = await res.text();
          if (text.startsWith('{')) data = JSON.parse(text);
        }
      } catch (e) {}

      if (!data) {
        data = await fetchStaticMovieDetail(source, id);
      }

      if (isMounted) {
        if (data) {
          setMovie(data);
          document.title = `${data.title || 'Xem Phim 18+'} - Phim 18+`;
        } else {
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
        let data: any = null;
        const apiBase = PHIM18_API || '';
        try {
          const needsServer = ['vlxx', 'javsub', 'subjav'].includes(source);
          const url = `${apiBase}/api/video/${source}/${encodeURIComponent(id)}${needsServer ? `?server=${activeServer}&` : '?'}_t=${Date.now()}`;
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            if (text.startsWith('{')) data = JSON.parse(text);
          }
        } catch (e) {}

        // Static fallback resolvers: only use clean embedded players, NEVER embed the full original webpage
        if (!data || (!data.videoUrl && !data.url)) {
          const detail = movie || await fetchStaticMovieDetail(source, id);
          if (source === 'javtiful') {
            const code = detail?.code || id;
            data = { url: `https://upload18.org/play/index/${code.toUpperCase()}`, type: 'iframe' };
          } else if (source === 'javsub' && detail?.embedUrls?.length) {
            const idx = Math.min(Math.max(0, activeServer - 1), detail.embedUrls.length - 1);
            const playUrl = detail.embedUrls[idx]?.url || detail.embedUrls[0].url;
            const vm = playUrl.match(/\/videos\/([a-f0-9]+)\//);
            if (vm) {
              data = { videoUrl: `https://vcast.name/videos/${vm[1]}/master.m3u8`, type: 'hls' };
            } else if (!isFullWebpageUrl(playUrl)) {
              data = { url: playUrl.replace(/&adTag=[^&]*/g, ''), type: 'iframe' };
            }
          }
        }

        if (isMounted) {
          if (data && (data.videoUrl || data.url)) {
            setVideoData(data);
          } else {
            setError(data?.error || 'Không lấy được link phát video. Video có thể đã bị gỡ hoặc máy chủ đang bận.');
          }
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
  }, [source, id, activeServer, movie]);

  if (!source || !id) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-16 text-center text-white">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-lg font-medium mb-4">Thiếu thông tin phim</p>
        <button onClick={() => navigate('/phim-18')} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Define server list based on source
  const getServers = () => {
    switch (source) {
      case 'vlxx':
        return [
          { id: 1, label: 'Server 1' },
          { id: 2, label: 'Server 2' }
        ];
      case 'javsub':
        return [
          { id: 1, label: 'Server 1 (StreamQQ)' },
          { id: 2, label: 'Server 2 (PlayHQ)' }
        ];
      case 'subjav':
        return [
          { id: 1, label: 'Server 1 (HLS)' },
          { id: 2, label: 'Server 2 (Dự phòng)' }
        ];
      default:
        return [{ id: 1, label: 'Server Chính' }];
    }
  };

  const servers = getServers();

  const m3u8Url = videoData?.type === 'hls' && videoData.videoUrl
    ? `${PHIM18_API}/api/proxy/hls?url=${encodeURIComponent(videoData.videoUrl)}`
    : undefined;
  const embedUrl = videoData?.url || undefined;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-4 sm:py-6 max-w-5xl">
      {/* Top Bar / Back button */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium py-1 px-2 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={18} />
          <span>Quay lại</span>
        </button>
      </div>

      {/* Video Player Container */}
      <div className="w-full mb-4">
        {loading ? (
          <div className="w-full aspect-video bg-black rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-medium">Đang nạp trình phát video...</p>
          </div>
        ) : (!m3u8Url && (!embedUrl || isFullWebpageUrl(embedUrl))) ? (
          /* Không nhúng trang gốc vào web: Hiển thị giao diện trực quan với nút Mở xem trực tiếp tại trang nguồn */
          <div className="w-full aspect-video bg-[#0f0f12] rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group shadow-2xl">
            {movie?.img && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-xl scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${movie.img})` }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mb-4 shadow-lg shadow-red-950/50">
                <ExternalLink size={28} />
              </div>
              <h3 className="text-white text-base sm:text-lg font-bold mb-2">
                Trình phát trực tiếp không khả dụng
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm mb-6 leading-relaxed">
                Máy chủ <span className="text-zinc-200 font-semibold">{SOURCE_NAMES[source] || source.toUpperCase()}</span> chặn tính năng phát nhúng để bảo vệ bản quyền. Bấm nút dưới đây để mở xem trực tiếp video tại trang gốc:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {movie?.link && (
                  <a
                    href={movie.link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-xl shadow-red-900/30 hover:scale-[1.03] flex items-center gap-2"
                  >
                    <span>Mở xem trực tiếp tại trang nguồn</span>
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => setActiveServer((prev) => prev)}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={14} /> Thử lại
                </button>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="w-full aspect-video bg-black rounded-xl border border-gray-800 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <p className="text-white text-sm sm:text-base font-semibold mb-2">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {movie?.link && (
                <a
                  href={movie.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all shadow inline-flex items-center gap-2"
                >
                  <span>Mở xem trực tiếp tại trang nguồn</span>
                  <ExternalLink size={14} />
                </a>
              )}
              <button
                onClick={() => setActiveServer((prev) => prev)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
              >
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          </div>
        ) : (
          <VideoPlayer
            m3u8Url={m3u8Url}
            embedUrl={embedUrl}
            title={movie?.title || 'Xem Phim 18+'}
            playerKey={activeServer}
          />
        )}
      </div>

      {/* Movie Details & Server Switcher */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-base sm:text-xl font-bold line-clamp-2">
              {movie?.title || 'Xem Phim 18+'}
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {source}
              </span>
              {movie?.views && <span>{movie.views} lượt xem</span>}
            </div>
          </div>

          {/* Server selector */}
          {servers.length > 1 && (
            <div className="flex items-center gap-2 bg-[#2b2b2b] p-1 rounded-lg">
              <span className="text-xs text-gray-400 font-medium px-2">Server:</span>
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

        {source === 'javtiful' && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded-lg flex items-start gap-2.5 text-xs text-red-200">
            <Info size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span>
              <strong>Mẹo nhỏ JavTiful:</strong> Nếu trình phát JavTiful báo lỗi &quot;Yêu cầu không chặn quảng cáo&quot;, vui lòng tạm thời tắt tiện ích chặn quảng cáo (AdBlock) trên trình duyệt của bạn để phát phim mượt mà.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
