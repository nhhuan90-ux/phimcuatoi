import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchMovieDetail, searchMovies, getBaseName, normalizeName } from '../services/api';
import { Play, Calendar, Clock, Globe, Film, RotateCcw } from 'lucide-react';
import { getHistoryItem } from '../utils/history';
import MovieCard from '../components/MovieCard';

export default function MovieDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historyEp, setHistoryEp] = useState<any>(null);
  const [relatedSeasons, setRelatedSeasons] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetchMovieDetail(slug);
        setMovie(res.movie);
        
        // Find related seasons using base name
        const searchKeyword = getBaseName(res.movie.name) || getBaseName(res.movie.original_name);
        if (searchKeyword) {
          const searchRes = await searchMovies(searchKeyword);
          const baseNormName = normalizeName(searchKeyword);
          const seasons = searchRes.items.filter((item: any) => 
            item.slug !== res.movie.slug && 
            (normalizeName(getBaseName(item.name)) === baseNormName || normalizeName(getBaseName(item.original_name)) === baseNormName)
          );
          setRelatedSeasons(seasons);
        } else {
          setRelatedSeasons([]);
        }

      } catch (error) {
        console.error('Failed to fetch movie detail:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkHistory = () => {
      if (slug) {
        const item = getHistoryItem(slug);
        if (item) setHistoryEp(item);
      }
    };

    loadData();
    checkHistory();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy phim</h1>
        <button onClick={() => navigate('/')} className="text-red-500 hover:underline">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const firstEpisode = movie.episodes?.[0]?.items?.[0];

  const genres = movie ? (Array.isArray(movie.category) 
    ? movie.category 
    : (Array.isArray(movie.category?.[2]?.list) ? movie.category[2].list : [])) : [];

  const countries = movie ? (Array.isArray(movie.country) 
    ? movie.country 
    : (Array.isArray(movie.category?.[4]?.list) ? movie.category[4].list : [])) : [];

  const releaseYear = movie ? (movie.year || (Array.isArray(movie.category?.[3]?.list) ? movie.category[3].list[0]?.name : null) || 'Đang cập nhật') : 'Đang cập nhật';

  return (
    <div className="pb-12">
      {/* Backdrop */}
      <div className="relative w-full h-[50vh] md:h-[70vh] bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-10" />
        <img
          src={movie.poster_url || movie.thumb_url}
          alt={movie.name}
          className="w-full h-full object-cover opacity-40 blur-sm"
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-20 -mt-[30vh] md:-mt-[40vh]">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-48 md:w-72 flex-shrink-0 mx-auto md:mx-0">
            <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 aspect-[2/3] relative group">
              <img
                src={movie.thumb_url || movie.poster_url}
                alt={movie.name}
                className="w-full h-full object-cover"
              />
              {firstEpisode && (
                <Link
                  to={`/xem-phim/${movie.slug}/${firstEpisode.slug}?id=0`}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <div className="bg-red-600 rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Play fill="currentColor" className="text-white w-8 h-8 ml-1" />
                  </div>
                </Link>
              )}
            </div>
              {firstEpisode && !historyEp && (
                <Link
                  to={`/xem-phim/${movie.slug}/${firstEpisode.slug}?id=0`}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
                >
                  <Play fill="currentColor" size={20} />
                  XEM PHIM
                </Link>
              )}
              {historyEp && (
                 <Link
                 to={`/xem-phim/${movie.slug}/${historyEp.epSlug}?id=0`}
                 className="mt-4 w-full bg-[#1a1a1a] border border-red-600 hover:bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
               >
                 <RotateCcw size={20} />
                 TIẾP TỤC: TẬP {historyEp.epName}
               </Link>
              )}
            </div>

          {/* Info */}
          <div className="flex-grow text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-2">{movie.name}</h1>
            <h2 className="text-xl text-gray-400 mb-6 font-medium">{movie.original_name}</h2>

            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm">
              {movie.quality && (
                <span className="bg-red-600 text-white px-3 py-1 rounded font-bold uppercase tracking-wider">
                  {movie.quality}
                </span>
              )}
              {movie.current_episode && (
                <span className="bg-[#2b2b2b] text-red-500 border border-red-500/30 px-3 py-1 rounded font-bold uppercase">
                  {movie.current_episode}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <span className="text-gray-400 block mb-1">Năm phát hành</span>
                  <span className="font-medium">{releaseYear}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <span className="text-gray-400 block mb-1">Thời lượng</span>
                  <span className="font-medium">{movie.time || 'Đang cập nhật'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <span className="text-gray-400 block mb-1">Quốc gia</span>
                  <span className="font-medium">{countries.map((c: any) => c.name).join(', ') || 'Đang cập nhật'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Film className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <span className="text-gray-400 block mb-1">Thể loại</span>
                  <div className="flex flex-wrap gap-1">
                    {genres.length > 0 ? (
                      genres.map((g: any) => (
                        <Link key={g.id || g.slug} to={`/the-loai/${g.slug}`} className="text-red-500 hover:underline">
                          {g.name}
                        </Link>
                      )).reduce((prev: any, curr: any) => [prev, ', ', curr])
                    ) : 'Đang cập nhật'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3 border-l-4 border-red-600 pl-3">Nội dung phim</h3>
              <div 
                className="text-gray-300 leading-relaxed text-sm md:text-base"
                dangerouslySetInnerHTML={{ __html: movie.description || 'Đang cập nhật nội dung...' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold mb-3 border-l-4 border-red-600 pl-3">Đạo diễn</h3>
                <p className="text-gray-300">{movie.director || 'Đang cập nhật'}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3 border-l-4 border-red-600 pl-3">Diễn viên</h3>
                <p className="text-gray-300">{movie.casts || 'Đang cập nhật'}</p>
              </div>
            </div>

            {/* Episodes List */}
            {movie.episodes && movie.episodes.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold mb-4 border-l-4 border-red-600 pl-3">Danh sách tập</h3>
                {movie.episodes.map((server: any, idx: number) => (
                  <div key={idx} className="mb-6">
                    <h4 className="text-gray-400 mb-3 text-sm font-medium">{server.server_name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {server.items.map((ep: any, epIdx: number) => (
                        <Link
                          key={`${idx}-${ep.slug}-${epIdx}`}
                          to={`/xem-phim/${movie.slug}/${ep.slug}?id=${idx}`}
                          className="bg-[#2b2b2b] hover:bg-red-600 text-gray-300 hover:text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                          {ep.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Related Seasons list */}
            {relatedSeasons.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold mb-4 border-l-4 border-red-600 pl-3">Các phần khác</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {relatedSeasons.map((item) => (
                    <MovieCard key={item.slug} movie={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
