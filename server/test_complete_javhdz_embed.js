const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testCompleteJavhdzEmbed() {
  console.log('=== TESTING COMPLETE JAVHDZ EMBED HANDLER ===\n');

  const testIds = ['4003', '4001', 'goji-111', '3995'];

  for (const eid of testIds) {
    console.log(`--- Testing JAVHDz ID/Code: "${eid}" ---`);
    const movie = moviesData.javhdz.find(m => m.id === eid || m.code === eid);
    const code = movie?.code || eid;

    let iframeSrc = '';
    const candidateUrls = [
      `https://javgiga.net/${code}/`,
      movie?.link ? movie.link.replace(/javhdz\.[a-z]+/gi, 'javgiga.net') : null,
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
        let html = embedRes.data;
        html = html.replace(/window\.top\s*!==\s*window\.self/g, 'false');
        html = html.replace(/window\.self\s*!==\s*window\.top/g, 'false');
        html = html.replace(/top\.location\s*=/g, '/* top.location = */');
        html = html.replace('<head>', '<head><base href="https://morencius.com/">');
        console.log(`  [SUCCESS EMBED HTML] Status: ${embedRes.status}, Length: ${html.length}`);
      } catch (e) {
        console.log(`  [FAIL EMBED FETCH]: ${e.message}`);
      }
    } else {
      console.log('  [FALLBACK TO DIRECT HLS PLAYER FRAME]');
    }
  }
}

testCompleteJavhdzEmbed();
