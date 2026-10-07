const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function diagnoseJavsub() {
  console.log('=== DIAGNOSING JAVSUB PLAYBACK ===');
  const sampleMovies = moviesData.javsub.slice(0, 3);
  for (const m of sampleMovies) {
    console.log(`\nTesting JAVSub Movie ID: ${m.id} | Title: "${m.title}"`);
    try {
      const pageUrl = `https://javsub.blog/phim-sex/${m.id}`;
      const pageRes = await axios.get(pageUrl, { timeout: 8000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(pageRes.data);
      const buttons = $('button.set-player-source');
      console.log(`  Page status: ${pageRes.status}, Player buttons count: ${buttons.length}`);

      buttons.each((i, btn) => {
        const name = $(btn).attr('data-cdn-name');
        const src = $(btn).attr('data-source');
        console.log(`    Button #${i+1} [${name}]: ${src}`);
      });

      const firstSrc = buttons.first().attr('data-source');
      if (firstSrc) {
        let cleanUrl = firstSrc.replace(/&adTag=[^&]*/g, '').replace(/\?adTag=[^&]*/g, '');
        let m3u8Url = cleanUrl.replace(/\/play\??.*/, '/master.m3u8');
        console.log('  Clean embed URL:', cleanUrl);
        console.log('  Inferred m3u8 URL:', m3u8Url);

        // Test fetching inferred m3u8 playlist
        try {
          const m3u8Res = await axios.get(m3u8Url, {
            timeout: 8000,
            headers: { 'User-Agent': UA, 'Referer': 'https://javsub.blog/' }
          });
          console.log('  [SUCCESS] Inferred m3u8 Status:', m3u8Res.status, 'Snippet:\n', m3u8Res.data.slice(0, 200));
        } catch (eM3u8) {
          console.error('  [FAIL] Inferred m3u8 Error:', eM3u8.message);
        }

        // Test fetching clean embed URL
        try {
          const embedRes = await axios.get(cleanUrl, {
            timeout: 8000,
            headers: { 'User-Agent': UA, 'Referer': 'https://javsub.blog/' }
          });
          console.log('  [SUCCESS] Embed Page Status:', embedRes.status, 'Length:', embedRes.data.length);
        } catch (eEmbed) {
          console.error('  [FAIL] Embed Page Error:', eEmbed.message);
        }
      }
    } catch (e) {
      console.error('  Page Error:', e.message);
    }
  }
}

diagnoseJavsub();
