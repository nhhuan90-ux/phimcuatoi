const axios = require('axios');
const cheerio = require('cheerio');

async function testCrawler() {
  const url = 'https://javhdz.site/category/uncensored-3/';
  console.log('Testing JAVHDz crawler on new domain:', url);
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(res.data);
    let count = 0;
    
    $('.movie-item.m-block').each((i, el) => {
      const title = $(el).find('.movie-title-1').text().trim();
      const href = $(el).attr('href');
      const img = $(el).find('.public-film-item-thumb').attr('src');
      const views = $(el).find('.ribbon-viewed').text().trim();
      const tag = $(el).find('.ribbon-sub').text().trim();
      
      if (title && href) {
        console.log(`Movie #${count+1}:`);
        console.log(`  Title: ${title}`);
        console.log(`  Href: ${href}`);
        console.log(`  Img: ${img}`);
        console.log(`  Tag: ${tag}`);
        console.log(`  Views: ${views}`);
        count++;
      }
    });
    console.log('Total movies found on page 1:', count);
  } catch (err) {
    console.error('Crawler test failed:', err.message);
  }
}

testCrawler();
