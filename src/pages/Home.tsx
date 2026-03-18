import { useState, useEffect } from 'react';
import { fetchMovies } from '../services/api';
import MovieSection from '../components/MovieSection';
import HeroSlider from '../components/HeroSlider';
import GenreCarousel from '../components/GenreCarousel';

export default function Home() {
  const [newMovies, setNewMovies] = useState([]);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [cartoons, setCartoons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [newRes, moviesRes, seriesRes, cartoonRes] = await Promise.all([
          fetchMovies('/films/phim-moi-cap-nhat', 1),
          fetchMovies('/films/danh-sach/phim-le', 1),
          fetchMovies('/films/danh-sach/phim-bo', 1),
          fetchMovies('/films/danh-sach/hoat-hinh', 1),
        ]);

        setNewMovies(newRes.items || []);
        setMovies(moviesRes.items || []);
        setSeries(seriesRes.items || []);
        setCartoons(cartoonRes.items || []);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {newMovies.length > 0 && <HeroSlider movies={newMovies.slice(0, 10)} />}
      
      <div className="container mx-auto px-4 lg:px-8 mt-8 space-y-4">
        <GenreCarousel />
        
        <MovieSection
          title="Phim Mới Cập Nhật"
          movies={newMovies.slice(0, 12)}
          viewAllLink="/danh-sach/phim-moi-cap-nhat"
        />
        <MovieSection
          title="Phim Lẻ Mới"
          movies={movies.slice(0, 12)}
          viewAllLink="/danh-sach/phim-le"
        />
        <MovieSection
          title="Phim Bộ Mới"
          movies={series.slice(0, 12)}
          viewAllLink="/danh-sach/phim-bo"
        />
        <MovieSection
          title="Hoạt Hình"
          movies={cartoons.slice(0, 12)}
          viewAllLink="/danh-sach/hoat-hinh"
        />
      </div>
    </div>
  );
}
