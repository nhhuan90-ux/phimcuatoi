import { useState, useRef, useEffect, RefObject } from 'react';

export const useSizeElement = () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (elementRef.current) {
      setWidth(elementRef.current.clientWidth);
    }
  }, [elementRef.current]);

  return { width, elementRef };
};

const PADDINGS = 110;

export const useSliding = (elementWidth: number, countElements: number) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [distance, setDistance] = useState(0);
  const [totalInViewport, setTotalInViewport] = useState(0);
  const [viewed, setViewed] = useState(0);

  useEffect(() => {
    if (containerRef.current && elementWidth > 0) {
      const w = containerRef.current.clientWidth - PADDINGS;
      setContainerWidth(w);
      setTotalInViewport(Math.floor(w / elementWidth));
    }
  }, [containerRef.current, elementWidth]);

  const handlePrev = () => {
    setViewed(viewed - totalInViewport);
    setDistance(distance + containerWidth);
  };

  const handleNext = () => {
    setViewed(viewed + totalInViewport);
    setDistance(distance - containerWidth);
  };

  const slideProps = {
    style: { transform: `translate3d(${distance}px, 0, 0)` }
  };

  const hasPrev = distance < 0;
  const hasNext = (viewed + totalInViewport) < countElements;

  return { handlePrev, handleNext, slideProps, containerRef, hasPrev, hasNext };
};
