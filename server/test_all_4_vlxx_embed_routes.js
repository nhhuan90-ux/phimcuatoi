const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testAll4VlxxEmbedRoutes() {
  console.log('=== TESTING ALL 4 VLXX-STYLE EMBED ROUTES ===\n');

  // Helper to generate clean player frame HTML
  function buildCleanHlsPlayerHtml(proxyUrl) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}video{width:100%;height:100vh;display:block;object-fit:contain}</style></head><body><video id="player" controls autoplay playsinline></video><script>var v=document.getElementById('player');if(typeof Hls!=='undefined'&&Hls.isSupported()){var h=new Hls({maxBufferLength:30});h.loadSource(${JSON.stringify(proxyUrl)});h.attachMedia(v);h.on(Hls.Events.MANIFEST_PARSED,function(){v.play().catch(function(){})});h.on(Hls.Events.ERROR,function(e,d){if(d.fatal){if(d.type===Hls.ErrorTypes.NETWORK_ERROR)h.startLoad();else if(d.type===Hls.ErrorTypes.MEDIA_ERROR)h.recoverMediaError();else h.destroy()}})}else if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=${JSON.stringify(proxyUrl)};v.play().catch(function(){})}</script></body></html>`;
  }

  // 1. JAVHDZ
  console.log('--- 1. JAVHDZ EMBED ---');
  const javhdzId = '4003';
  const javhdzM3u8 = `https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-${javhdzId}-playlist.m3u8`;
  const javhdzProxy = '/api/proxy/hls?url=' + encodeURIComponent(javhdzM3u8);
  const javhdzHtml = buildCleanHlsPlayerHtml(javhdzProxy);
  console.log('  [JAVHDz OK] HTML Length:', javhdzHtml.length);

  // 2. SUBJAV
  console.log('\n--- 2. SUBJAV EMBED ---');
  const subjavMovie = moviesData.subjav[0];
  let slug = subjavMovie.id;
  if (subjavMovie.link) {
    const match = subjavMovie.link.match(/subjav\.[a-z]+\/([^/]+)/);
    if (match) slug = match[1];
  }
  const subjavM3u8 = `https://subjav1.blog/storage/m3u8/${slug}/index.m3u8`;
  const subjavProxy = '/api/proxy/hls?url=' + encodeURIComponent(subjavM3u8);
  const subjavHtml = buildCleanHlsPlayerHtml(subjavProxy);
  console.log('  [SubJAV OK] HTML Length:', subjavHtml.length);

  // 3. JAVTIFUL
  console.log('\n--- 3. JAVTIFUL EMBED ---');
  try {
    const javtifulMovie = moviesData.javtiful[0];
    const code = (javtifulMovie.code || javtifulMovie.id).toUpperCase();
    const embedUrl = `https://upload18.org/play/index/${code}`;
    const res = await axios.get(embedUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' } });
    const match = res.data.match(/"m3u8"\s*:\s*"([^"]+)"/i) || res.data.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
    if (match) {
      const rawUrl = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
      const javtifulProxy = '/api/proxy/hls?url=' + encodeURIComponent(rawUrl);
      const javtifulHtml = buildCleanHlsPlayerHtml(javtifulProxy);
      console.log('  [JavTiful OK] HTML Length:', javtifulHtml.length);
    }
  } catch (e) { console.error('  JavTiful err:', e.message); }

  // 4. JAVSUB
  console.log('\n--- 4. JAVSUB EMBED ---');
  try {
    const javsubMovie = moviesData.javsub[0];
    const playUrl = javsubMovie.embedUrls[0].url;
    const cleanUrl = playUrl.replace(/&adTag=[^&]*/g, '').replace(/\?adTag=[^&]*/g, '');
    let m3u8Url = cleanUrl;
    if (cleanUrl.includes('/videos/') && cleanUrl.includes('/play')) {
      m3u8Url = cleanUrl.replace(/\/play\??.*/, '/master.m3u8');
    }
    const proxiedM3u8 = 'https://phimcuatoi.vercel.app/api/proxy/hls?url=' + encodeURIComponent(m3u8Url);
    const targetUrl = cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'video=' + encodeURIComponent(proxiedM3u8);
    const res = await axios.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.blog/' } });
    let html = res.data.replace(/if\s*\(!o\.iw\)[^;]*;/g, '/* bypass */');
    html = html.replace(/window\.top\s*!==\s*window\.self/g, 'false');
    html = html.replace(/window\.self\s*!==\s*window\.top/g, 'false');
    console.log('  [JAVSub OK] HTML Length:', html.length);
  } catch (e) { console.error('  JAVSub err:', e.message); }
}

testAll4VlxxEmbedRoutes();
