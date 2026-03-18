import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchMovieDetail } from '../services/api';

export default function Watch() {
  const { slug, episode } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<any>(null);
  const [currentEpData, setCurrentEpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetchMovieDetail(slug);
        setMovie(res.movie);
        
        // Find current episode
        let found = false;
        if (res.movie.episodes) {
          for (const server of res.movie.episodes) {
            const ep = server.items.find((item: any) => item.slug === episode);
            if (ep) {
              setCurrentEpData(ep);
              found = true;
              break;
            }
          }
        }
        
        if (!found && res.movie.episodes?.[0]?.items?.[0]) {
          // Fallback to first episode if not found
          navigate(`/xem-phim/${slug}/${res.movie.episodes[0].items[0].slug}`, { replace: true });
        }
      } catch (error) {
        console.error('Failed to fetch movie detail:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.scrollTo(0, 0);
  }, [slug, episode, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!movie || !currentEpData) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy tập phim</h1>
        <button onClick={() => navigate('/')} className="text-red-500 hover:underline">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
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
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50 mb-4 relative">
          {currentEpData.embed ? (
            <iframe
              src={currentEpData.embed.replace(/^http:\/\//i, 'https://')}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={`Watch ${movie.name} Episode ${currentEpData.name}`}
            ></iframe>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-400">
              Không tìm thấy link phát video.
            </div>
          )}
        </div>
        
        <div className="flex justify-end mb-6">
          {currentEpData.embed && (
            <a 
              href={currentEpData.embed.replace(/^http:\/\//i, 'https://')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Lỗi khởi tạo player? Nhấn vào đây để xem
            </a>
          )}
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

        {/* Episode List */}
        {movie.episodes && movie.episodes.length > 0 && (
          <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
            <h3 className="text-xl font-bold mb-6 text-white border-l-4 border-red-600 pl-3">Chọn tập phim</h3>
            {movie.episodes.map((server: any, idx: number) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h4 className="text-gray-400 mb-3 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  {server.server_name}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                  {server.items.map((ep: any) => {
                    const isActive = ep.slug === episode;
                    return (
                      <Link
                        key={ep.slug}
                        to={`/xem-phim/${movie.slug}/${ep.slug}`}
                        className={`text-center py-2 rounded text-sm font-medium transition-colors ${
                          isActive
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
