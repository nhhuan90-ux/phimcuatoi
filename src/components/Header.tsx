import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Download, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      setShowInstallBtn(false);
    } else {
      setIsStandalone(false);
      setShowInstallBtn(true); // Always show button if not standalone
    }

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const ua = navigator.userAgent.toLowerCase();
    const isAndroidTV = ua.includes('android') && (
      ua.includes('tv') || ua.includes('aft') || ua.includes('shield') || 
      ua.includes('chromecast') || ua.includes('nexus player') || 
      ua.includes('mi box') || ua.includes('bravia') || ua.includes('smart-tv') || 
      ua.includes('smarttv') || ua.includes('philips') || ua.includes('hbbtv')
    );

    if (isAndroidTV) {
      // Download APK directly
      const a = document.createElement('a');
      a.href = '/PhimCuaToi-TV.apk';
      a.download = 'PhimCuaToi-TV.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBtn(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual guide for iOS or if prompt is not available
      setShowGuide(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tim-kiem?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Phim Lẻ', path: '/danh-sach/phim-le' },
    { name: 'Phim Bộ', path: '/danh-sach/phim-bo' },
    { name: 'Phim Hot', path: '/danh-sach/phim-chieu-rap' },
    { name: 'Phim 18+', path: '/the-loai/phim-18' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-[#141414]/95 backdrop-blur-sm shadow-md' : 'bg-gradient-to-b from-black/80 to-transparent'
      )}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center transition-transform hover:scale-105 active:scale-95">
              <img src="/logo.png" alt="PhimCuaToi.Online" className="h-8 md:h-10 w-auto object-contain" />
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {showInstallBtn && (
              <button
                onClick={handleInstallClick}
                className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-[11px] font-bold rounded-full hover:bg-red-700 transition-all hover:scale-105 shadow-lg shadow-red-600/40 border border-red-500 animate-pulse-subtle"
              >
                <Download size={13} strokeWidth={3} />
                CÀI APP
              </button>
            )}
            <form onSubmit={handleSearch} className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#2b2b2b] text-white text-sm rounded-full pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 w-64 transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <Search size={18} />
              </button>
            </form>
            
            <div className="flex items-center gap-3 lg:hidden">
              {showInstallBtn && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white text-[9px] font-bold rounded-full hover:bg-red-700 transition-colors shadow-md shadow-red-600/30 border border-red-500"
                >
                  <Download size={10} strokeWidth={3} />
                  APP
                </button>
              )}
              <button
                className="text-gray-300 hover:text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#141414] border-t border-gray-800">
          <div className="px-4 py-4 space-y-4">
            {showInstallBtn && (
              <button
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700 transition-colors border border-red-500"
              >
                <Download size={18} />
                TẢI APP PHIMCUATOI
              </button>
            )}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#2b2b2b] text-white text-sm rounded-md pl-4 pr-10 py-3 w-full focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </button>
            </form>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-base font-medium text-gray-300 hover:text-white py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
      {/* Install Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl max-w-md w-full p-6 relative overflow-hidden">
            <button 
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-600 mb-2">
                <Download size={32} />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Cài đặt Ứng dụng</h3>
              <p className="text-gray-400 text-sm">
                Để có trải nghiệm xem phim tốt nhất, không quảng cáo trình duyệt và khởi động nhanh, hãy cài đặt PhimCuaToi vào màn hình chính.
              </p>
              
              <div className="w-full space-y-4 pt-4">
                <div className="bg-[#262626] p-4 rounded-xl text-left">
                  <p className="text-white font-bold mb-2 flex items-center gap-2">
                    <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                    Cho iPhone (iOS) - Safari:
                  </p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Nhấn biểu tượng <span className="text-blue-400 font-bold">Chia sẻ</span> (hình ô vuông có mũi tên lên) trên trình duyệt, sau đó chọn <span className="text-white font-bold">"Thêm vào MH chính"</span>.
                  </p>
                </div>
                
                <div className="bg-[#262626] p-4 rounded-xl text-left">
                  <p className="text-white font-bold mb-2 flex items-center gap-2">
                    <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                    Cho Android - Chrome:
                  </p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Nhấn biểu tượng <span className="text-gray-200 font-bold">3 chấm</span> ở góc phải, sau đó chọn <span className="text-white font-bold">"Cài đặt ứng dụng"</span> hoặc <span className="text-white font-bold">"Thêm vào màn hình chính"</span>.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full py-3 mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors uppercase text-sm tracking-wider"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
