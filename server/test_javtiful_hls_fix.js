const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavtifulHlsFix() {
  console.log('=== TESTING JAVTIFUL NATIVE HLS EXTRACTION ===');
  const sample = moviesData.javtiful.slice(0, 3);

  for (const m of sample) {
    const code = m.code || m.id;
    const upperId = code ? code.toUpperCase() : m.id;
    console.log(`\nTesting JavTiful ID: ${m.id} | Code: ${code} | Upper: ${upperId}`);

    try {
      const embedUrl = `https://upload18.org/play/index/${upperId}`;
      const res = await axios.get(embedUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://javtiful.fit/'
        }
      });

      const match = res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
      if (match) {
        const rawUrl = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
        console.log('  [SUCCESS] Extracted m3u8:', rawUrl);

        // Fetch m3u8 playlist with Referer https://upload18.org/
        const m3u8Res = await axios.get(rawUrl, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://upload18.org/'
          }
        });
        console.log('  [SUCCESS] HLS Playlist fetch status:', m3u8Res.status, 'First line:', m3u8Res.data.split('\n')[0]);
      } else {
        console.log('  [FAIL] Could not match m3u8 in upload18 HTML');
      }
    } catch (e) {
      console.error('  [FAIL] Error:', e.message);
    }
  }
}

testJavtifulHlsFix();
