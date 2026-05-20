import { useState, useCallback, useEffect, useRef } from 'react';
import { searchMovies } from '../../services/api';
import TVFocusable from '../../components/tv/TVFocusable';
import TVMovieCard from '../../components/tv/TVMovieCard';
import { Search, Delete, ArrowLeft } from 'lucide-react';

const KEYS = [
  'A','B','C','D','E','F',
  'G','H','I','J','K','L',
  'M','N','O','P','Q','R',
  'S','T','U','V','W','X',
  'Y','Z','0','1','2','3',
  '4','5','6','7','8','9',
];

export default function TVSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<any>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchMovies(q.trim());
      setResults(res.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // Auto-search after 800ms of no typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(query), 800);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const addChar = (ch: string) => setQuery(prev => prev + ch);
  const deleteChar = () => setQuery(prev => prev.slice(0, -1));
  const addSpace = () => setQuery(prev => prev + ' ');

  return (
    <div className="tv-search-container tv-fade-in">
      {/* Left: Keyboard */}
      <div className="tv-search-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Search size={24} style={{ color: '#dc2626' }} />
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Tìm kiếm</h2>
        </div>

        {/* Search input display */}
        <div style={{
          padding: '14px 20px', background: '#1a1a1a', border: '2px solid #333',
          borderRadius: 12, fontSize: 22, color: '#fff', marginBottom: 16,
          minHeight: 56, display: 'flex', alignItems: 'center'
        }}>
          {query || <span style={{ color: '#555' }}>Nhập tên phim...</span>}
          <span style={{ animation: 'tv-fade-in 0.5s ease infinite alternate', marginLeft: 2 }}>|</span>
        </div>

        {/* Keyboard grid */}
        <div className="tv-keyboard">
          {KEYS.map((key) => (
            <TVFocusable key={key} onPress={() => addChar(key)} className="tv-key" focusClassName="tv-key-focus">
              {key}
            </TVFocusable>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <TVFocusable onPress={addSpace} className="tv-key" focusClassName="tv-key-focus" style={{ flex: 2 }}>
            SPACE
          </TVFocusable>
          <TVFocusable onPress={deleteChar} className="tv-key" focusClassName="tv-key-focus" style={{ flex: 1, background: '#dc2626' }}>
            <Delete size={20} />
          </TVFocusable>
          <TVFocusable onPress={() => doSearch(query)} className="tv-key" focusClassName="tv-key-focus" style={{ flex: 1, background: '#2563eb' }}>
            <Search size={20} />
          </TVFocusable>
        </div>
      </div>

      {/* Right: Results */}
      <div className="tv-search-results">
        {loading ? (
          <div className="tv-loading" style={{ minHeight: '40vh' }}>
            <div className="tv-spinner" />
            <p style={{ color: '#888' }}>Đang tìm kiếm...</p>
          </div>
        ) : searched && results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#888', fontSize: 20 }}>
            Không tìm thấy phim nào cho "{query}"
          </div>
        ) : results.length > 0 ? (
          <div className="tv-search-results-grid">
            {results.map((movie, idx) => (
              <TVMovieCard key={movie.slug} movie={movie} index={idx} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#555', fontSize: 20 }}>
            Sử dụng bàn phím bên trái để tìm kiếm phim
          </div>
        )}
      </div>
    </div>
  );
}
