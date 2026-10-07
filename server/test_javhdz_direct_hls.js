const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testJavhdzDirectHls() {
  console.log('=== TESTING JAVHDZ DIRECT HLS DECODING ===');
  const movie = moviesData.javhdz.find(m => m.id === '4003');
  console.log('Movie found:', movie?.title);

  const link = movie?.link ? movie.link.replace(/javhdz\.[a-z]+/gi, domains.javhdz) : `https://${domains.javhdz}/chi-gai-4003.html`;
  console.log('Fetching link:', link);

  try {
    const page = await axios.get(link, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('Page fetch status:', page.status, 'Length:', page.data.length);
    const atobMatch = page.data.match(/window\.atob\(["']([^"']+)["']\)/);
    if (atobMatch) {
      const decoded = Buffer.from(atobMatch[1], 'base64').toString('utf-8');
      console.log('  [SUCCESS JAVHDZ] HLS Stream URL:', decoded);
    } else {
      console.log('  [FAIL JAVHDZ] window.atob not found');
    }
  } catch (e) {
    console.error('  [FAIL JAVHDZ] Fetch error:', e.message);
  }
}

testJavhdzDirectHls();
