import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';

const GENRES = [
  { name: 'Hành Động', slug: 'hanh-dong' },
  { name: 'Tình Cảm', slug: 'tinh-cam' },
  { name: 'Hài Hước', slug: 'hai-huoc' },
  { name: 'Cổ Trang', slug: 'co-trang' },
  { name: 'Tâm Lý', slug: 'tam-ly' },
  { name: 'Hình Sự', slug: 'hinh-su' },
  { name: 'Chiến Tranh', slug: 'chien-tranh' },
  { name: 'Thể Thao', slug: 'the-thao' },
  { name: 'Võ Thuật', slug: 'vo-thuat' },
  { name: 'Viễn Tưởng', slug: 'vien-tuong' },
  { name: 'Phiêu Lưu', slug: 'phieu-luu' },
  { name: 'Khoa Học', slug: 'khoa-hoc' },
  { name: 'Kinh Dị', slug: 'kinh-di' },
  { name: 'Âm Nhạc', slug: 'am-nhac' },
  { name: 'Thần Thoại', slug: 'than-thoai' },
  { name: 'Tài Liệu', slug: 'tai-lieu' },
  { name: 'Gia Đình', slug: 'gia-dinh' },
];

export default function GenreCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white border-l-4 border-red-600 pl-3">
          Thể Loại Phim
        </h2>
      </div>
      
      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-red-600 text-white p-2 rounded-r-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block"
        >
          <ChevronLeft size={24} />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-3 scrollbar-hide pb-4 snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {GENRES.map((genre) => (
            <Link
              key={genre.slug}
              to={`/the-loai/${genre.slug}`}
              className="flex-shrink-0 snap-start bg-[#1a1a1a] hover:bg-red-600 border border-gray-800 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 group/btn"
            >
              <Film size={18} className="text-gray-500 group-hover/btn:text-white transition-colors" />
              {genre.name}
            </Link>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-red-600 text-white p-2 rounded-l-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </section>
  );
}
