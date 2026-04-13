import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SliderContext } from './NetflixContext';
import { IconArrowDown } from './NetflixIcons';
import './NetflixSlider.css';

const Mark = () => <div className="netflix-mark" />;

const ShowDetailsButton = ({ onClick }: { onClick: (e: React.MouseEvent) => void }) => (
  <button onClick={onClick} className="netflix-show-details-button">
    <span>
      <IconArrowDown />
    </span>
  </button>
);

interface ItemProps {
  movie: any;
}

const NetflixItem: React.FC<ItemProps> = ({ movie }) => {
  const context = useContext(SliderContext);
  if (!context) return null;
  const { onSelectSlide, currentSlide, elementRef } = context;

  const isActive = currentSlide && currentSlide.slug === movie.slug;

  return (
    <div
      ref={elementRef as any}
      className={`netflix-item ${isActive ? 'netflix-item--open' : ''}`}
    >
      <Link to={`/phim/${movie.slug}`} className="block w-full h-full relative">
        <img src={movie.thumb_url || movie.poster_url} alt={movie.name} />
      </Link>
      <ShowDetailsButton onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelectSlide(movie);
      }} />
      {isActive && <Mark />}
    </div>
  );
};

export default NetflixItem;
