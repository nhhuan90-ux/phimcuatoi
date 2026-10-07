const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testJavtiful404Details(id) {
  console.log(`\n=== TESTING JAVTIFUL 404 DETAILS FOR ID: ${id} ===`);
  const movieUrl = `https://javtiful.blog/video/${id}`;
  try {
    const res = await axios.get(movieUrl, { timeout: 10000, headers: { 'User-Agent': UA } });
    console.log(`Movie page ${movieUrl} -> Status: ${res.status}, Length: ${res.data.length}`);
    const $ = cheerio.load(res.data);
    const iframe = $('iframe').first().attr('src') || $('iframe').first().attr('data-src');
    console.log('Extracted iframe:', iframe);

    // Test uppercase upload18.org/play/index/ID
    const upperId = id.toUpperCase();
    const uploadUrl = `https://upload18.org/play/index/${upperId}`;
    try {
      const upRes = await axios.get(uploadUrl, { timeout: 10000, headers: { 'User-Agent': UA, 'Referer': 'https://javtiful.blog/' } });
      console.log(`Upload18 ${uploadUrl} -> Status: ${upRes.status}, Length: ${upRes.data.length}`);
      const match = upRes.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
      console.log('  m3u8 match:', match ? match[1].slice(0, 80) : 'none');
    } catch (e) {
      console.log(`Upload18 ${uploadUrl} -> Error: ${e.response?.status || e.message}`);
    }

  } catch (e) {
    console.log(`Movie page ${movieUrl} -> Error: ${e.response?.status || e.message}`);
  }
}

async function run() {
  await testJavtiful404Details('kidm-361');
  await testJavtiful404Details('mgold-054');
  await testJavtiful404Details('hunt-951');
  await testJavtiful404Details('fns-239');
}

run();
