const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function findSubjavJsScripts() {
  const link = `https://${domains.subjav}/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/`;
  const res = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(res.data);

  const scripts = $('script[src]').map((i, el) => $(el).attr('src')).get();
  console.log('JS Script files on page:', scripts);

  for (const s of scripts) {
    if (s.includes('wp-content') || s.includes('theme') || s.includes('plugin')) {
      try {
        const jsUrl = s.startsWith('http') ? s : `https://${domains.subjav}` + s;
        const jsRes = await axios.get(jsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const text = jsRes.data;
        if (text.includes('action') || text.includes('ajax') || text.includes('iframe') || text.includes('embed')) {
          console.log(`\nFound AJAX references in ${s}:`);
          const matches = text.match(/action\s*:\s*["']([^"']+)["']/g);
          console.log('  Actions:', matches);
        }
      } catch (e) {}
    }
  }
}

findSubjavJsScripts();
