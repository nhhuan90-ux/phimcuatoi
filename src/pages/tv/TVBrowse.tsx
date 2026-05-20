import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchMovies } from '../../services/api';
import TVMovieCard from '../../components/tv/TVMovieCard';
import TVFocusable from '../../components/tv/TVFocusable';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLUG_TITLES: Record<string, string> = {
  'phim-le': 'Phim Lẻ',
  'phim-bo': 'Phim Bộ',
  'phim-chieu-rap': 'Phim Hot / Phim Chiếu Rạp',
  'hoat-hinh': 'Hoạt Hình',
  'tv-shows': 'TV Shows',
  'phim-moi-cap-nhat': 'Phim Mới Cập Nhật',
};

export default function TVBrowse({ type = 'danh-sach' }: { type?: string }) {
  const { slug, year } = useParams();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const actualSlug = slug || year || 'phim-moi-cap-nhat';
  const title = SLUG_TITLES[actualSlug] || actualSlug;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        if (type === 'nam-phat-hanh') endpoint = `/films/nam-phat-hanh/${actualSlug}`;
        else endpoint = `/films/${type}/${actualSlug}`;

        const res = await fetchMovies(endpoint, page);
        setMovies(res.items || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || res.pagination.total_page || 1);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
    window.scrollTo(0, 0);
  }, [actualSlug, type, page]);

  return (
    <div style={{ padding: '100px var(--tv-safe-padding) 48px' }} className="tv-fade-in">
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 32, borderLeft: '4px solid #dc2626', paddingLeft: 16 }}>
        {title}
      </h1>

      {loading ? (
        <div className="tv-movie-grid">
          {[...Array(18)].map((_, i) => (
            <div key={i} style={{ background: '#1a1a1a', borderRadius: 12, aspectRatio: '2/3.5', animation: 'tv-fade-in 0.5s ease' }} />
          ))}
        </div>
      ) : (
        <>
          <div className="tv-movie-grid">
            {movies.map((movie, idx) => (
              <TVMovieCard key={movie.slug} movie={movie} index={idx} />
            ))}
          </div>

          {movies.length === 0 && (
            <div style={{ textAlign: 'center', padding: 64, color: '#888', fontSize: 20 }}>
              Không tìm thấy phim nào.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40, alignItems: 'center' }}>
              {page > 1 && (
                <TVFocusable onPress={() => setPage(p => p - 1)} className="tv-btn tv-btn-secondary" focusClassName="tv-btn-focus">
                  <ChevronLeft size={20} /> Trang trước
                </TVFocusable>
              )}
              <span style={{ color: '#888', fontSize: 18, padding: '0 16px' }}>
                Trang {page} / {totalPages}
              </span>
              {page < totalPages && (
                <TVFocusable onPress={() => setPage(p => p + 1)} className="tv-btn tv-btn-secondary" focusClassName="tv-btn-focus">
                  Trang sau <ChevronRight size={20} />
                </TVFocusable>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
