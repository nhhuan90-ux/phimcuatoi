import React, { useContext } from 'react';
import { SliderContext } from './NetflixContext';
import { IconArrowDown } from './NetflixIcons';
import './NetflixSlider.css';

const Mark = () => <div className="netflix-mark" />;

const ShowDetailsButton = ({ onClick }: { onClick: () => void }) => (
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
      <img src={movie.thumb_url || movie.poster_url} alt={movie.name} />
      <ShowDetailsButton onClick={() => onSelectSlide(movie)} />
      {isActive && <Mark />}
    </div>
  );
};

export default NetflixItem;
