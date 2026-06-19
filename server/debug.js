const axios = require('axios');
const cheerio = require('cheerio');
async function t() {
  // PhimXYZ: check thumbnail actual attr
  const r = await axios.get('https://i.phimxyz.blog/the-loai/jav', {timeout:10000, headers:{'User-Agent':'Mozilla/5.0'}});
  const $ = cheerio.load(r.data);
  $('a[href*="/phim/"]').each((i, el) => {
    if (i > 3) return false;
    const href = $(el).attr('href');
    const img = $(el).find('img');
    console.log('href:', href);
    console.log('  src:', img.attr('src'));
    console.log('  data-src:', img.attr('data-src'));
    console.log('  alt:', img.attr('alt'));
    console.log('---');
  });

  // JAVSub: test video fetch
  const r2 = await axios.get('https://javsub.blog/', {timeout:10000, headers:{'User-Agent':'Mozilla/5.0'}});
  const $2 = cheerio.load(r2.data);
  const first = $2('.item').first();
  const href = first.find('.item__thumbnail').attr('href');
  const match = href.match(/phim-sex\/([^/]+)$/);
  if (match) {
    console.log('JAVSub first slug:', match[1]);
    const r3 = await axios.get(href, {timeout:10000, headers:{'User-Agent':'Mozilla/5.0'}});
    const $3 = cheerio.load(r3.data);
    $3('button.set-player-source').each((i, btn) => {
      console.log('Server', i, ':', $3(btn).attr('data-cdn-name'), '|', ($3(btn).attr('data-source') || '').substring(0, 100));
    });
  }
}
t().catch(console.error);
