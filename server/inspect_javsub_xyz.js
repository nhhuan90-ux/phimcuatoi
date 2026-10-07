const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function inspectJavsubXyz() {
  try {
    const res = await axios.get('https://javsub.xyz/', { timeout: 8000, headers: { 'User-Agent': UA } });
    console.log('javsub.xyz Status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);
    console.log('All links count:', $('a[href]').length);
    console.log('Sample links:', $('a[href]').slice(0, 10).map((i, el) => $(el).attr('href')).get());
    console.log('Sample item classes:', $('div[class]').slice(0, 10).map((i, el) => $(el).attr('class')).get());
  } catch (e) {
    console.error('Error:', e.message);
  }
}

inspectJavsubXyz();
