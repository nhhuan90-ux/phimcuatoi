const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testJavhdzPlayback() {
  console.log('=== TESTING JAVHDZ PLAYBACK FOR SAMPLE MOVIES ===');
  console.log('Active javhdz domain in domains.json:', domains.javhdz);

  const sampleMovies = moviesData.javhdz.slice(0, 5);
  for (const m of sampleMovies) {
    console.log(`\nTesting Movie ID: ${m.id} | Title: "${m.title}"`);
    console.log('  Original link:', m.link);
    const targetLink = m.link ? m.link.replace(/javhdz\.[a-z]+/gi, domains.javhdz) : `https://${domains.javhdz}/chi-gai-${m.id}.html`;
    console.log('  Target link:', targetLink);

    try {
      const res = await axios.get(targetLink, { timeout: 8000, headers: { 'User-Agent': UA } });
      console.log('  Page Status:', res.status, 'Length:', res.data.length);
      const match = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
      if (match) {
        const decodedUrl = Buffer.from(match[1], 'base64').toString('utf-8');
        console.log('  [SUCCESS] Decoded Video URL:', decodedUrl);

        // Test fetching the decoded stream via proxy
        const proxiedUrl = `https://p16-sg.tiktokcdn.top/...`; // test actual HLS playlist fetch
        try {
          const hlsRes = await axios.get(decodedUrl, { timeout: 8000, headers: { 'User-Agent': UA } });
          console.log('  [SUCCESS] HLS Playlist Status:', hlsRes.status, 'First line:', hlsRes.data.split('\n')[0]);
        } catch (errHls) {
          console.error('  [FAIL] HLS Playlist Fetch Error:', errHls.message);
        }
      } else {
        console.error('  [FAIL] No window.atob base64 string found on page!');
      }
    } catch (e) {
      console.error('  [FAIL] Page Fetch Error:', e.message);
    }
  }
}

testJavhdzPlayback();
