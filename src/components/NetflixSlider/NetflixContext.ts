import React, { createContext } from 'react';

export interface SliderContextType {
  onSelectSlide: (movie: any) => void;
  onCloseSlide: () => void;
  elementRef: React.RefObject<HTMLDivElement>;
  currentSlide: any | null;
}

export const SliderContext = createContext<SliderContextType | undefined>(undefined);
