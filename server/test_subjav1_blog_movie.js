const axios = require('axios');
const cheerio = require('cheerio');

async function testSubjav1BlogMovie() {
  console.log('=== TESTING SUBJAV1.BLOG MOVIE PAGE ===');
  const url = 'https://subjav1.blog/phim/anh-trai-so-huong-du-em-gai-vu-to-luc-nua-dem';

  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('Page status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);

    console.log('Iframes:', $('iframe').map((i, el) => $(el).attr('src')).get());
    console.log('Video sources:', $('video source, video').map((i, el) => $(el).attr('src')).get());
    console.log('Data src / embed links:', $('[data-src], [data-link], [data-url]').map((i, el) => $(el).attr('data-src') || $(el).attr('data-link') || $(el).attr('data-url')).get());
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSubjav1BlogMovie();
