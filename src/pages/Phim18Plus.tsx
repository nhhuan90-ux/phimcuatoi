import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Film, Play, Search, X } from 'lucide-react';

const PHIM18_API = import.meta.env.VITE_PHIM18_API || '';
const SOURCE_NAMES: Record<string, string> = {
  javhdz: 'JAVHDz', vlxx: 'VLXX', javsub: 'JAVSub',
  javtiful: 'JavTiful', phimxyz: 'PhimXYZ'
};

function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#1a1a1a] border border-red-900/50 rounded-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-600/20 flex items-center justify-center">
            <AlertTriangle className="text-red-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Xác nhận độ tuổi</h2>
          <p className="text-gray-400 text-sm mb-6">
            Trang này chỉ dành cho người dùng <span className="text-red-400 font-bold">đủ 18 tuổi trở lên</span>.
            Nội dung có tính chất nhạy cảm và không phù hợp với trẻ vị thành niên.
          </p>
          <div className="space-y-3">
            <button onClick={onConfirm} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all text-sm uppercase tracking-wider">
              Tôi đã đủ 18 tuổi
            </button>
            <a href="/" className="block w-full py-3 bg-[#2b2b2b] hover:bg-[#3a3a3a] text-gray-300 font-medium rounded-xl transition-all text-sm">
              Tôi chưa đủ 18 tuổi
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Phim18Plus({ hideHeader = false }: { hideHeader?: boolean }) {
  const [verified, setVerified] = useState<boolean>(() => {
    try {
      return localStorage.getItem('age-verified') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleVerify = () => {
    try {
      localStorage.setItem('age-verified', 'true');
    } catch (e) {}
    setVerified(true);
  };
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    if (!verified) return;
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (source !== 'all') params.set('source', source);
        if (search) params.set('search', search);
        const res = await fetch(`${PHIM18_API}/api/movies?${params}`);
        const data = await res.json();
        setMovies(data.items || []);
        setTotal(data.total || 0);
      } catch (e) {
        console.error('Failed to fetch 18+ movies:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [verified, source, page, search]);

  const openPlayer = (movie: any) => {
    setPlayerUrl(`/phim-18/player?source=${movie.source}&id=${movie.id}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      {!verified && <AgeGate onConfirm={handleVerify} />}
      <div className={`container mx-auto px-4 lg:px-8 ${hideHeader ? 'pb-8' : 'py-8'}`}>
        {!hideHeader && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white border-l-4 border-red-600 pl-3 flex items-center gap-3">
                <Film className="text-red-500" size={28} />
                Phim 18+
              </h1>
            </div>

            <div className="flex gap-4 mb-8 border-b border-gray-800 pb-3">
              <Link
                to="/the-loai/phim-18"
                className="text-sm font-medium text-gray-400 hover:text-white pb-2 px-1 transition-colors"
              >
                Phim 18+ Thông thường
              </Link>
              <Link
                to="/phim-18"
                className="text-sm font-bold text-red-500 border-b-2 border-red-500 pb-2 px-1"
              >
                Phim người lớn
              </Link>
            </div>
          </>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text" placeholder="Tìm kiếm phim 18+..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-[#2b2b2b] text-white text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600 flex-1 min-w-[200px]"
          />
          <select
            value={source}
            onChange={e => { setSource(e.target.value); setPage(1); }}
            className="bg-[#2b2b2b] text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600 border-0"
          >
            <option value="all">Tất cả</option>
            {Object.entries(SOURCE_NAMES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <p className="text-gray-500 text-xs mb-4">Tổng: {total} phim (Trang {page}/{totalPages || 1})</p>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Film size={48} className="mx-auto mb-4 opacity-30" />
            <p>Không tìm thấy phim nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {movies.map((m: any) => (
              <button
                key={m.source + '-' + m.id}
                onClick={() => openPlayer(m)}
                className="group relative block overflow-hidden rounded-lg bg-[#1a1a1a] aspect-video text-left cursor-pointer hover:outline hover:outline-2 hover:outline-red-500 transition-all"
              >
                <img
                  src={m.img}
                  alt={m.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><rect fill="%23333" width="240" height="180"/><text x="120" y="90" text-anchor="middle" fill="%23666" font-size="14">No Img</text></svg>'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/20 to-transparent">
                  <div className="absolute top-2 left-2">
                    <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{SOURCE_NAMES[m.source] || m.source}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-red-600/90 rounded-full p-3"><Play fill="white" className="text-white w-6 h-6 ml-0.5" /></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <h3 className="text-white font-medium text-xs line-clamp-2">{m.title}</h3>
                    {m.views && <p className="text-gray-400 text-[10px] mt-0.5">{m.views} lượt xem</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 flex-wrap">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1.5 rounded bg-[#2b2b2b] text-gray-300 text-sm disabled:opacity-40 hover:bg-red-600 hover:text-white transition-colors">&#171;</button>
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded bg-[#2b2b2b] text-gray-300 text-sm disabled:opacity-40 hover:bg-red-600 hover:text-white transition-colors">&#8249;</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const num = start + i;
              if (num > totalPages) return null;
              return (
                <button key={num} onClick={() => setPage(num)} className={`px-3 py-1.5 rounded text-sm ${page === num ? 'bg-red-600 text-white' : 'bg-[#2b2b2b] text-gray-300 hover:bg-red-600 hover:text-white'} transition-colors`}>{num}</button>
              );
            })}
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 rounded bg-[#2b2b2b] text-gray-300 text-sm disabled:opacity-40 hover:bg-red-600 hover:text-white transition-colors">&#8250;</button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="px-3 py-1.5 rounded bg-[#2b2b2b] text-gray-300 text-sm disabled:opacity-40 hover:bg-red-600 hover:text-white transition-colors">&#187;</button>
          </div>
        )}

        {/* Player Modal */}
        {playerUrl && (
          <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-gray-800">
              <span className="text-white text-sm font-medium truncate">Đang phát</span>
              <button onClick={() => setPlayerUrl(null)} className="text-gray-400 hover:text-white p-1"><X size={20} /></button>
            </div>
            <div className="flex-1">
              <iframe src={playerUrl} className="w-full h-full border-0" allow="autoplay;fullscreen" allowFullScreen />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
