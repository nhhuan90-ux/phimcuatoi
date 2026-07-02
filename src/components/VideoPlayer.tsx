import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  m3u8Url?: string;
  embedUrl?: string;
  title: string;
  playerKey: number;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  forceEmbed?: boolean;
}

export default function VideoPlayer({ m3u8Url, embedUrl, title, playerKey, initialTime = 0, onTimeUpdate, forceEmbed = false }: VideoPlayerProps) {
  var videoRef = useRef<HTMLVideoElement>(null);
  var outerRef = useRef<HTMLDivElement>(null);
  var hlsRef = useRef<any>(null);
  var h = typeof window !== 'undefined' ? Math.round(window.innerWidth / 1.777) : 300;
  var safeEmbed = embedUrl ? embedUrl.replace(/^http:\/\//i, 'https://') : '';

  // TV browser detection (old TVs have broken MediaSource despite isSupported=true)
  var isOldTv = false;
  try {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('tv') !== -1 || ua.indexOf('tizen') !== -1 || ua.indexOf('webos') !== -1 || ua.indexOf('smarttv') !== -1) isOldTv = true;
    var cm = ua.match(/chrome\/(\d+)/);
    if (cm && parseInt(cm[1], 10) < 80) isOldTv = true;
  } catch (e) {}

  // If it's an old TV and we have an embedUrl, use embed directly
  var preferEmbed = isOldTv && !!safeEmbed;

  var useIframe = forceEmbed || preferEmbed || (!m3u8Url && !!safeEmbed) || (!!safeEmbed && !(typeof Hls !== 'undefined' && Hls.isSupported()));
  var useVideo = !useIframe && !!m3u8Url;

  useEffect(function() {
    if (!useVideo || !videoRef.current) return;

    hlsRef.current = null;

    // Always set native src as baseline
    videoRef.current.src = m3u8Url!;

    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      try {
        var hls = new Hls({ maxBufferLength: 6, maxMaxBufferLength: 15, maxBufferSize: 10 * 1000 * 1000, enableWorker: false });
        hlsRef.current = hls;
        hls.loadSource(m3u8Url!);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, function() { videoRef.current!.play().catch(function() {}); });
        hls.on(Hls.Events.ERROR, function(_e: any, data: any) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
              case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
              default: hls.destroy(); hlsRef.current = null; break;
            }
          }
        });
      } catch (e) {}
    }

    return function() { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [m3u8Url, playerKey, useVideo]);

  useEffect(function() {
    var v = videoRef.current;
    if (!v || !useVideo) return;
    var sought = false;
    function onLoad() { if (!sought && initialTime > 0) { try { v!.currentTime = initialTime; } catch (e) {} sought = true; } }
    function onTime() { if (onTimeUpdate && v!.currentTime > 0) onTimeUpdate(v!.currentTime, v!.duration || 0); }
    v.addEventListener('loadedmetadata', onLoad);
    v.addEventListener('timeupdate', onTime);
    return function() { v!.removeEventListener('loadedmetadata', onLoad); v!.removeEventListener('timeupdate', onTime); };
  }, [initialTime, onTimeUpdate, useVideo]);

  function fs() {
    var el = outerRef.current || videoRef.current;
    if (!el) return;
    try {
      if ((document as any).fullscreenElement || (document as any).webkitFullscreenElement) {
        if ((document as any).exitFullscreen) (document as any).exitFullscreen();
        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      } else {
        if (el.requestFullscreen) el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
      }
    } catch (e) {}
  }

  if (useIframe) {
    return (
      <div ref={outerRef} style={{ width: '100%', height: h, display: 'flex', flexDirection: 'column', background: '#000' }}>
        <iframe key={'e-' + playerKey} src={safeEmbed} style={{ display: 'block', width: '100%', flex: '1 1 auto', border: 'none', minHeight: 0 }}
          allowFullScreen allow="autoplay; fullscreen; encrypted-media" title={title}></iframe>
        <div style={{ background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', flexShrink: 0 }}>
          <span style={{ color: '#aaa', fontSize: 13 }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={fs} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 14, cursor: 'pointer', padding: '8px 16px', borderRadius: 6 }}>⛶ Toàn màn hình</button>
            <a href={safeEmbed} target="_blank" rel="noopener noreferrer" style={{ background: '#e94560', border: 'none', color: '#fff', fontSize: 14, padding: '8px 16px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>Mở tab mới</a>
          </div>
        </div>
      </div>
    );
  }

  if (useVideo) {
    return (
      <div ref={outerRef} style={{ width: '100%', height: h }}>
        <video ref={videoRef} controls autoPlay playsInline title={title} style={{ display: 'block', width: '100%', height: '100%', background: '#000' }}></video>
      </div>
    );
  }

  var fb = safeEmbed || (m3u8Url ? 'https://player.phimapi.com/player/?url=' + encodeURIComponent(m3u8Url) : '');
  return (
    <div ref={outerRef} style={{ width: '100%', height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎬</div>
        {fb ? <a href={fb} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 32px', background: '#dc2626', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 700, display: 'inline-block' }}>▶️ Xem Phim Ngay</a>
        : <p style={{ color: '#f87171' }}>Không có nguồn phát.</p>}
      </div>
    </div>
  );
}