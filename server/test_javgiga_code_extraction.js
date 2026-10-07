const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavgigaCodeExtraction() {
  console.log('=== TESTING JAVGIGA CODE EXTRACTION FROM MOVIE.IMG ===\n');

  const sampleMovies = moviesData.javhdz.slice(0, 10);

  for (const m of sampleMovies) {
    // Extract code from img e.g. "https://javhdz.fun/data/JUR-820-2026-01.jpg" -> "JUR-820"
    let code = '';
    if (m.img) {
      const match = m.img.match(/\/data\/([A-Za-z0-9-]+?)-\d{4}-\d{2}\.jpg/i) || m.img.match(/\/([A-Za-z0-9-]+)\.jpg/i);
      if (match) code = match[1].toLowerCase();
    }
    if (!code) code = m.id;

    console.log(`Movie ID: ${m.id} | Extracted Code: "${code}"`);

    const candidateUrls = [
      `https://javgiga.net/${code}/`,
      `https://javgiga.net/${code}-engsub/`,
      `https://javhdz.site/${code}.html`
    ];

    let iframeSrc = '';
    for (const url of candidateUrls) {
      try {
        const res = await axios.get(url, {
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);
        iframeSrc = $('iframe[src*="morencius"], iframe[src*="vidhide"], iframe[src*="play"]').first().attr('src') || '';
        if (iframeSrc) {
          console.log(`  [SUCCESS IFRAME] on ${url} -> ${iframeSrc}`);
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (!iframeSrc) {
      console.log(`  [FAIL] No iframe found for code "${code}"`);
    }
  }
}

testJavgigaCodeExtraction();
