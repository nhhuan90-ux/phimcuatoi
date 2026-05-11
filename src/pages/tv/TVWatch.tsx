import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMovieDetail } from '../../services/api';
import VideoPlayer from '../../components/VideoPlayer';
import { getHistoryItem, saveHistoryItem } from '../../utils/history';
import TVFocusable from '../../components/tv/TVFocusable';
import { ArrowLeft, RefreshCw, Server } from 'lucide-react';

export default function TVWatch() {
  const { slug, episode } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [movie, setMovie] = useState<any>(null);
  const [currentEpData, setCurrentEpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const overlayTimer = useRef<any>(null);
  const lastSavedTime = useRef(0);

  // Auto-hide overlay after 5 seconds
  const resetOverlayTimer = useCallback(() => {
    setShowOverlay(true);
    if (overlayTimer.current) clearTimeout(overlayTimer.current);
    overlayTimer.current = setTimeout(() => setShowOverlay(false), 5000);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      resetOverlayTimer();
      if (e.key === 'Backspace' || e.key === 'GoBack' || e.keyCode === 4) {
        e.preventDefault();
        navigate(`/tv/phim/${slug}`);
      }
    };
    window.addEventListener('keydown', handleKey);
    resetOverlayTimer();
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
    };
  }, [resetOverlayTimer, navigate, slug]);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;
      setLoading(true);
      setErrorInfo(null);
      try {
        const res = await fetchMovieDetail(slug);
        if (!res?.movie) { setErrorInfo('Không tải được phim.'); setLoading(false); return; }
        setMovie(res.movie);

        let found = false;
        const srvId = searchParams.get('id');
        const defSrv = srvId ? parseInt(srvId, 10) : -1;

        if (res.movie.episodes?.length) {
          if (defSrv >= 0 && defSrv < res.movie.episodes.length) {
            const srv = res.movie.episodes[defSrv];
            const ep = srv.items?.find((i: any) => i.slug === episode);
            if (ep) { setCurrentEpData({ ...ep, currentServerIdx: defSrv }); found = true; }
          }
          if (!found) {
            for (let i = 0; i < res.movie.episodes.length; i++) {
              const ep = res.movie.episodes[i].items?.find((item: any) => item.slug === episode);
              if (ep) { setCurrentEpData({ ...ep, currentServerIdx: i }); found = true; break; }
            }
          }
        }

        if (!found) {
          const first = res.movie.episodes?.find((s: any) => s.items?.length > 0);
          if (first?.items[0]) navigate(`/tv/xem-phim/${slug}/${first.items[0].slug}?id=0`, { replace: true });
          else setErrorInfo('Không tìm thấy tập phim.');
        }
      } catch (e: any) { setErrorInfo(`Lỗi: ${e.message}`); }
      finally { setLoading(false); }
    };

    if (slug && episode) {
      const h = getHistoryItem(slug);
      if (h?.epSlug === episode && h.timePlayed > 5) setInitialTime(h.timePlayed);
      else setInitialTime(0);
    }
    loadData();
  }, [slug, episode, navigate, searchParams]);

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (Math.abs(currentTime - lastSavedTime.current) > 5 && movie && currentEpData) {
      saveHistoryItem({ movieSlug: movie.slug, movieName: movie.name, posterUrl: movie.thumb_url || movie.poster_url, epSlug: currentEpData.slug, epName: currentEpData.name, timePlayed: currentTime, duration, updatedAt: Date.now() });
      lastSavedTime.current = currentTime;
    }
  }, [movie, currentEpData]);

  useEffect(() => {
    if (movie && currentEpData) {
      saveHistoryItem({ movieSlug: movie.slug, movieName: movie.name, posterUrl: movie.thumb_url || movie.poster_url, epSlug: currentEpData.slug, epName: currentEpData.name, timePlayed: initialTime, duration: 0, updatedAt: Date.now() });
    }
  }, [currentEpData]);

  if (loading) return <div className="tv-loading"><div className="tv-spinner" /><p style={{color:'#888',fontSize:18}}>Đang tải phim...</p></div>;

  if (errorInfo || !movie || !currentEpData) return (
    <div style={{padding:'120px 48px',textAlign:'center'}}>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:16,color:'#dc2626'}}>Lỗi</h1>
      <p style={{color:'#888',marginBottom:24}}>{errorInfo||'Không tìm thấy tập phim.'}</p>
      <TVFocusable onPress={()=>window.location.reload()} className="tv-btn tv-btn-primary" focusClassName="tv-btn-focus" autoFocus>Thử lại</TVFocusable>
    </div>
  );

  return (
    <div className="tv-player-container">
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        <VideoPlayer m3u8Url={currentEpData.m3u8} embedUrl={currentEpData.embed} title={movie.name} playerKey={playerKey} initialTime={initialTime} onTimeUpdate={handleTimeUpdate} />
      </div>

      {/* Overlay */}
      <div className={`tv-player-overlay ${showOverlay ? 'visible' : ''}`} onClick={resetOverlayTimer}>
        <div>
          <div className="tv-player-title">{movie.name} - Tập {currentEpData.name}</div>
          <div style={{color:'#888',fontSize:14,marginTop:4}}>{movie.original_name}</div>
        </div>

        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',alignItems:'center'}}>
          <TVFocusable link={`/tv/phim/${movie.slug}`} className="tv-btn tv-btn-secondary" focusClassName="tv-btn-focus" style={{fontSize:14,padding:'10px 20px'}}>
            <ArrowLeft size={16} /> Quay lại
          </TVFocusable>
          <TVFocusable onPress={()=>setPlayerKey(p=>p+1)} className="tv-btn tv-btn-secondary" focusClassName="tv-btn-focus" style={{fontSize:14,padding:'10px 20px'}}>
            <RefreshCw size={16} /> Tải lại
          </TVFocusable>

          {/* Server buttons */}
          {movie.episodes?.map((srv: any, idx: number) => {
            const isActive = currentEpData?.currentServerIdx === idx;
            const epInSrv = srv.items.find((i: any) => i.slug === episode) || srv.items[0];
            return (
              <TVFocusable
                key={idx}
                link={`/tv/xem-phim/${movie.slug}/${epInSrv.slug}?id=${idx}`}
                className={`tv-server-btn ${isActive?'active':''}`}
                focusClassName="tv-ep-focus"
                style={{fontSize:13,padding:'8px 16px'}}
              >
                <Server size={14} style={{display:'inline',marginRight:4}} />
                Server {idx+1}
              </TVFocusable>
            );
          })}
        </div>

        {/* Episode row */}
        {movie.episodes?.[currentEpData.currentServerIdx]?.items?.length > 1 && (
          <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',maxHeight:60,overflow:'hidden'}}>
            {movie.episodes[currentEpData.currentServerIdx].items.map((ep: any, i: number) => (
              <TVFocusable key={`${ep.slug}-${i}`} link={`/tv/xem-phim/${movie.slug}/${ep.slug}?id=${currentEpData.currentServerIdx}`}
                className={`tv-ep-btn ${ep.slug===episode?'active':''}`} focusClassName="tv-ep-focus"
                style={{padding:'6px 12px',fontSize:13,minWidth:48}}>
                {ep.name}
              </TVFocusable>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
