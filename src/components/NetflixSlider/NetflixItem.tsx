import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SliderContext } from './NetflixContext';
import { IconArrowDown, IconArrowUp } from './NetflixIcons';
import './NetflixSlider.css';

const Mark = () => <div className="netflix-mark" />;

const ShowDetailsButton = ({ onClick, isActive }: { onClick: (e: React.MouseEvent) => void; isActive: boolean }) => (
  <button 
    onClick={onClick} 
    className={`netflix-show-details-button ${isActive ? 'netflix-show-details-button--active' : ''}`}
  >
    <span>
      {isActive ? <IconArrowUp /> : <IconArrowDown />}
    </span>
  </button>
);

interface ItemProps {
  movie: any;
}

const NetflixItem: React.FC<ItemProps> = ({ movie }) => {
  const context = useContext(SliderContext);
  if (!context) return null;
  const { onSelectSlide, onCloseSlide, currentSlide, elementRef } = context;

  const isActive = currentSlide && currentSlide.slug === movie.slug;

  const handleItemClick = (e: React.MouseEvent) => {
    const isMobile = window.innerWidth < 1024;
    
    if (isMobile) {
      if (!isActive) {
        // First click on mobile: Zoom/Select
        e.preventDefault();
        onSelectSlide(movie);
      }
      // If already active, let the Link handle the navigation
    } else {
      // Desktop: hover handles scaling, single click navigates
      // But we can also trigger onSelectSlide if we want the info area to toggle
      // The current implementation uses ShowDetailsButton for toggle info area.
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isActive) {
      onCloseSlide();
    } else {
      onSelectSlide(movie);
    }
  };

  const handleMouseEnter = () => {
    if (currentSlide && !isActive) {
      onCloseSlide();
    }
  };

  return (
    <div
      ref={elementRef as any}
      className={`netflix-item ${isActive ? 'netflix-item--open is-zoomed' : ''}`}
      onMouseEnter={handleMouseEnter}
    >
      <div className="relative group/poster">
        <Link 
          to={`/phim/${movie.slug}`} 
          className="block w-full h-full"
          onClick={handleItemClick}
        >
          <img src={movie.thumb_url || movie.poster_url} alt={movie.name} />
        </Link>
        <ShowDetailsButton onClick={handleToggle} isActive={!!isActive} />
      </div>
      
      <div className="netflix-item__title">
        {movie.name}
      </div>

      {isActive && <Mark />}
    </div>
  );
};

export default NetflixItem;
