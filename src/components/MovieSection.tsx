import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

interface MovieSectionProps {
  title: string;
  movies: any[];
  viewAllLink?: string;
}

export default function MovieSection({ title, movies, viewAllLink }: MovieSectionProps) {
  if (!movies || movies.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white border-l-4 border-red-600 pl-3">
          {title}
        </h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            Xem tất cả <ChevronRight size={16} />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.slug} movie={movie} />
        ))}
      </div>
    </section>
  );
}
