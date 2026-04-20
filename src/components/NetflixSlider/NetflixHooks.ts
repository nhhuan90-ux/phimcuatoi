import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export const useSizeElement = () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!elementRef.current) return;

    const updateWidth = () => {
      if (elementRef.current) {
        setWidth(elementRef.current.clientWidth);
      }
    };

    // Initial width
    updateWidth();

    // Use ResizeObserver for accurate detection of size changes (e.g., zoom, media query changes)
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(elementRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { width, elementRef };
};

export const useSliding = (elementWidth: number, countElements: number) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [distance, setDistance] = useState(0);
  const [totalInViewport, setTotalInViewport] = useState(0);
  const [viewed, setViewed] = useState(0);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Recalculate container width and visibility when element size or container size changes
  useEffect(() => {
    if (!containerRef.current || elementWidth <= 0) return;

    const updateContainerInfo = () => {
      if (containerRef.current) {
        const computedStyle = window.getComputedStyle(containerRef.current);
        const pLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const pRight = parseFloat(computedStyle.paddingRight) || 0;
        const w = containerRef.current.clientWidth - (pLeft + pRight);
        setContainerWidth(w);
        setTotalInViewport(Math.round(w / elementWidth));
      }
    };

    updateContainerInfo();

    const resizeObserver = new ResizeObserver(() => {
      updateContainerInfo();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [elementWidth]);

  // Reset positioning if the viewport size changes significantly to avoid broken alignment
  useEffect(() => {
    setViewed(0);
  }, [containerWidth]);

  const handlePrev = useCallback(() => {
    setViewed(prev => {
      let nextViewed = prev - totalInViewport;
      return nextViewed < 0 ? 0 : nextViewed;
    });
  }, [totalInViewport]);

  const handleNext = useCallback(() => {
    setViewed(prev => {
      let nextViewed = prev + totalInViewport;
      const maxViewed = Math.max(0, countElements - totalInViewport);
      return nextViewed > maxViewed ? maxViewed : nextViewed;
    });
  }, [totalInViewport, countElements]);

  // Reactive distance based on viewed elements
  useEffect(() => {
    if (totalInViewport > 0 && containerRef.current) {
      const itemWidth = containerWidth / totalInViewport;
      let targetDistance = -viewed * itemWidth;

      // Ensure we don't scroll past the actual physical boundary of the flex container
      const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
      if (maxScroll > 0) {
        // If target distance is more negative than what's physically possible, clamp it
        if (targetDistance < -maxScroll) {
          targetDistance = -maxScroll;
        }
        
        // Also force maxViewed to snap exactly to maxScroll
        const maxViewed = Math.max(0, countElements - totalInViewport);
        if (viewed >= maxViewed) {
          targetDistance = -maxScroll;
        }
      }

      setDistance(targetDistance);
    } else {
      setDistance(0);
    }
  }, [viewed, containerWidth, totalInViewport, countElements]);

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
