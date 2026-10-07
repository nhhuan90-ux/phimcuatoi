const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function inspectJavtifulNextData() {
  console.log('=== INSPECTING JAVTIFUL __NEXT_DATA__ ===');
  const url = 'https://javtiful.blog/video/kidm-361';
  try {
    const res = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const nextData = $('#__NEXT_DATA__').html();
    if (nextData) {
      console.log('__NEXT_DATA__ found! Length:', nextData.length);
      const data = JSON.parse(nextData);
      console.log('Props keys:', Object.keys(data.props?.pageProps || {}));
      console.log('pageProps:', JSON.stringify(data.props?.pageProps, null, 2).slice(0, 1000));
    } else {
      console.log('No __NEXT_DATA__ found. Printing HTML sample:');
      console.log(res.data.slice(0, 2000));
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

inspectJavtifulNextData();
