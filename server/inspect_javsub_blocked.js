const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function inspectJavsubBlocked() {
  console.log('=== INSPECTING JAVSUB STREAMFORESTER EMBED ===');
  const embedUrl = 'https://e.streamforester.name/videos/690854634daac3b7ce088f72/play?event_id=player-wrapper';
  try {
    const res = await axios.get(embedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': UA,
        'Referer': 'https://javsub.blog/'
      }
    });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
    console.log('HTML Snippet:\n', res.data.slice(0, 1500));

    const $ = cheerio.load(res.data);
    $('script').each((i, el) => {
      const src = $(el).attr('src');
      const text = $(el).html() || '';
      console.log(`Script #${i+1}: src="${src}" snippet="${text.slice(0, 200)}"`);
    });
  } catch (e) {
    console.error('Error fetching streamforester:', e.message);
  }
}

inspectJavsubBlocked();
