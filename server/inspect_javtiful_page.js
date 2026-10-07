const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function inspectJavtifulPage() {
  console.log('=== INSPECTING JAVTIFUL PAGE HTML ===');
  const url = 'https://javtiful.blog/video/kidm-361';
  try {
    const res = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': UA } });
    console.log('Status:', res.status, 'HTML Length:', res.data.length);
    const $ = cheerio.load(res.data);

    console.log('\n--- IFRAMES ---');
    $('iframe').each((i, el) => {
      console.log(`Iframe #${i+1}: src="${$(el).attr('src')}" data-src="${$(el).attr('data-src')}"`);
    });

    console.log('\n--- VIDEOS / SOURCES ---');
    $('video, source').each((i, el) => {
      console.log(`Video/Source #${i+1}: src="${$(el).attr('src')}"`);
    });

    console.log('\n--- SCRIPTS WITH PLAYER OR EMBED ---');
    $('script').each((i, el) => {
      const text = $(el).html() || '';
      if (text.includes('player') || text.includes('embed') || text.includes('autoliker') || text.includes('iframe') || text.includes('video') || text.includes('hls')) {
        console.log(`Script #${i+1}:`, text.slice(0, 400));
      }
    });
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

inspectJavtifulPage();
