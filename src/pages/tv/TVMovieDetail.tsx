import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieDetail, searchMovies, getBaseName, normalizeName } from '../../services/api';
import { Play, Calendar, Clock, Globe, Film, RotateCcw } from 'lucide-react';
import { getHistoryItem } from '../../utils/history';
import TVFocusable from '../../components/tv/TVFocusable';
import TVMovieCard from '../../components/tv/TVMovieCard';

export default function TVMovieDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historyEp, setHistoryEp] = useState<any>(null);
  const [relatedSeasons, setRelatedSeasons] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetchMovieDetail(slug);
        setMovie(res.movie);
        const kw = getBaseName(res.movie.name) || getBaseName(res.movie.original_name);
        if (kw) {
          const sr = await searchMovies(kw);
          const bn = normalizeName(kw);
          setRelatedSeasons(sr.items.filter((i: any) =>
            i.slug !== res.movie.slug &&
            (normalizeName(getBaseName(i.name)) === bn || normalizeName(getBaseName(i.original_name)) === bn)
          ));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (slug) { const h = getHistoryItem(slug); if (h) setHistoryEp(h); }
    loadData();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) return <div className="tv-loading"><div className="tv-spinner" /><p style={{color:'#888',fontSize:18}}>Đang tải...</p></div>;

  if (!movie) return (
    <div style={{padding:'120px 48px',textAlign:'center'}}>
      <h1 style={{fontSize:32,fontWeight:800,marginBottom:16}}>Không tìm thấy phim</h1>
      <TVFocusable link="/tv" className="tv-btn tv-btn-primary" focusClassName="tv-btn-focus" autoFocus>Trang chủ</TVFocusable>
    </div>
  );

  const firstEp = movie.episodes?.[0]?.items?.[0];

  return (
    <div style={{paddingBottom:64}}>
      <div className="tv-detail-backdrop">
        <div style={{position:'absolute',inset:0,zIndex:1,background:'linear-gradient(to top,#0a0a0a,rgba(10,10,10,0.8) 40%,transparent),linear-gradient(to right,#0a0a0a,rgba(10,10,10,0.5) 50%,transparent)'}} />
        <img src={movie.poster_url||movie.thumb_url} alt={movie.name} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.4,filter:'blur(4px)'}} />
      </div>

      <div style={{position:'relative',zIndex:10,marginTop:'-40vh',padding:'0 48px',display:'flex',gap:40}}>
        <div className="tv-detail-poster">
          <img src={movie.thumb_url||movie.poster_url} alt={movie.name} style={{width:'100%',aspectRatio:'2/3',objectFit:'cover',display:'block'}} />
        </div>

        <div className="tv-detail-info">
          <h1 className="tv-detail-title">{movie.name}</h1>
          <h2 className="tv-detail-original">{movie.original_name}</h2>

          <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
            {movie.quality && <span style={{background:'#dc2626',color:'#fff',padding:'6px 16px',borderRadius:6,fontSize:14,fontWeight:700,textTransform:'uppercase'}}>{movie.quality}</span>}
            {movie.current_episode && <span style={{background:'#2b2b2b',color:'#dc2626',padding:'6px 16px',borderRadius:6,fontSize:14,fontWeight:700,border:'1px solid rgba(220,38,38,0.3)'}}>{movie.current_episode}</span>}
            {movie.language && <span style={{background:'#2b2b2b',color:'#ccc',padding:'6px 16px',borderRadius:6,fontSize:14,fontWeight:600}}>{movie.language}</span>}
          </div>

          <div style={{display:'flex',gap:16,marginBottom:32}}>
            {historyEp ? (
              <TVFocusable link={`/tv/xem-phim/${movie.slug}/${historyEp.epSlug}?id=0`} className="tv-btn tv-btn-primary" focusClassName="tv-btn-focus" autoFocus>
                <RotateCcw size={20} /> TIẾP TỤC: TẬP {historyEp.epName}
              </TVFocusable>
            ) : firstEp ? (
              <TVFocusable link={`/tv/xem-phim/${movie.slug}/${firstEp.slug}?id=0`} className="tv-btn tv-btn-primary" focusClassName="tv-btn-focus" autoFocus>
                <Play fill="currentColor" size={20} /> XEM PHIM
              </TVFocusable>
            ) : null}
          </div>

          <div className="tv-detail-meta">
            <div className="tv-detail-meta-item"><Calendar size={18} style={{color:'#888',marginTop:2}} /><div><div className="tv-detail-meta-label">Năm</div><div className="tv-detail-meta-value">{movie.category?.[3]?.list?.[0]?.name||'N/A'}</div></div></div>
            <div className="tv-detail-meta-item"><Clock size={18} style={{color:'#888',marginTop:2}} /><div><div className="tv-detail-meta-label">Thời lượng</div><div className="tv-detail-meta-value">{movie.time||'N/A'}</div></div></div>
            <div className="tv-detail-meta-item"><Globe size={18} style={{color:'#888',marginTop:2}} /><div><div className="tv-detail-meta-label">Quốc gia</div><div className="tv-detail-meta-value">{movie.category?.[4]?.list?.map((c:any)=>c.name).join(', ')||'N/A'}</div></div></div>
            <div className="tv-detail-meta-item"><Film size={18} style={{color:'#888',marginTop:2}} /><div><div className="tv-detail-meta-label">Thể loại</div><div className="tv-detail-meta-value">{movie.category?.[2]?.list?.map((g:any)=>g.name).join(', ')||'N/A'}</div></div></div>
          </div>

          <div style={{marginBottom:32}}>
            <h3 style={{fontSize:20,fontWeight:800,marginBottom:12,borderLeft:'4px solid #dc2626',paddingLeft:12}}>Nội dung phim</h3>
            <div style={{color:'#ccc',lineHeight:1.7,fontSize:16}} dangerouslySetInnerHTML={{__html:movie.description||'Đang cập nhật...'}} />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:32}}>
            <div><h3 style={{fontSize:18,fontWeight:800,marginBottom:8,borderLeft:'4px solid #dc2626',paddingLeft:12}}>Đạo diễn</h3><p style={{color:'#ccc'}}>{movie.director||'N/A'}</p></div>
            <div><h3 style={{fontSize:18,fontWeight:800,marginBottom:8,borderLeft:'4px solid #dc2626',paddingLeft:12}}>Diễn viên</h3><p style={{color:'#ccc'}}>{movie.casts||'N/A'}</p></div>
          </div>

          {movie.episodes?.length > 0 && (
            <div style={{marginTop:32}}>
              <h3 style={{fontSize:22,fontWeight:800,marginBottom:16,borderLeft:'4px solid #dc2626',paddingLeft:12}}>Danh sách tập</h3>
              {movie.episodes.map((server: any, idx: number) => (
                <div key={idx} style={{marginBottom:24}}>
                  <h4 style={{color:'#888',marginBottom:12,fontSize:14,fontWeight:600}}>{server.server_name}</h4>
                  <div className="tv-ep-grid">
                    {server.items.map((ep: any, epIdx: number) => (
                      <TVFocusable key={`${idx}-${ep.slug}-${epIdx}`} link={`/tv/xem-phim/${movie.slug}/${ep.slug}?id=${idx}`} className="tv-ep-btn" focusClassName="tv-ep-focus">{ep.name}</TVFocusable>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {relatedSeasons.length > 0 && (
            <div style={{marginTop:40}}>
              <h3 style={{fontSize:22,fontWeight:800,marginBottom:16,borderLeft:'4px solid #dc2626',paddingLeft:12}}>Các phần khác</h3>
              <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>{relatedSeasons.map(i=><TVMovieCard key={i.slug} movie={i} />)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
