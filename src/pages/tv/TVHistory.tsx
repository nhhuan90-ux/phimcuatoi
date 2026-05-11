import { useState, useEffect } from 'react';
import { Play, Trash2, Clock } from 'lucide-react';
import { getHistory, removeHistoryItem, clearHistory, WatchHistoryItem } from '../../utils/history';
import TVFocusable from '../../components/tv/TVFocusable';

export default function TVHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => { setHistory(getHistory()); }, []);

  const handleDelete = (slug: string) => {
    removeHistoryItem(slug);
    setHistory(getHistory());
  };

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '100px 48px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12, borderLeft: '4px solid #dc2626', paddingLeft: 16 }}>
          <Clock size={28} style={{ color: '#dc2626' }} />
          Lịch sử xem phim
        </h1>
        {history.length > 0 && (
          <TVFocusable onPress={handleClear} className="tv-btn tv-btn-secondary" focusClassName="tv-btn-focus" style={{ fontSize: 14, padding: '10px 20px' }}>
            <Trash2 size={16} /> Xóa tất cả
          </TVFocusable>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#555', fontSize: 20 }}>
          Chưa có lịch sử xem phim nào.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
          {history.map((item) => (
            <TVFocusable
              key={item.movieSlug}
              link={`/tv/xem-phim/${item.movieSlug}/${item.epSlug}?id=0`}
              className="tv-movie-card"
              focusClassName="tv-card-focus"
            >
              <div style={{ position: 'relative' }}>
                <img src={item.posterUrl} alt={item.movieName} className="poster" />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                  padding: '40px 10px 10px'
                }}>
                  {item.duration > 0 && item.timePlayed > 0 && (
                    <div style={{ width: '100%', height: 4, background: '#555', borderRadius: 2, marginBottom: 6 }}>
                      <div style={{ width: `${Math.min(100, (item.timePlayed / item.duration) * 100)}%`, height: 4, background: '#dc2626', borderRadius: 2 }} />
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>
                    Tập {item.epName} • {formatTime(item.timePlayed)}
                  </div>
                </div>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  background: 'rgba(220,38,38,0.8)', borderRadius: '50%', padding: 12, opacity: 0.8
                }}>
                  <Play fill="currentColor" style={{ color: '#fff', width: 24, height: 24, marginLeft: 2 }} />
                </div>
              </div>
              <div className="info">
                <div className="title">{item.movieName}</div>
              </div>
            </TVFocusable>
          ))}
        </div>
      )}
    </div>
  );
}
