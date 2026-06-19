const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  // 1. Test javsub.blog listing
  console.log('=== javsub.blog listing ===');
  const r1 = await axios.get('https://javsub.blog/', {timeout:10000, headers:{'User-Agent':'Mozilla/5.0'}});
  const $ = cheerio.load(r1.data);
  const items = $('.item').map((i, el) => ({
    link: $(el).find('.item__thumbnail').attr('href'),
    img: $(el).find('.item__thumbnail img').attr('src'),
    title: $(el).find('.item__title h4').text().trim(),
    labels: $(el).find('.item__labels span').map((j, sp) => $(sp).text().trim()).get()
  })).get();
  console.log('Items found:', items.length);
  if (items.length > 0) {
    console.log('First:', JSON.stringify(items[0], null, 2));
    console.log('Detail URL:', items[0].link);
    
    // 2. Test detail page & player
    console.log('\n=== javsub.blog detail ===');
    const r2 = await axios.get(items[0].link, {timeout:10000, headers:{'User-Agent':'Mozilla/5.0'}});
    const $2 = cheerio.load(r2.data);
    const buttons = $2('button.set-player-source');
    console.log('Video source buttons:', buttons.length);
    buttons.each((i, btn) => {
      console.log('  Server ' + (i+1) + ':');
      console.log('    source:', $2(btn).attr('data-source'));
      console.log('    cdn:', $2(btn).attr('data-cdn-name'));
    });
    const title = $2('header.heading h1.heading__title').text().trim();
    console.log('Title:', title || 'not found');
  }

  // 3. Test missav via alternative domains
  console.log('\n=== Testing missav domains ===');
  for (const domain of ['missav.ai', 'missav.ws', 'missav.cfd']) {
    try {
      const r = await axios.get('https://' + domain + '/en', {timeout:5000, headers:{'User-Agent':'Mozilla/5.0'}});
      console.log(domain + ': Status ' + r.status + ', Size ' + r.data.length);
      const $m = cheerio.load(r.data);
      console.log('  Items:', $m('.aspect-w-16').length || 'no items');
    } catch(e) {
      console.log(domain + ': ' + e.message.slice(0, 60));
    }
  }
}
test().catch(console.error);
