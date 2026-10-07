const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function diagnoseJavtiful() {
  console.log('=== DIAGNOSING JAVTIFUL PLAYBACK ===');
  const sampleMovies = moviesData.javtiful.slice(0, 5);
  for (const m of sampleMovies) {
    console.log(`\nTesting JavTiful Movie ID: ${m.id} | Code: ${m.code} | Title: "${m.title}"`);
    const upperId = (m.code || m.id).toUpperCase();
    console.log('  Using upperId:', upperId);

    // Step 1: test upload18.org
    try {
      const u18Url = `https://upload18.org/play/index/${upperId}`;
      const u18Res = await axios.get(u18Url, {
        timeout: 8000,
        headers: { 'User-Agent': UA, 'Referer': 'https://javtiful.fit/' }
      });
      console.log(`  Upload18 status: ${u18Res.status}, Length: ${u18Res.data.length}`);
      const match = u18Res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
      if (match) {
        const m3u8Url = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
        console.log('  [SUCCESS] Upload18 HLS stream decoded:', m3u8Url.slice(0, 80));

        // Test fetching the decoded HLS m3u8
        try {
          const streamRes = await axios.get(m3u8Url, {
            timeout: 8000,
            headers: { 'User-Agent': UA, 'Referer': 'https://upload18.org/' }
          });
          console.log('  [SUCCESS] Stream fetch status:', streamRes.status, 'First line:', streamRes.data.split('\n')[0]);
        } catch (errStream) {
          console.error('  [FAIL] Stream fetch error:', errStream.message);
        }
      } else {
        console.warn('  [FAIL] No m3u8 match on upload18!');
      }
    } catch (eU18) {
      console.error('  [FAIL] Upload18 Error:', eU18.message);
    }
  }
}

diagnoseJavtiful();
