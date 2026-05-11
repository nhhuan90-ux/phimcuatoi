import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Film, Tv, Flame, Search, Clock } from 'lucide-react';
import TVFocusable from './TVFocusable';

const navItems = [
  { name: 'Trang chủ', path: '/tv', icon: Home },
  { name: 'Phim Lẻ', path: '/tv/danh-sach/phim-le', icon: Film },
  { name: 'Phim Bộ', path: '/tv/danh-sach/phim-bo', icon: Tv },
  { name: 'Phim Hot', path: '/tv/danh-sach/phim-chieu-rap', icon: Flame },
  { name: 'Tìm kiếm', path: '/tv/tim-kiem', icon: Search },
  { name: 'Lịch sử', path: '/tv/lich-su', icon: Clock },
];

export default function TVHeader() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`tv-header ${isScrolled ? 'scrolled' : ''}`}>
      <img src="/logo.png" alt="PhimCuaToi" className="tv-header-logo" />
      <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/tv' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <TVFocusable
              key={item.path}
              link={item.path}
              className={`tv-nav-item ${isActive ? 'active' : ''}`}
              focusClassName="tv-nav-focus"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={18} />
                {item.name}
              </span>
            </TVFocusable>
          );
        })}
      </nav>
    </div>
  );
}
