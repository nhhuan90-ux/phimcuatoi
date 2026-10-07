const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function inspectJavhdzSitePage() {
  const url = 'https://javhdz.site/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  fs.writeFileSync('server/javhdz_site_page.html', res.data);
  console.log('Saved page length:', res.data.length);
  const $ = cheerio.load(res.data);
  console.log('Scripts count:', $('script').length);
  console.log('Iframes count:', $('iframe').length);
  $('iframe').each((i, el) => console.log(`Iframe #${i}:`, $(el).attr('src')));
}

inspectJavhdzSitePage();
