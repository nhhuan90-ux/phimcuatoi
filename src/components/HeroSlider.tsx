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
    <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-black group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            const threshold = 50;
            if (info.offset.x < -threshold) {
              nextSlide();
            } else if (info.offset.x > threshold) {
              prevSlide();
            }
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
          <img
            src={movie.poster_url || movie.thumb_url}
            alt={movie.name}
            className="w-full h-full object-cover opacity-60 pointer-events-none"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 z-20 flex items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            key={`content-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 leading-tight">
              {movie.name}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-4 font-medium">
              {movie.original_name}
            </p>
            
            <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
              {movie.quality && (
                <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">
                  {movie.quality}
                </span>
              )}
              {movie.language && (
                <span className="border border-gray-500 text-gray-300 px-2 py-1 rounded">
                  {movie.language}
                </span>
              )}
              {movie.time && (
                <span className="text-gray-300">{movie.time}</span>
              )}
            </div>

            <p className="text-gray-400 text-sm md:text-base line-clamp-3 mb-8 max-w-xl leading-relaxed">
              {movie.description?.replace(/<[^>]*>?/gm, '') || 'Đang cập nhật nội dung...'}
            </p>

            <div className="flex items-center gap-4">
              <Link
                to={`/phim/${movie.slug}`}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-colors"
              >
                <Play fill="currentColor" size={20} />
                Xem Ngay
              </Link>
              <Link
                to={`/phim/${movie.slug}`}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-colors"
              >
                <Info size={20} />
                Chi Tiết
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-red-600' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
