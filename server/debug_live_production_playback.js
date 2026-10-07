const axios = require('axios');

async function debugLiveProduction() {
  console.log('=== DEBUGGING LIVE PRODUCTION PLAYBACK ===\n');

  const sources = ['javhdz', 'javsub', 'javtiful', 'subjav'];

  for (const src of sources) {
    console.log(`--- Checking Source: ${src.toUpperCase()} ---`);
    try {
      // 1. Get 2 movies from /api/movies?source=...
      const res = await axios.get(`https://phimcuatoi.vercel.app/api/movies?source=${src}&limit=2`);
      const items = res.data.items || [];
      console.log(`  Total items found: ${res.data.total}`);

      if (items.length > 0) {
        const sample = items[0];
        console.log(`  Sample movie ID: "${sample.id}", Title: "${sample.title?.slice(0, 40)}"`);

        // 2. Fetch /api/video/:source/:id
        const videoRes = await axios.get(`https://phimcuatoi.vercel.app/api/video/${src}/${encodeURIComponent(sample.id)}`);
        console.log(`  /api/video/${src}/${sample.id} response:`, videoRes.data);

        // 3. If payload contains URL, test fetching that URL
        if (videoRes.data?.url) {
          const testUrl = videoRes.data.url.startsWith('/') ? `https://phimcuatoi.vercel.app${videoRes.data.url}` : videoRes.data.url;
          try {
            const iframeRes = await axios.get(testUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            console.log(`  Fetch iframe target status: ${iframeRes.status}, Length: ${iframeRes.data.length}`);
          } catch (err) {
            console.error(`  Fetch iframe target FAIL: ${err.message}`);
          }
        }
        if (videoRes.data?.videoUrl) {
          const testHls = videoRes.data.videoUrl.startsWith('/') ? `https://phimcuatoi.vercel.app${videoRes.data.videoUrl}` : videoRes.data.videoUrl;
          try {
            const hlsRes = await axios.get(testHls, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            console.log(`  Fetch HLS target status: ${hlsRes.status}, Length: ${hlsRes.data.length}`);
          } catch (err) {
            console.error(`  Fetch HLS target FAIL: ${err.message}`);
          }
        }
      }
    } catch (e) {
      console.error(`  Source ${src} API error:`, e.message);
    }
    console.log('\n');
  }
}

debugLiveProduction();
