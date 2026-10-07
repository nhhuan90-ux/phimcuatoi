const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testVlxxDetailed() {
  console.log('=== TESTING VLXX DETAILED ===');
  const movie = moviesData.vlxx?.[0];
  console.log('Sample movie:', movie);
  if (!movie) return;

  try {
    const ajaxRes = await axios.post('https://vlxx.net/ajax.php', `vlxx_server=1&id=${movie.id}&server=1`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://vlxx.net/'
      },
      timeout: 8000
    });
    console.log('VLXX AJAX status:', ajaxRes.status, 'Response:', JSON.stringify(ajaxRes.data));

    const data = typeof ajaxRes.data === 'string' ? JSON.parse(ajaxRes.data) : ajaxRes.data;
    if (data.player) {
      const $ = cheerio.load(data.player);
      const iframeUrl = $('iframe').first().attr('src');
      console.log('  Extracted iframeUrl:', iframeUrl);
      if (iframeUrl) {
        const iframeRes = await axios.get(iframeUrl, {
          headers: { 'User-Agent': UA, 'Referer': 'https://vlxx.net/' },
          timeout: 8000
        });
        console.log('  Iframe HTML status:', iframeRes.status, 'Length:', iframeRes.data.length);
        const match = iframeRes.data.match(/window\.__SRC\s*=\s*([^;]+);/);
        console.log('  window.__SRC match:', match ? match[1].slice(0, 100) : 'none');
      }
    }
  } catch (e) {
    console.error('VLXX error:', e.message);
  }
}

testVlxxDetailed();
