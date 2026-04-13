import { useState, useEffect } from 'react';
import { fetchMovies } from '../services/api';
import MovieSection from '../components/MovieSection';
import HeroSlider from '../components/HeroSlider';
import GenreCarousel from '../components/GenreCarousel';
import { Link } from 'react-router-dom';
import { Clock, Play } from 'lucide-react';
import { getHistory, WatchHistoryItem } from '../utils/history';

const HistoryRow = () => {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory().slice(0, 6)); // Show latest 6
  }, []);

  if (history.length === 0) return null;

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section className="py-2">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-xl md:text-2xl font-bold text-white border-l-4 border-red-600 pl-3 flex items-center gap-2">
          <Clock className="text-red-500" size={24} />
          Tiếp tục xem
        </h2>
        <Link to="/lich-su" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Xem tất cả
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {history.map((item) => (
          <Link 
            key={item.movieSlug} 
            to={`/xem-phim/${item.movieSlug}/${item.epSlug}?id=0`}
            className="group block relative rounded-xl overflow-hidden bg-[#141414] border border-gray-800 hover:border-red-500/50 transition-colors"
          >
            <div className="aspect-[2/3] relative overflow-hidden">
              <img 
                src={item.posterUrl} 
                alt={item.movieName} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-red-600/90 rounded-full p-4 mb-2 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-red-600/40">
                  <Play fill="currentColor" className="text-white w-8 h-8 ml-1" />
                </div>
                <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                  Tập {item.epName}
                </span>
              </div>
              
              <div className="absolute bottom-2 left-2 right-2">
                {item.duration > 0 && item.timePlayed > 0 && (
                  <div className="w-full bg-gray-600 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (item.timePlayed / item.duration) * 100)}%` }}></div>
                  </div>
                )}
                {item.timePlayed > 0 && (
                   <div className="text-[10px] sm:text-[11px] text-center text-gray-300 bg-black/60 py-0.5 rounded backdrop-blur-sm truncate">
                      Đang xem: {formatTime(item.timePlayed)}
                   </div>
                )}
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-red-500 transition-colors">
                {item.movieName}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const MovieSectionWithFetch = ({ title, endpoint, viewAllLink }: { title: string; endpoint: string; viewAllLink?: string }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchMovies(endpoint, 1);
        setMovies(res.items || []);
      } catch (error) {
        console.error(`Failed to fetch ${title}:`, error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [endpoint, title]);

  if (loading) {
    return (
      <section className="py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-4 w-20 bg-gray-800 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  return <MovieSection title={title} movies={movies.slice(0, 12)} viewAllLink={viewAllLink} />;
};

export default function Home() {
  const [heroMovies, setHeroMovies] = useState([]);

  useEffect(() => {
    const loadHero = async () => {
      try {
        const res = await fetchMovies('/films/phim-moi-cap-nhat', 1);
        setHeroMovies(res.items || []);
      } catch (error) {
        console.error('Failed to fetch hero movies:', error);
      }
    };
    loadHero();
  }, []);

  return (
    <div className="pb-12">
      {heroMovies.length > 0 ? (
        <HeroSlider movies={heroMovies.slice(0, 10)} />
      ) : (
        <div className="w-full h-[50vh] md:h-[70vh] bg-gray-900 animate-pulse"></div>
      )}
      
      <div className="container mx-auto px-4 lg:px-8 mt-8 space-y-4">
        <GenreCarousel />
        
        <HistoryRow />
        
        <MovieSectionWithFetch
          title="Phim Mới Cập Nhật"
          endpoint="/films/phim-moi-cap-nhat"
          viewAllLink="/danh-sach/phim-moi-cap-nhat"
        />

        <MovieSectionWithFetch
          title="Phim Hot / Phim Chiếu Rạp"
          endpoint="/films/danh-sach/phim-chieu-rap"
          viewAllLink="/danh-sach/phim-chieu-rap"
        />

        <MovieSectionWithFetch
          title="Phim Lẻ Mới"
          endpoint="/films/danh-sach/phim-le"
          viewAllLink="/danh-sach/phim-le"
        />

        <MovieSectionWithFetch
          title="Phim Bộ Mới"
          endpoint="/films/danh-sach/phim-bo"
          viewAllLink="/danh-sach/phim-bo"
        />

        <MovieSectionWithFetch
          title="Hoạt Hình"
          endpoint="/films/danh-sach/hoat-hinh"
          viewAllLink="/danh-sach/hoat-hinh"
        />

        <MovieSectionWithFetch
          title="Phim 18+"
          endpoint="/films/the-loai/phim-18"
          viewAllLink="/the-loai/phim-18"
        />
      </div>
    </div>
  );
}
