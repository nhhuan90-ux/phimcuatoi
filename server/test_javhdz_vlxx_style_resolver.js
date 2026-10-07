const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavhdzVlxxStyleResolver() {
  console.log('=== TESTING VLXX-STYLE JAVHDZ EMBED RESOLVER ===\n');

  const sampleMovies = moviesData.javhdz.slice(0, 5);

  for (const m of sampleMovies) {
    const code = m.code || m.id;
    console.log(`Movie ID: ${m.id} | Code: ${code} | Title: "${m.title?.slice(0, 30)}..."`);

    let iframeSrc = '';
    const candidateUrls = [
      `https://javgiga.net/${code}/`,
      m.link ? m.link.replace(/javhdz\.[a-z]+/gi, 'javgiga.net') : null,
      `https://javhdz.site/${code}/`
    ].filter(Boolean);

    for (const url of candidateUrls) {
      try {
        const res = await axios.get(url, {
          timeout: 6000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);
        iframeSrc = $('iframe[src*="morencius"], iframe[src*="vidhide"], iframe[src*="play"]').first().attr('src') || '';
        if (iframeSrc) {
          console.log(`  [FOUND IFRAME] on ${url} -> ${iframeSrc}`);
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (iframeSrc) {
      try {
        const embedRes = await axios.get(iframeSrc, {
          timeout: 6000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javgiga.net/' }
        });
        console.log(`  [SUCCESS EMBED HTML] Status: ${embedRes.status}, Length: ${embedRes.data.length}`);
      } catch (e) {
        console.log(`  [FAIL EMBED HTML]: ${e.message}`);
      }
    } else {
      console.log('  [FAIL] No player iframe found for movie');
    }
  }
}

testJavhdzVlxxStyleResolver();
