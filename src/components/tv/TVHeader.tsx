import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Film, Tv, Flame, Search, Clock, Globe } from 'lucide-react';
import TVFocusable from './TVFocusable';

const navItems = [
  { name: 'Trang chủ', path: '/tv', icon: Home },
  { name: 'Phim Lẻ', path: '/tv/danh-sach/phim-le', icon: Film },
  { name: 'Phim Bộ', path: '/tv/danh-sach/phim-bo', icon: Tv },
  { name: 'Phim Hot', path: '/tv/danh-sach/phim-chieu-rap', icon: Flame },
  { name: 'Tìm kiếm', path: '/tv/tim-kiem', icon: Search },
  { name: 'Lịch sử', path: '/tv/lich-su', icon: Clock },
  { name: 'Giao diện Web', path: '/?tv=0', icon: Globe },
];

export default function TVHeader() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Split navigation items: Category links on the left, utilities on the right
  const mainNavItems = navItems.filter(item => item.path !== '/tv/tim-kiem' && item.path !== '/?tv=0');
  const utilityNavItems = navItems.filter(item => item.path === '/tv/tim-kiem' || item.path === '/?tv=0');

  return (
    <div className={`tv-header ${isScrolled ? 'scrolled' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'nowrap' }}>
        <img src="/logo.png" alt="PhimCuaToi" className="tv-header-logo" style={{ height: '40px', width: 'auto', maxHeight: '40px' }} />
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
          {mainNavItems.map((item) => {
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
                  <Icon size={16} />
                  <span>{item.name}</span>
                </span>
              </TVFocusable>
            );
          })}
        </nav>
      </div>

      <nav style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
        {utilityNavItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/tv' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <TVFocusable
              key={item.path}
              link={item.path}
              className={`tv-nav-item ${isActive ? 'active' : ''} ${item.path === '/?tv=0' ? 'tv-nav-web-toggle' : ''}`}
              focusClassName="tv-nav-focus"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={16} />
                <span className="tv-nav-text-utility">{item.name}</span>
              </span>
            </TVFocusable>
          );
        })}
      </nav>
    </div>
  );
}
