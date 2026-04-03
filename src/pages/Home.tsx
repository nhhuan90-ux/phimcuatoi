import { useState, useEffect } from 'react';
import { fetchMovies } from '../services/api';
import MovieSection from '../components/MovieSection';
import HeroSlider from '../components/HeroSlider';
import GenreCarousel from '../components/GenreCarousel';

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
        
        <MovieSectionWithFetch
          title="Phim Mới Cập Nhật"
          endpoint="/films/phim-moi-cap-nhat"
          viewAllLink="/danh-sach/phim-moi-cap-nhat"
        />

        <MovieSectionWithFetch
          title="Phim Hành Động"
          endpoint="/films/the-loai/hanh-dong"
          viewAllLink="/the-loai/hanh-dong"
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
