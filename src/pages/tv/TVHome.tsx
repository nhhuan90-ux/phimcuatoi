import { useState, useEffect } from 'react';
import { fetchMovies } from '../../services/api';
import TVHero from '../../components/tv/TVHero';
import TVMovieRow from '../../components/tv/TVMovieRow';
import TVFocusable from '../../components/tv/TVFocusable';
import { Link } from 'react-router-dom';
import { Clock, Play } from 'lucide-react';
import { getHistory, WatchHistoryItem } from '../../utils/history';

const TVHistoryRow = () => {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  useEffect(() => { setHistory(getHistory().slice(0, 8)); }, []);
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
    <div className="tv-movie-row">
      <h2 className="tv-movie-row-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Clock size={24} style={{ color: '#dc2626' }} />
        Tiếp tục xem
      </h2>
      <div className="tv-movie-row-scroll">
        {history.map((item) => (
          <TVFocusable
            key={item.movieSlug}
            link={`/tv/xem-phim/${item.movieSlug}/${item.epSlug}?id=0`}
            className="tv-movie-card"
            focusClassName="tv-card-focus"
            style={{ width: 200 }}
          >
            <div style={{ position: 'relative' }}>
              <img src={item.posterUrl} alt={item.movieName} className="poster" />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                padding: '32px 10px 10px'
              }}>
                {item.duration > 0 && item.timePlayed > 0 && (
                  <div style={{ width: '100%', height: 4, background: '#555', borderRadius: 2, marginBottom: 6 }}>
                    <div style={{
                      width: `${Math.min(100, (item.timePlayed / item.duration) * 100)}%`,
                      height: 4, background: '#dc2626', borderRadius: 2
                    }} />
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>
                  Tập {item.epName} • {formatTime(item.timePlayed)}
                </div>
              </div>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(220,38,38,0.8)', borderRadius: '50%',
                padding: 12, opacity: 0.8
              }}>
                <Play fill="currentColor" style={{ color: '#fff', width: 24, height: 24, marginLeft: 2 }} />
              </div>
            </div>
            <div className="info">
              <div className="title">{item.movieName}</div>
            </div>
          </TVFocusable>
        ))}
      </div>
    </div>
  );
};

const categories = [
  { title: 'Phim Mới Cập Nhật', endpoint: '/films/phim-moi-cap-nhat' },
  { title: 'Phim Hot / Phim Chiếu Rạp', endpoint: '/films/danh-sach/phim-chieu-rap' },
  { title: 'Phim Lẻ Mới', endpoint: '/films/danh-sach/phim-le' },
  { title: 'Phim Bộ Mới', endpoint: '/films/danh-sach/phim-bo' },
  { title: 'Hoạt Hình', endpoint: '/films/danh-sach/hoat-hinh' },
];

function TVMovieRowWithFetch({ title, endpoint }: { title: string; endpoint: string }) {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchMovies(endpoint, 1);
        setMovies(res.items?.slice(0, 20) || []);
      } catch (e) {
        console.error(`Failed ${title}:`, e);
      } finally {
        setLoading(false);
      }
    })();
  }, [endpoint, title]);

  if (loading) {
    return (
      <div className="tv-movie-row">
        <h2 className="tv-movie-row-title">{title}</h2>
        <div className="tv-movie-row-scroll">
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              width: 220, flexShrink: 0, background: '#1a1a1a',
              borderRadius: 12, aspectRatio: '2/3.5',
              animation: 'tv-fade-in 0.5s ease'
            }} />
          ))}
        </div>
      </div>
    );
  }

  return <TVMovieRow title={title} movies={movies} />;
}

export default function TVHome() {
  const [heroMovies, setHeroMovies] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchMovies('/films/danh-sach/phim-chieu-rap', 1);
        setHeroMovies(res.items?.slice(0, 10) || []);
      } catch (e) {
        console.error('Failed hero:', e);
      }
    })();
  }, []);

  return (
    <div style={{ paddingBottom: 48 }}>
      {heroMovies.length > 0 ? (
        <TVHero movies={heroMovies} />
      ) : (
        <div style={{ height: '80vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="tv-spinner" />
        </div>
      )}

      <div style={{ marginTop: -60, position: 'relative', zIndex: 10 }}>
        <TVHistoryRow />
        {categories.map((cat) => (
          <TVMovieRowWithFetch key={cat.endpoint} title={cat.title} endpoint={cat.endpoint} />
        ))}
      </div>
    </div>
  );
}
