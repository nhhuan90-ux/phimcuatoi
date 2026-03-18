import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

interface MovieCardProps {
  key?: React.Key;
  movie: {
    name: string;
    slug: string;
    original_name: string;
    thumb_url: string;
    poster_url: string;
    current_episode: string;
    quality: string;
    language: string;
  };
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link to={`/phim/${movie.slug}`} className="group relative block overflow-hidden rounded-lg bg-[#1a1a1a] aspect-[2/3]">
      <img
        src={movie.thumb_url || movie.poster_url}
        alt={movie.name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity duration-300">
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {movie.current_episode && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-md">
              {movie.current_episode}
            </span>
          )}
          {movie.quality && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-md w-fit">
              {movie.quality} {movie.language && `- ${movie.language}`}
            </span>
          )}
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-red-600/90 rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play fill="currentColor" className="text-white w-8 h-8 ml-1" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-red-500 transition-colors">
            {movie.name}
          </h3>
          <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">
            {movie.original_name}
          </p>
        </div>
      </div>
    </Link>
  );
}
