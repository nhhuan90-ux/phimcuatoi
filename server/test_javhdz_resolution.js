const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testJavhdzResolution() {
  console.log('=== TESTING JAVHDz RESOLUTION ON', domains.javhdz, '===');
  const sampleMovies = moviesData.javhdz.slice(0, 5);

  for (const m of sampleMovies) {
    console.log(`\nTesting Movie ID: ${m.id} | Title: "${m.title}"`);
    const link = m.link ? m.link.replace(/javhdz\.[a-z]+/i, domains.javhdz) : `https://${domains.javhdz}/phim-sex-${m.id}.html`;
    console.log('  Page URL:', link);

    try {
      const pageRes = await axios.get(link, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      console.log('  Page Status:', pageRes.status, 'Length:', pageRes.data.length);
      const match = pageRes.data.match(/window\.atob\(["']([^"']+)["']\)/);
      if (match) {
        const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
        console.log('  [SUCCESS] Decoded HLS URL:', decoded);

        // Test fetching master playlist through proxy format
        const hlsRes = await axios.get(decoded, {
          timeout: 8000,
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': `https://${domains.javhdz}/` }
        });
        console.log('  [SUCCESS] HLS Playlist status:', hlsRes.status, 'First line:', hlsRes.data.split('\n')[0]);
      } else {
        console.log('  [FAIL] No window.atob match found!');
      }
    } catch (e) {
      console.error('  [FAIL] Error:', e.message);
    }
  }
}

testJavhdzResolution();
