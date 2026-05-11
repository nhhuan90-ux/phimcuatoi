import { useRef, useEffect } from 'react';
import TVMovieCard from './TVMovieCard';

interface TVMovieRowProps {
  title: string;
  movies: any[];
}

export default function TVMovieRow({ title, movies }: TVMovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll when a card inside this row gets focused
    const container = scrollRef.current;
    if (!container) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.tv-movie-row-scroll') === container) {
        const card = target.closest('.tv-movie-card') as HTMLElement;
        if (card) {
          const containerRect = container.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();

          // Scroll left if card is partially hidden on the left
          if (cardRect.left < containerRect.left + 48) {
            container.scrollLeft -= (containerRect.left + 48 - cardRect.left + 100);
          }
          // Scroll right if card is partially hidden on the right
          if (cardRect.right > containerRect.right - 48) {
            container.scrollLeft += (cardRect.right - containerRect.right + 148);
          }
        }
      }
    };

    container.addEventListener('focusin', handleFocus);
    return () => container.removeEventListener('focusin', handleFocus);
  }, []);

  if (!movies || movies.length === 0) return null;

  return (
    <div className="tv-movie-row">
      <h2 className="tv-movie-row-title">{title}</h2>
      <div className="tv-movie-row-scroll" ref={scrollRef}>
        {movies.map((movie, idx) => (
          <TVMovieCard key={movie.slug} movie={movie} index={idx} />
        ))}
      </div>
    </div>
  );
}
