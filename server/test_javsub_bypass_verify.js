const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavsubProxyEmbedEndpoint() {
  console.log('=== TESTING /api/embed/javsub ENPOINT ===');
  const movie = moviesData.javsub?.[0];
  console.log('Sample movie:', movie?.id);
  if (!movie) return;

  const targetUrl = movie.embedUrls?.[0]?.url;
  if (targetUrl) {
    const proxiedM3u8 = '/api/proxy/hls?url=' + encodeURIComponent(targetUrl.replace(/\/play\??.*/, '/master.m3u8'));
    const fullEmbedUrl = targetUrl + '&video=' + encodeURIComponent(proxiedM3u8);
    console.log('Full embed URL with video query param:', fullEmbedUrl);

    try {
      const res = await axios.get(fullEmbedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.blog/' }
      });
      console.log('[SUCCESS] Status:', res.status, 'HTML Length:', res.data.length);
      console.log('Contains BLOCKED! check?:', res.data.includes('BLOCKED!'));
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

testJavsubProxyEmbedEndpoint();
