const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavhdzFallbackResolver() {
  console.log('=== TESTING JAVHDZ FALLBACK RESOLVER ===');
  const sampleMovie = moviesData.javhdz[0]; // 4003

  const candidateDomains = ['javhdz.site', 'javhdz.fit', 'javhdz.cam'];

  for (const domain of candidateDomains) {
    console.log(`\nTrying domain: ${domain}`);
    try {
      const link = sampleMovie.link ? sampleMovie.link.replace(/javhdz\.[a-z]+/gi, domain) : `https://${domain}/chi-gai-${sampleMovie.id}.html`;
      const res = await axios.get(link, {
        timeout: 7000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      console.log(`  Page status: ${res.status}, Length: ${res.data.length}`);

      const atobMatch = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
      if (atobMatch) {
        const decoded = Buffer.from(atobMatch[1], 'base64').toString('utf-8');
        console.log('  [SUCCESS] Decoded HLS URL:', decoded);
      } else {
        const $ = cheerio.load(res.data);
        const iframes = $('iframe').map((i, el) => $(el).attr('src')).get();
        console.log('  Iframes:', iframes);
      }
    } catch (e) {
      console.log(`  Fail on ${domain}:`, e.message);
    }
  }
}

testJavhdzFallbackResolver();
