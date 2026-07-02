import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMovieDetail } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import { getHistoryItem, saveHistoryItem } from '../utils/history';
import { Moon, Sun } from 'lucide-react';

export default function Watch() {
  const { slug, episode } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [movie, setMovie] = useState<any>(null);
  const [currentEpData, setCurrentEpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [useEmbed, setUseEmbed] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const lastSavedTime = useRef(0);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;
      setLoading(true);
      setErrorInfo(null);
      try {
        const res = await fetchMovieDetail(slug);
        if (!res || !res.movie) {
          setErrorInfo('API trả về dữ liệu không hợp lệ hoặc không có thông tin phim.');
          setLoading(false);
          return;
        }

        setMovie(res.movie);

        // Find current episode
        let found = false;
        const serverIdStr = searchParams.get('id');
        const defaultServerIdx = serverIdStr ? parseInt(serverIdStr, 10) : -1;

        if (res.movie.episodes && Array.isArray(res.movie.episodes)) {
          // If a specific server index is requested, try to find the episode there first
          if (defaultServerIdx >= 0 && defaultServerIdx < res.movie.episodes.length) {
            const server = res.movie.episodes[defaultServerIdx];
            if (server.items && Array.isArray(server.items)) {
              const ep = server.items.find((item: any) => item.slug === episode);
              if (ep) {
                setCurrentEpData({ ...ep, currentServerIdx: defaultServerIdx });
                found = true;
              }
            }
          }

          // Fallback to searching all servers if not found above
          if (!found) {
            for (let i = 0; i < res.movie.episodes.length; i++) {
              const server = res.movie.episodes[i];
              if (server.items && Array.isArray(server.items)) {
                const ep = server.items.find((item: any) => item.slug === episode);
                if (ep) {
                  setCurrentEpData({ ...ep, currentServerIdx: i });
                  found = true;
                  break;
                }
              }
            }
          }
        }

        if (!found) {
          const firstServerWithItems = res.movie.episodes?.find((s: any) => s.items && s.items.length > 0);
          if (firstServerWithItems && firstServerWithItems.items[0]) {
            // Fallback to first episode if not found
            navigate(`/xem-phim/${slug}/${firstServerWithItems.items[0].slug}?id=0`, { replace: true });
          } else {
            setErrorInfo(`Không tìm thấy danh sách tập phim cho phim này. \n(Debug: Source=${res.movie._source}, Servers=${res.movie.episodes?.length}, FirstServerItems=${res.movie.episodes?.[0]?.items?.length})`);
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch movie detail:', error);
        setErrorInfo(`Lỗi kết nối API: ${error.message || 'Không xác định'}`);
      } finally {
        setLoading(false);
      }
    };

    const loadHistory = () => {
      if (slug && episode) {
        const historyItem = getHistoryItem(slug);
        if (historyItem && historyItem.epSlug === episode && historyItem.timePlayed > 5) {
          setInitialTime(historyItem.timePlayed);
        } else {
          setInitialTime(0);
        }
      }
    };

    loadData();
    loadHistory();
    window.scrollTo(0, 0);
  }, [slug, episode, navigate, searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightsOff) {
        setIsLightsOff(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightsOff]);

  const toggleLights = () => {
    setIsLightsOff(!isLightsOff);
    if (!isLightsOff) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    // Only save if time has advanced enough (e.g., every 5 seconds) to avoid spamming localStorage
    if (Math.abs(currentTime - lastSavedTime.current) > 5 && movie && currentEpData) {
      saveHistoryItem({
        movieSlug: movie.slug,
        movieName: movie.name,
        posterUrl: movie.thumb_url || movie.poster_url,
        epSlug: currentEpData.slug,
        epName: currentEpData.name,
        timePlayed: currentTime,
        duration: duration,
        updatedAt: Date.now(),
      });
      lastSavedTime.current = currentTime;
    }
  }, [movie, currentEpData]);

  // Save history on initial load even if iframe (where time updating might fail)
  useEffect(() => {
    if (movie && currentEpData) {
       saveHistoryItem({
        movieSlug: movie.slug,
        movieName: movie.name,
        posterUrl: movie.thumb_url || movie.poster_url,
        epSlug: currentEpData.slug,
        epName: currentEpData.name,
        timePlayed: initialTime, 
        duration: 0,
        updatedAt: Date.now(),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpData]);

  const reloadPlayer = () => {
    setPlayerKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Đang tải phim...</p>
      </div>
    );
  }

  if (errorInfo || !movie || !currentEpData) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        <div className="bg-red-600/10 border border-red-600/20 p-6 rounded-lg max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Ối! Có lỗi xảy ra</h1>
          <p className="text-gray-300 mb-6">{errorInfo || 'Không tìm thấy tập phim yêu cầu.'}</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-medium transition-colors">
              Thử lại
            </button>
            <button onClick={() => navigate('/')} className="bg-[#2b2b2b] hover:bg-gray-700 px-6 py-2 rounded font-medium transition-colors">
              Quay lại trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen relative">
      {/* Lights Off Overlay */}
      {isLightsOff && (
        <div 
          className="fixed inset-0 bg-black/95 z-[60] transition-opacity duration-500 cursor-pointer"
          onClick={() => setIsLightsOff(false)}
        />
      )}

      <div className="container mx-auto px-4 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link to="/" className="hover:text-white transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to={`/phim/${movie.slug}`} className="hover:text-white transition-colors">{movie.name}</Link>
          <span>/</span>
          <span className="text-red-500">Tập {currentEpData.name}</span>
        </div>

        {/* Player */}
        <div 
          className={`w-full bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50 mb-4 transition-all duration-500 ${
            isLightsOff ? 'z-[70] ring-4 ring-red-600/20' : ''
          }`} 
        >
          <VideoPlayer
            m3u8Url={currentEpData.m3u8}
            embedUrl={currentEpData.embed}
            title={movie.name}
            playerKey={playerKey}
            initialTime={initialTime}
            onTimeUpdate={handleTimeUpdate}
            forceEmbed={useEmbed}
          />
        </div>

        {/* Server Selection */}
        {movie.episodes && movie.episodes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#141414] p-4 rounded-lg border border-gray-800">
            <span className="text-gray-400 text-sm font-medium mr-2">Đổi máy chủ:</span>
            {movie.episodes.map((server: any, idx: number) => {
              const isSelectedServer = currentEpData?.currentServerIdx === idx;
              // Find matching episode in this server, or fallback to first episode
              const epInServer = server.items.find((item: any) => item.slug === episode) || server.items[0];

              let serverDisplayName = server.server_name;
              if (idx === 0) serverDisplayName = `Server 1 (${server.server_name})`;
              else if (idx === 1) serverDisplayName = `Server 2 (${server.server_name})`;
              else if (idx === 2) serverDisplayName = `Server 3 (${server.server_name})`;

              return (
                <Link
                  key={idx}
                  to={`/xem-phim/${movie.slug}/${epInServer.slug}?id=${idx}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSelectedServer
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'bg-[#2b2b2b] text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  {serverDisplayName}
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={reloadPlayer}
              className="px-4 py-2 bg-[#2b2b2b] hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>🔄</span> Tải lại player
            </button>
            <button
              onClick={() => setUseEmbed(prev => !prev)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                useEmbed ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#2b2b2b] hover:bg-gray-700 text-white'
              }`}
            >
              <span>📺</span> {useEmbed ? 'Dùng Trình phát HLS' : 'Dùng Trình phát Dự phòng'}
            </button>
            <button
              onClick={toggleLights}
              className={`px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2 ${
                isLightsOff 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black z-[70] relative' 
                : 'bg-[#2b2b2b] hover:bg-gray-700 text-white'
              }`}
            >
              {isLightsOff ? <Sun size={16} /> : <Moon size={16} />}
              {isLightsOff ? 'Bật đèn' : 'Tắt đèn'}
            </button>
            {currentEpData.embed && (
              <a
                href={currentEpData.embed.replace(/^http:\/\//i, 'https://')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>🔗</span> Mở link embed
              </a>
            )}
          </div>
          <p className="text-xs text-gray-500 italic">
            * Nhấn "Tải lại player" nếu video không phát được, hoặc thử đổi máy chủ bằng nút bên trên.
          </p>
        </div>

        {/* Movie Info */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 bg-[#141414] p-6 rounded-lg border border-gray-800">
          <div className="flex-grow">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {movie.name} - Tập {currentEpData.name}
            </h1>
            <h2 className="text-lg text-gray-400 mb-4">{movie.original_name}</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="bg-red-600/20 text-red-500 px-3 py-1 rounded font-medium">
                {movie.quality}
              </span>
              <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded font-medium">
                {movie.language}
              </span>
            </div>
          </div>
          <div className="md:text-right">
            <Link
              to={`/phim/${movie.slug}`}
              className="inline-block bg-[#2b2b2b] hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Thông tin phim
            </Link>
          </div>
        </div>

        {/* Episode List (Only for selected server) */}
        {movie.episodes && movie.episodes.length > 0 && currentEpData && (
          <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
            <h3 className="text-xl font-bold mb-6 text-white border-l-4 border-red-600 pl-3">
              Danh sách tập - {movie.episodes?.[currentEpData?.currentServerIdx]?.server_name}
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
              {movie.episodes?.[currentEpData?.currentServerIdx]?.items?.map((ep: any, epIdx: number) => {
                const isActive = ep.slug === episode;
                return (
                  <Link
                    key={`${ep.slug}-${epIdx}`}
                    to={`/xem-phim/${movie.slug}/${ep.slug}?id=${currentEpData.currentServerIdx}`}
                    className={`text-center py-2 rounded text-sm font-medium transition-colors ${isActive
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                        : 'bg-[#2b2b2b] text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    {ep.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
