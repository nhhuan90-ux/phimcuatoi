const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function findSubjavPlayer() {
  const link = `https://${domains.subjav}/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/`;
  const res = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(res.data);

  console.log('=== SUBJAV PLAYER SEARCH ===');
  console.log('Player containers:', $('#player, .player, #video, .video, #embed, .embed, iframe').map((i, el) => ({
    tag: el.name,
    class: $(el).attr('class'),
    id: $(el).attr('id'),
    src: $(el).attr('src'),
    html: $(el).html()?.slice(0, 100)
  })).get());

  console.log('\nSearch for m3u8 or mp4 or embed in full html:');
  const matches = res.data.match(/(https?:\/\/[^"'\s]+\.(?:m3u8|mp4|m3u|php|html))/gi);
  console.log('Matches:', matches ? [...new Set(matches)].slice(0, 15) : 'NONE');

  console.log('\nSearch for window or var assignments in html:');
  const vars = res.data.match(/var\s+[a-zA-Z0-9_$]+\s*=\s*[^;]+;/g);
  console.log('Vars sample:', vars ? vars.slice(0, 10) : 'NONE');
}

findSubjavPlayer();
