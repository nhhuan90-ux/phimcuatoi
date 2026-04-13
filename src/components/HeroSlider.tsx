import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroSliderProps {
  movies: any[];
}

export default function HeroSlider({ movies }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [movies.length]);

  if (!movies || movies.length === 0) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % movies.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);

  const movie = movies[currentIndex];

  return (
    <div 
      className="relative w-full h-[75vh] md:h-[90vh] lg:h-[100vh] overflow-hidden bg-[#0a0a0a] group touch-pan-y"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            const threshold = 50;
            if (info.offset.x < -threshold) nextSlide();
            else if (info.offset.x > threshold) prevSlide();
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          {/* Netflix-style Vignette Gradients */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent w-[90%] md:w-[70%]" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent h-full" />
          <div className="absolute inset-0 z-10 bg-black/20" /> {/* Subtle overall darkening */}
          
          <img
            src={movie.thumb_url || movie.poster_url}
            alt={movie.name}
            className="w-full h-full object-cover object-top md:object-center"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-[10%] md:bottom-[20%] left-4 md:left-12 lg:left-16 z-20 w-full md:w-[70%] lg:w-[50%] pr-4 md:pr-0">
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full"
        >
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-3 md:mb-5 leading-tight drop-shadow-2xl line-clamp-2">
            {movie.name}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs md:text-sm font-semibold text-white/90 drop-shadow-md">
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
            {movie.language && (
              <span className="border border-white/50 px-2 py-0.5 rounded-sm bg-black/30">
                {movie.language}
              </span>
            )}
          </div>

          <p className="text-white/90 text-sm md:text-lg line-clamp-3 md:line-clamp-4 mb-6 md:mb-8 drop-shadow-md font-medium leading-relaxed">
            {movie.description?.replace(/<[^>]*>?/gm, '') || movie.original_name || 'Đang cập nhật nội dung...'}
          </p>

          <div className="flex items-center gap-3 md:gap-4">
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
              <span className="text-base md:text-lg">Thông tin khác</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 bg-black/20 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
      >
        <ChevronLeft size={32} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 bg-black/20 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
      >
        <ChevronRight size={32} />
      </button>

      {/* Modern pagination indicator */}
      <div className="absolute bottom-4 md:bottom-8 right-4 md:right-12 z-30 flex gap-2">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 duration-300 transition-all ${
              idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
