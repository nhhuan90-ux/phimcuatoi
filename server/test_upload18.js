const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testUpload18(id) {
  const url = `https://upload18.org/play/index/${id}`;
  try {
    const res = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': UA } });
    console.log(`\nTesting ${url}: Status ${res.status}, Length ${res.data.length}`);
    const $ = cheerio.load(res.data);
    const m3u8 = res.data.match(/(https?:[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
    const iframe = $('iframe').first().attr('src');
    const video = $('video, source').first().attr('src');
    console.log('  m3u8 match:', m3u8 ? m3u8[1] : 'none');
    console.log('  iframe:', iframe || 'none');
    console.log('  video src:', video || 'none');
  } catch (e) {
    console.error(`Error for ${id}:`, e.message);
  }
}

async function run() {
  await testUpload18('kidm-361');
  await testUpload18('mgold-054');
  await testUpload18('snos-231');
}

run();
