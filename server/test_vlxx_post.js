const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testPost(body, referer) {
  try {
    console.log(`Testing POST body: "${body}" | Referer: "${referer}"`);
    const res = await axios.post('https://vlxx.net/ajax.php', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': referer || 'https://vlxx.net/'
      }
    });
    console.log('  Status:', res.status, 'Response:', JSON.stringify(res.data));
  } catch (e) {
    console.log('  Error:', e.message);
  }
}

async function run() {
  const ref = 'https://vlxx.net/video/phu-huynh-an-ui-co-giao-dang-buon-vi-chong-ngoai-tinh/3196/';
  await testPost('id=3196&server=1', ref);
  await testPost('id=3196', ref);
  await testPost('vlxx_server=1&id=3196', ref);
  await testPost('vlxx_server=1&id=3196&server=1', ref);
  await testPost('action=player&id=3196', ref);
}

run();
