import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchMovies } from '../services/api';
import MovieCard from '../components/MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Browse({ type }: { type: string }) {
  const { slug, year } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        if (type === 'danh-sach') {
          endpoint = slug === 'phim-moi-cap-nhat' ? '/films/phim-moi-cap-nhat' : `/films/danh-sach/${slug}`;
        } else if (type === 'the-loai') {
          endpoint = `/films/the-loai/${slug}`;
        } else if (type === 'quoc-gia') {
          endpoint = `/films/quoc-gia/${slug}`;
        } else if (type === 'nam-phat-hanh') {
          endpoint = `/films/nam-phat-hanh/${year}`;
        }

        const res = await fetchMovies(endpoint, page);
        
        // Remove duplicates (phimapi sometimes returns duplicate movies in lists)
        const uniqueMovies = Array.from(new Map((res.items || []).map((m: any) => [m.slug, m])).values());
        setMovies(uniqueMovies as any);
        
        // phimapi and our normalization returns pagination
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || res.pagination.totalItems / res.pagination.totalItemsPerPage || 1);
        }
        
        // Set title based on slug or year
        if (slug) {
          setTitle(slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        } else if (year) {
          setTitle(`Năm ${year}`);
        }
      } catch (error) {
        console.error('Failed to fetch browse data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.scrollTo(0, 0);
  }, [type, slug, year, page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ page: newPage.toString() });
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 border-l-4 border-red-600 pl-3">
        {title}
      </h1>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
              {movies.map((movie: any) => (
                <MovieCard key={movie.slug} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-20">
              Không tìm thấy phim nào.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded bg-[#2b2b2b] text-white disabled:opacity-50 hover:bg-red-600 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-red-600 text-white'
                          : 'bg-[#2b2b2b] text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded bg-[#2b2b2b] text-white disabled:opacity-50 hover:bg-red-600 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
