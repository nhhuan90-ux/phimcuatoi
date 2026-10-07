const axios = require('axios');
async function testStreamforester() {
  const url = 'https://javsub.blog/phim-sex/co-giao-cuc-ky-nghiem-khac-nhung-gap-thang-hoc-tro-ran-an-hien-gio-thi-co-giao-bi-dit-lien-tuc.html';
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const cheerio = require('cheerio');
    const $ = cheerio.load(res.data);
    const playUrl = $('button.set-player-source').first().attr('data-source');
    console.log('Play URL:', playUrl);
    
    if (playUrl) {
      const pRes = await axios.get(playUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.blog/' } });
      const html = pRes.data;
      console.log('Streamforester HTML length:', html.length);
      console.log('Contains m3u8?', html.match(/\.m3u8/i) ? 'YES' : 'NO');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testStreamforester();
