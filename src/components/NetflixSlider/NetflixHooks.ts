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

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceThreshold = 50;
    const isLeftSwipe = touchStart - touchEnd > distanceThreshold;
    const isRightSwipe = touchStart - touchEnd < -distanceThreshold;

    if (isLeftSwipe && (viewed + totalInViewport) < countElements) {
      handleNext();
    } else if (isRightSwipe && distance < 0) {
      handlePrev();
    }
  };

  const slideProps = {
    style: { transform: `translate3d(${distance}px, 0, 0)` },
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };

  const hasPrev = distance < 0;
  const hasNext = (viewed + totalInViewport) < countElements;

  return { handlePrev, handleNext, slideProps, containerRef, hasPrev, hasNext };
};
