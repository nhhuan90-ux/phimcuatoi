import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#141414] border-t border-gray-800 py-12 mt-auto">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block mb-4 transition-transform hover:scale-105 active:scale-95">
              <img src="/logo.png" alt="PhimCuaToi.Online" className="h-10 w-auto object-contain" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              PhimCuaToi.Online - Trang web xem phim trực tuyến miễn phí chất lượng cao với giao diện trực quan, tốc độ tải trang nhanh, cùng kho phim khổng lồ được cập nhật liên tục.
            </p>
            <p className="text-gray-500 text-xs mt-4">
              Disclaimer: This site does not store any files on its server. All contents are provided by non-affiliated third parties.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Danh mục</h3>
            <ul className="space-y-2">
              <li><Link to="/danh-sach/phim-le" className="text-gray-400 hover:text-white text-sm transition-colors">Phim Lẻ</Link></li>
              <li><Link to="/danh-sach/phim-bo" className="text-gray-400 hover:text-white text-sm transition-colors">Phim Bộ</Link></li>
              <li><Link to="/danh-sach/hoat-hinh" className="text-gray-400 hover:text-white text-sm transition-colors">Hoạt Hình</Link></li>
              <li><Link to="/danh-sach/tv-shows" className="text-gray-400 hover:text-white text-sm transition-colors">TV Shows</Link></li>
            </ul>
          </div>

        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} PhimCuaToi.Online. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
