import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import TVFocusable from './TVFocusable';

interface TVHeroProps {
  movies: any[];
}

export default function TVHero({ movies }: TVHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [movies.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Only handle hero-level left/right when hero buttons are focused
      const active = document.activeElement;
      if (!active?.closest('.tv-hero')) return;

      if (e.key === 'ArrowLeft' && active?.hasAttribute('data-hero-nav')) {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
      }
      if (e.key === 'ArrowRight' && active?.hasAttribute('data-hero-nav')) {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % movies.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movies.length]);

  if (!movies || movies.length === 0) return null;
  const movie = movies[currentIndex];

  return (
    <div className="tv-hero">
      <img
        src={movie.thumb_url || movie.poster_url}
        alt={movie.name}
        className="tv-hero-image"
        key={currentIndex}
        style={{ animation: 'tv-fade-in 0.8s ease' }}
      />
      <div className="tv-hero-gradient" />

      <div className="tv-hero-content tv-fade-in" key={`content-${currentIndex}`}>
        <h1 className="tv-hero-title">{movie.name}</h1>

        <div className="tv-hero-meta">
          {movie.quality && <span className="tv-hero-badge">{movie.quality}</span>}
          {movie.year && <span className="tv-hero-badge">{movie.year}</span>}
        </div>

        <p className="tv-hero-desc">
          {movie.description?.replace(/<[^>]*>?/gm, '') || movie.original_name || 'Đang cập nhật nội dung...'}
        </p>

        <div className="tv-hero-buttons">
          <TVFocusable
            link={`/tv/phim/${movie.slug}`}
            className="tv-btn tv-btn-primary"
            focusClassName="tv-btn-focus"
            autoFocus
          >
            <Play fill="currentColor" size={22} />
            <span>Phát</span>
          </TVFocusable>

          <TVFocusable
            link={`/tv/phim/${movie.slug}`}
            className="tv-btn tv-btn-secondary"
            focusClassName="tv-btn-focus"
          >
            <Info size={22} />
            <span>Thông tin</span>
          </TVFocusable>
        </div>
      </div>

      {/* Pagination dots */}
      <div style={{ position: 'absolute', bottom: 32, right: 'var(--tv-safe-padding)', zIndex: 30, display: 'flex', gap: 8 }}>
        {movies.slice(0, 10).map((_, idx) => (
          <div
            key={idx}
            className={`tv-page-indicator ${idx === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
