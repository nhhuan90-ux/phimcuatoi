const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function resolveJavtiful(id) {
  console.log(`\nResolving JavTiful for ID: ${id}`);
  const upperId = id.toUpperCase();
  
  // Step 1: Try upload18.org with upperId
  try {
    const u18Res = await axios.get(`https://upload18.org/play/index/${upperId}`, {
      timeout: 8000,
      headers: { 'User-Agent': UA, 'Referer': 'https://javtiful.blog/' }
    });
    const match = u18Res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
    if (match) {
      const m3u8Url = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
      console.log(`  [SUCCESS] Found HLS stream from upload18.org for ${upperId}:`, m3u8Url.slice(0, 70) + '...');
      return { videoUrl: '/api/proxy/hls?url=' + encodeURIComponent(m3u8Url), type: 'hls' };
    }
  } catch (e) {}

  // Step 2: Try scraping javtiful.blog/video/${id} for iframe
  try {
    const pageRes = await axios.get(`https://javtiful.blog/video/${id}`, { timeout: 8000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(pageRes.data);
    const iframe = $('iframe').first().attr('src') || $('iframe').first().attr('data-src');
    if (iframe) {
      console.log(`  [SUCCESS] Found iframe from javtiful.blog for ${id}:`, iframe);
      return { url: iframe, type: 'iframe' };
    }
  } catch (e) {}

  console.log(`  [FALLBACK] Using embed proxy for ${id}`);
  return { url: `/api/embed/javtiful/${id}`, type: 'iframe' };
}

async function run() {
  await resolveJavtiful('hunt-951');
  await resolveJavtiful('fns-239');
  await resolveJavtiful('kidm-361');
  await resolveJavtiful('mgold-054');
}

run();
