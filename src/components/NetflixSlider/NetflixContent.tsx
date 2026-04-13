import React from 'react';
import { IconCross } from './NetflixIcons';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import './NetflixSlider.css';

interface ContentProps {
  movie: any;
  onClose: () => void;
}

const NetflixContent: React.FC<ContentProps> = ({ movie, onClose }) => (
  <div className="netflix-content">
    <div className="netflix-content__background">
      <div className="netflix-content__background__shadow" />
      <div
        className="netflix-content__background__image"
        style={{ backgroundImage: `url(${movie.thumb_url || movie.poster_url})` }}
      />
    </div>
    <div className="netflix-content__area">
      <div className="netflix-content__area__container">
        <div className="netflix-content__title">{movie.name}</div>
        
        <div className="flex flex-wrap items-center gap-3 mb-2 text-xs md:text-sm font-semibold text-white/90">
            {movie.quality && (
              <span className="border border-white/50 px-2 py-0.5 rounded-sm bg-black/30">
                {movie.quality}
              </span>
            )}
            {movie.year && (
              <span>{movie.year}</span>
            )}
            {movie.time && (
              <span>{movie.time}</span>
            )}
        </div>

        <div className="netflix-content__description line-clamp-3">
          {movie.description?.replace(/<[^>]*>?/gm, '') || movie.original_name}
        </div>

        <div className="flex items-center gap-3 md:gap-4 mt-6">
            <Link
              to={`/phim/${movie.slug}`}
              className="bg-white hover:bg-white/80 text-black px-6 md:px-8 py-2 md:py-3 rounded-md font-bold flex items-center gap-2 transition-all duration-200"
            >
              <Play fill="currentColor" size={24} />
              <span className="text-base md:text-lg">Phát</span>
            </Link>
            <Link
              to={`/phim/${movie.slug}`}
              className="bg-[#6d6d6e]/70 hover:bg-[#6d6d6e]/50 text-white px-6 md:px-8 py-2 md:py-3 rounded-md font-bold flex items-center gap-2 transition-all duration-200"
            >
              <Info size={24} />
              <span className="text-base md:text-lg">Chi Tiết</span>
            </Link>
        </div>

      </div>
      <button className="netflix-content__close" onClick={onClose}>
        <IconCross />
      </button>
    </div>
  </div>
);

export default NetflixContent;
