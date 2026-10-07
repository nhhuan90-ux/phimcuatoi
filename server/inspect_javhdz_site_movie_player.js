const axios = require('axios');
const cheerio = require('cheerio');

async function inspectJavhdzSiteMoviePlayer() {
  const url = 'https://javhdz.site/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html';
  console.log('=== INSPECTING JAVHDZ.SITE MOVIE PLAYER CONTAINER ===');

  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    const $ = cheerio.load(res.data);

    console.log('#video html:', $('#video, .video-player, #player, .player').first().html() || 'NOT FOUND');
    console.log('Script tags containing atob / iframe / player / m3u8:');
    $('script').each((i, el) => {
      const text = $(el).html() || '';
      if (text.includes('atob') || text.includes('iframe') || text.includes('player') || text.includes('morencius') || text.includes('m3u8')) {
        console.log(`Script #${i}:\n`, text.slice(0, 300).replace(/\n/g, ' '));
      }
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

inspectJavhdzSiteMoviePlayer();
