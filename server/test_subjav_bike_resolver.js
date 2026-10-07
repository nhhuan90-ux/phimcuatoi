const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavBikeResolver(id) {
  console.log('=== TESTING SUBJAV.BIKE RESOLVER FOR ID:', id);

  // Method 1: Try coixx player API
  try {
    const res = await axios.get(`https://subjav.bike/wp-json/coixx/v1/player/?id=${id}&server=1`, { timeout: 5000, headers: { 'User-Agent': UA } });
    if (res.data?.success && res.data?.data) {
      const match = res.data.data.match(/file:\s*['"]([^'"]+)['"]/);
      if (match) {
        console.log('[SUCCESS Method 1] Video URL:', match[1]);
        return match[1];
      }
    }
  } catch (e) {}

  // Method 2: Fetch movie page on subjav.bike
  try {
    const pageRes = await axios.get(`https://subjav.bike/phim/${id}/`, { timeout: 5000, headers: { 'User-Agent': UA } });
    console.log('[Method 2] Page Status:', pageRes.status);
    const $ = cheerio.load(pageRes.data);
    const videoSrc = $('video source').attr('src') || $('iframe').attr('src');
    if (videoSrc) {
      console.log('[SUCCESS Method 2] Video SRC:', videoSrc);
      return videoSrc;
    }
  } catch (e) {}

  // Method 3: Search list for item with ID
  try {
    const listRes = await axios.get('https://subjav.bike/jav-vietsub/', { timeout: 5000, headers: { 'User-Agent': UA } });
    const $list = cheerio.load(listRes.data);
    const item = $list(`[data-id="${id}"]`).closest('.item');
    const href = item.find('a').attr('href');
    if (href) {
      console.log('[Method 3] Found movie href:', href);
      const mPage = await axios.get(href, { timeout: 5000, headers: { 'User-Agent': UA } });
      const $m = cheerio.load(mPage.data);
      const src = $m('video source').attr('src') || $m('iframe').attr('src') || $m('[data-video]').attr('data-video');
      console.log('[SUCCESS Method 3] Video SRC:', src);
      return src;
    }
  } catch (e) {}

  console.log('[FAIL] Could not resolve video for ID:', id);
  return null;
}

testSubjavBikeResolver('36125');
