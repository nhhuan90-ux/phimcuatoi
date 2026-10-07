const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testVlxxPhd() {
  console.log('=== TESTING VLXX.PHD ===');
  try {
    const res = await axios.get('https://vlxx.phd/', { timeout: 8000, headers: { 'User-Agent': UA } });
    console.log('[SUCCESS] vlxx.phd Status:', res.status, 'HTML Length:', res.data.length);
    const $ = cheerio.load(res.data);
    const count = $('.video-item').length;
    console.log(`  Parsed ${count} videos from vlxx.phd homepage!`);

    // Test ajax.php on vlxx.phd
    const ajaxRes = await axios.post('https://vlxx.phd/ajax.php', 'vlxx_server=1&id=3196&server=1', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://vlxx.phd/'
      },
      timeout: 8000
    });
    console.log('[SUCCESS] vlxx.phd AJAX Status:', ajaxRes.status);
    console.log('  Response:', JSON.stringify(ajaxRes.data).slice(0, 300));
  } catch (e) {
    console.error('vlxx.phd error:', e.message);
  }
}

testVlxxPhd();
