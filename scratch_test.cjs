const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://cors.x2u.in/' + 'https://javsub.blog/phim-sex/nu-nhan-vien-vu-bu-co-m-vuc-day-cua-hang-vintage-bang-cach-xxx-khach', {
  timeout: 15000
}).then(r => {
  console.log('cors.x2u.in Status:', r.status);
  console.log('Content Length:', r.data ? r.data.length : 0);
  const $ = cheerio.load(r.data);
  const sources = [];
  $('button.set-player-source').each((i, btn) => {
    sources.push({
      url: $(btn).attr('data-source'),
      label: $(btn).attr('data-cdn-name')
    });
  });
  console.log('Sources found:', sources);
}).catch(e => {
  console.error('cors.x2u.in failed:', e.message);
  if (e.response) {
    console.error('Status:', e.response.status);
  }
});
