const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavtifulResolution() {
  console.log('=== TESTING JAVTIFUL RESOLUTION ===');
  const sampleMovies = moviesData.javtiful.slice(0, 5);

  for (const m of sampleMovies) {
    const code = m.code || m.id;
    const upperId = code ? code.toUpperCase() : m.id;
    console.log(`\nTesting Movie ID: ${m.id} | Code: ${m.code} | Upper: ${upperId}`);

    try {
      const embedUrl = `https://upload18.org/play/index/${upperId}`;
      const res = await axios.get(embedUrl, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' }
      });
      const match = res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
      if (match) {
        const m3u8Url = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
        console.log('  [SUCCESS] Decoded HLS stream:', m3u8Url);

        // Test HLS fetch
        const hlsRes = await axios.get(m3u8Url, {
          timeout: 8000,
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://upload18.org/' }
        });
        console.log('  [SUCCESS] Stream fetch status:', hlsRes.status, 'First line:', hlsRes.data.split('\n')[0]);
      } else {
        console.log('  [FAIL] No m3u8 match in upload18 response!');
      }
    } catch (e) {
      console.error('  [FAIL] Error:', e.message);
    }
  }
}

testJavtifulResolution();
