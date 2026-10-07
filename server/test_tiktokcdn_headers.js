const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testTiktokcdnHeaders() {
  const m3u8Url = 'https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/1521468d906e1ee54179d7c7ac02f1634002/javhd-4002-playlist.m3u8';

  console.log('--- TEST 1: WITHOUT REFERER ---');
  try {
    const res1 = await axios.get(m3u8Url, { headers: { 'User-Agent': UA } });
    console.log('Test 1 Status:', res1.status);
  } catch (e) {
    console.log('Test 1 Error:', e.message, 'Status:', e.response?.status);
  }

  console.log('\n--- TEST 2: WITH javhdz.cam REFERER ---');
  try {
    const res2 = await axios.get(m3u8Url, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://javhdz.cam/',
        'Origin': 'https://javhdz.cam'
      }
    });
    console.log('[SUCCESS] Test 2 Status:', res2.status);
    console.log('Playlist snippet:\n', res2.data.slice(0, 300));
  } catch (e) {
    console.log('Test 2 Error:', e.message, 'Status:', e.response?.status);
  }

  console.log('\n--- TEST 3: WITH javhdz.fun REFERER ---');
  try {
    const res3 = await axios.get(m3u8Url, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://javhdz.fun/',
        'Origin': 'https://javhdz.fun'
      }
    });
    console.log('[SUCCESS] Test 3 Status:', res3.status);
  } catch (e) {
    console.log('Test 3 Error:', e.message, 'Status:', e.response?.status);
  }
}

testTiktokcdnHeaders();
