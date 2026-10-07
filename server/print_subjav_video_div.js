const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function printSubjavVideoDiv() {
  const link = `https://${domains.subjav}/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/`;
  const res = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(res.data);
  console.log('=== DIV #VIDEO INNER HTML ===');
  console.log($('#video').html());
}

printSubjavVideoDiv();
