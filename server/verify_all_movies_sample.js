const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function verifyAllMoviesSample() {
  console.log('=== COMPREHENSIVE VERIFICATION FOR ALL 4 VLXX-STYLE EMBED SOURCES ===\n');

  const sources = ['javhdz', 'javsub', 'javtiful', 'subjav'];

  for (const src of sources) {
    console.log(`========================================`);
    console.log(`SOURCE: ${src.toUpperCase()}`);
    console.log(`========================================`);

    const list = moviesData[src] || [];
    const sampleList = list.slice(0, 10);

    let successCount = 0;
    let failCount = 0;

    for (const item of sampleList) {
      try {
        const url = `https://phimcuatoi.vercel.app/api/video/${src}/${encodeURIComponent(item.id)}?_t=${Date.now()}`;
        const res = await axios.get(url, { timeout: 8000 });
        const data = res.data;

        if (data.url) {
          const iframeTargetUrl = data.url.startsWith('http') ? data.url : `https://phimcuatoi.vercel.app${data.url}`;
          const iframeRes = await axios.get(iframeTargetUrl, { timeout: 8000 });
          if (iframeRes.status === 200 && iframeRes.data.length > 300) {
            console.log(`  [OK] ID: "${item.id}" -> VLXX-Style Embed Player Frame OK (Length ${iframeRes.data.length})`);
            successCount++;
          } else {
            console.log(`  [FAIL] ID: "${item.id}" -> Embed status ${iframeRes.status}`);
            failCount++;
          }
        } else if (data.videoUrl) {
          const testHlsUrl = `https://phimcuatoi.vercel.app/api/proxy/hls?url=${encodeURIComponent(data.videoUrl)}`;
          const hlsRes = await axios.get(testHlsUrl, { timeout: 8000 });
          if (hlsRes.status === 200 && hlsRes.data.includes('#EXTM3U')) {
            console.log(`  [OK] ID: "${item.id}" -> HLS Master Playlist OK (Length ${hlsRes.data.length})`);
            successCount++;
          } else {
            console.log(`  [FAIL] ID: "${item.id}" -> HLS status ${hlsRes.status}`);
            failCount++;
          }
        } else {
          console.log(`  [FAIL] ID: "${item.id}" -> No videoUrl or url in response`);
          failCount++;
        }
      } catch (e) {
        console.log(`  [FAIL] ID: "${item.id}" -> Error: ${e.message}`);
        failCount++;
      }
    }

    console.log(`SUMMARY ${src.toUpperCase()}: ${successCount}/10 PASSED, ${failCount}/10 FAILED\n`);
  }
}

verifyAllMoviesSample();
