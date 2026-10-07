const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testAbsoluteProxyUrl() {
  console.log('=== TESTING ABSOLUTE PROXY URL FOR JAVSUB ===');
  const movie = moviesData.javsub[0];
  const playUrl = movie.embedUrls[0].url;

  const cleanUrl = playUrl.replace(/&adTag=[^&]*/g, '').replace(/\?adTag=[^&]*/g, '');
  let m3u8Url = cleanUrl;
  if (cleanUrl.includes('/videos/') && cleanUrl.includes('/play')) {
    m3u8Url = cleanUrl.replace(/\/play\??.*/, '/master.m3u8');
  }

  // ABSOLUTE URL instead of relative path!
  const proxiedM3u8 = 'https://phimcuatoi.vercel.app/api/proxy/hls?url=' + encodeURIComponent(m3u8Url);
  const separator = cleanUrl.includes('?') ? '&' : '?';
  const targetUrl = cleanUrl + separator + 'video=' + encodeURIComponent(proxiedM3u8);

  console.log('Target embed fetch URL:', targetUrl);

  try {
    const res = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javsub.blog/' }
    });
    console.log('Embed fetch status:', res.status, 'Length:', res.data.length);
    console.log('Contains absolute Vercel proxy URL?:', res.data.includes('https://phimcuatoi.vercel.app/api/proxy/hls'));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testAbsoluteProxyUrl();
