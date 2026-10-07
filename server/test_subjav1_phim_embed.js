const axios = require('axios');
const cheerio = require('cheerio');

async function testSubjav1PhimEmbed() {
  const link = 'https://subjav1.blog/phim/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu';
  console.log('=== TESTING SUBJAV1.BLOG/PHIM/ EMBED EXTRACTION ===');

  try {
    const res = await axios.get(link, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('Page status:', res.status, 'HTML length:', res.data.length);
    const $ = cheerio.load(res.data);

    // Extract ONLY the player element / wrapper!
    const playerHtml = $('#video, .videoWrapper, .entry-content').first().html() || '';
    console.log('Player element HTML length:', playerHtml.length);
    console.log('Player element snippet:\n', playerHtml.slice(0, 300));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSubjav1PhimEmbed();
