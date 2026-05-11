import TVFocusable from './TVFocusable';

interface TVMovieCardProps {
  movie: any;
  index?: number;
}

export default function TVMovieCard({ movie, index = 0 }: TVMovieCardProps) {
  return (
    <TVFocusable
      link={`/tv/phim/${movie.slug}`}
      className="tv-movie-card"
      focusClassName="tv-card-focus"
      focusKey={`card-${movie.slug}`}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={movie.thumb_url || movie.poster_url}
          alt={movie.name}
          className="poster"
          loading={index < 8 ? 'eager' : 'lazy'}
        />
        <div className="badge-row">
          {movie.current_episode && (
            <span className="badge" style={{ background: '#dc2626', color: '#fff' }}>
              {movie.current_episode}
            </span>
          )}
          {movie.quality && (
            <span className="badge" style={{ background: '#2563eb', color: '#fff' }}>
              {movie.quality}
            </span>
          )}
        </div>
      </div>
      <div className="info">
        <div className="title">{movie.name}</div>
        <div className="subtitle">{movie.original_name || movie.year || ''}</div>
      </div>
    </TVFocusable>
  );
}
