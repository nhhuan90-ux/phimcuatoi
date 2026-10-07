const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function debugJavsub() {
  console.log('=== DEBUGGING JAVSUB STUCK LOADING ===');
  const movie = moviesData.javsub?.[0];
  console.log('Sample movie:', movie?.id, movie?.title);
  if (!movie) return;

  const pageUrl = `https://javsub.blog/phim-sex/${movie.id}`;
  try {
    const res = await axios.get(pageUrl, { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const buttons = $('button.set-player-source');
    console.log('Found player buttons:', buttons.length);
    buttons.each((i, btn) => {
      console.log(`  Button #${i+1}: name="${$(btn).attr('data-cdn-name')}" src="${$(btn).attr('data-source')}"`);
    });

    // Test first button data-source
    const firstSrc = $(buttons[0]).attr('data-source');
    if (firstSrc) {
      console.log('\nTesting embed page:', firstSrc);
      const embedRes = await axios.get(firstSrc, { timeout: 10000, headers: { 'User-Agent': UA, 'Referer': 'https://javsub.blog/' } });
      console.log('Embed HTML Status:', embedRes.status, 'Length:', embedRes.data.length);
      console.log('Embed HTML snippet:', embedRes.data.slice(0, 1500));

      // Test master.m3u8 replacement vs direct iframe
      const m3u8Url = firstSrc.replace(/\/play\??.*/, '/master.m3u8');
      console.log('\nTesting constructed m3u8Url:', m3u8Url);
      try {
        const m3u8Res = await axios.get(m3u8Url, { timeout: 8000, headers: { 'User-Agent': UA, 'Referer': 'https://javsub.blog/' } });
        console.log('m3u8 Status:', m3u8Res.status, 'Body:', m3u8Res.data.slice(0, 300));
      } catch (e) {
        console.error('m3u8 Fetch Error:', e.message, 'Status:', e.response?.status);
      }
    }
  } catch (e) {
    console.error('JavSub page error:', e.message);
  }
}

async function debugJavtiful() {
  console.log('\n=== DEBUGGING JAVTIFUL 403 ERROR ===');
  const movie = moviesData.javtiful?.[0];
  console.log('Sample movie:', movie?.id, movie?.title, movie?.link);
  if (!movie) return;

  try {
    const res = await axios.get(movie.link, { timeout: 10000, headers: { 'User-Agent': UA } });
    console.log('Javtiful page Status:', res.status);
    const $ = cheerio.load(res.data);
    const iframeSrc = $('iframe').first().attr('src');
    console.log('Extracted iframeSrc:', iframeSrc);

    if (iframeSrc) {
      console.log('Testing fetching iframeSrc directly:');
      const referersToTest = [
        movie.link,
        'https://javtiful.blog/',
        'https://autolikerapp.net/'
      ];
      for (const ref of referersToTest) {
        try {
          const iframeRes = await axios.get(iframeSrc, {
            timeout: 8000,
            headers: {
              'User-Agent': UA,
              'Referer': ref,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5'
            }
          });
          console.log(`  Referer "${ref}" -> [SUCCESS] Status: ${iframeRes.status}, Length: ${iframeRes.data.length}`);
        } catch (e) {
          console.log(`  Referer "${ref}" -> [FAIL] Status: ${e.response?.status || e.message}`);
        }
      }
    }
  } catch (e) {
    console.error('Javtiful page error:', e.message);
  }
}

async function run() {
  await debugJavsub();
  await debugJavtiful();
}

run();
