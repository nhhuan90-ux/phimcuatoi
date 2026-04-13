import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMovies } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function Search() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!keyword) {
        setMovies([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const res = await searchMovies(keyword);
        setMovies(res.items || []);
      } catch (error) {
        console.error('Failed to search movies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.scrollTo(0, 0);
  }, [keyword]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 border-l-4 border-red-600 pl-3">
        Kết quả tìm kiếm cho: <span className="text-red-500">"{keyword}"</span>
      </h1>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {movies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {movies.map((movie: any) => (
                <MovieCard key={movie.slug} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-20">
              Không tìm thấy phim nào phù hợp với từ khóa "{keyword}".
            </div>
          )}
        </>
      )}
    </div>
  );
}
