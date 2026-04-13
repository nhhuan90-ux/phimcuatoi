import React, { useState } from 'react';
import { SliderContext } from './NetflixContext';
import NetflixContent from './NetflixContent';
import { IconArrowDown } from './NetflixIcons';
import { useSliding, useSizeElement } from './NetflixHooks';
import './NetflixSlider.css';

const SlideButton = ({ onClick, type }: { onClick: () => void; type: 'prev' | 'next' }) => (
  <button className={`netflix-slide-button netflix-slide-button--${type}`} onClick={onClick}>
    <span>
      <IconArrowDown />
    </span>
  </button>
);

const SliderWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="netflix-slider-wrapper">
    {children}
  </div>
);

interface SliderProps {
  children: React.ReactNode;
  activeSlide?: any;
}

const NetflixSlider: React.FC<SliderProps> = ({ children, activeSlide }) => {
  const [currentSlide, setCurrentSlide] = useState<any | null>(activeSlide || null);
  const { width, elementRef } = useSizeElement();
  const { handlePrev, handleNext, slideProps, containerRef, hasNext, hasPrev } = useSliding(
    width,
    React.Children.count(children)
  );

  const handleSelect = (movie: any) => {
    setCurrentSlide(movie);
  };

  const handleClose = () => {
    setCurrentSlide(null);
  };

  const contextValue = {
    onSelectSlide: handleSelect,
    onCloseSlide: handleClose,
    elementRef,
    currentSlide,
  };

  return (
    <SliderContext.Provider value={contextValue}>
      <SliderWrapper>
        <div className={`netflix-slider ${currentSlide ? 'netflix-slider--open' : ''}`}>
          <div ref={containerRef} className="netflix-slider__container" {...slideProps}>
            {children}
          </div>
        </div>
        {hasPrev && <SlideButton onClick={handlePrev} type="prev" />}
        {hasNext && <SlideButton onClick={handleNext} type="next" />}
      </SliderWrapper>
      {currentSlide && <NetflixContent movie={currentSlide} onClose={handleClose} />}
    </SliderContext.Provider>
  );
};

export default NetflixSlider;
