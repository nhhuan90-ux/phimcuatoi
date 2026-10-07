const axios = require('axios');

async function testTiktokTsDirect() {
  const url = 'https://sf19-ads-format-sign.tiktokcdn.com/obj/ad-site-i18n/3cbdf558_3256_4d79_93e6_f4d765de09ea.ts?x-expires=1787918323&x-signature=sydxePP9PRvhyrxeH3AFaViJ4UE%3D';

  console.log('=== TESTING DIRECT TS FETCH FROM TIKTOK ===');

  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://javhdz.cam/'
      },
      responseType: 'arraybuffer'
    });
    console.log('Status:', res.status, 'Byte Length:', res.data.length);
  } catch (e) {
    console.error('Error:', e.message);
    if (e.response) {
      console.log('Response Status:', e.response.status, 'Data:', e.response.data.toString());
    }
  }
}

testTiktokTsDirect();
