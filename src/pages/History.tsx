import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHistory, WatchHistoryItem, removeHistoryItem, clearHistory } from '../utils/history';
import { Play, Trash2, Clock } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());
    window.scrollTo(0, 0);
  }, []);

  const handleRemove = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeHistoryItem(slug);
    setHistory(getHistory());
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem phim?')) {
      clearHistory();
      setHistory([]);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-24 min-h-[80vh]">
      <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <Clock className="text-red-500" size={28} />
          Lịch sử xem phim
        </h1>
        {history.length > 0 && (
          <button 
            onClick={handleClear}
            className="text-sm flex items-center gap-2 bg-[#2b2b2b] hover:bg-red-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors border border-gray-800"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Xoá toàn bộ</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-[#141414] rounded-2xl border border-gray-800">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl text-white font-medium mb-2">Chưa có lịch sử</h2>
          <p className="text-gray-400 mb-6">Bạn chưa xem bộ phim nào hoặc lịch sử đã bị xoá.</p>
          <Link to="/" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-colors">
            Khám phá phim ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {history.map((item) => (
            <Link 
              key={item.movieSlug} 
              to={`/xem-phim/${item.movieSlug}/${item.epSlug}?id=0`}
              className="group block relative rounded-xl overflow-hidden bg-[#141414] border border-gray-800 hover:border-red-500/50 transition-colors"
            >
              <div className="aspect-[2/3] relative overflow-hidden">
                <img 
                  src={item.posterUrl} 
                  alt={item.movieName} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-red-600/90 rounded-full p-4 mb-2 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-red-600/40">
                    <Play fill="currentColor" className="text-white w-8 h-8 ml-1" />
                  </div>
                  <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                    Tiếp tục Tập {item.epName}
                  </span>
                </div>
                
                <button 
                  onClick={(e) => handleRemove(item.movieSlug, e)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 p-2 rounded-full text-gray-300 hover:text-white transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                  title="Xoá khỏi lịch sử"
                >
                  <Trash2 size={14} />
                </button>

                <div className="absolute bottom-2 left-2 right-2">
                   {/* Progress bar logic if duration > 0 */}
                  {item.duration > 0 && item.timePlayed > 0 && (
                    <div className="w-full bg-gray-600 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (item.timePlayed / item.duration) * 100)}%` }}></div>
                    </div>
                  )}
                  {item.timePlayed > 0 && (
                     <div className="text-[10px] sm:text-xs text-center text-gray-300 bg-black/60 py-0.5 rounded backdrop-blur-sm truncate">
                        Đang xem: {formatTime(item.timePlayed)} {item.duration ? `/ ${formatTime(item.duration)}` : ''}
                     </div>
                  )}
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-red-500 transition-colors">
                  {item.movieName}
                </h3>
                <p className="text-xs text-gray-400 mt-1 truncate">Tập {item.epName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
