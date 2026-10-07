const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function inspectSource(source, url, parser) {
  console.log(`\n=================== ${source.toUpperCase()} ===================`);
  const existingList = moviesData[source] || [];
  console.log(`Total in db: ${existingList.length}`);
  console.log(`First 5 IDs in db:`, existingList.slice(0, 5).map(m => m.id));
  console.log(`Last 5 IDs in db:`, existingList.slice(-5).map(m => m.id));

  try {
    const res = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': UA } });
    const parsedItems = parser(res.data);
    console.log(`Parsed ${parsedItems.length} items from URL: ${url}`);
    if (parsedItems.length > 0) {
      console.log(`First 5 parsed IDs from live site:`, parsedItems.slice(0, 5).map(m => m.id));
      const seen = new Set(existingList.map(m => String(m.id)));
      const newItems = parsedItems.filter(m => !seen.has(String(m.id)));
      console.log(`Matching check: ${newItems.length} items are marked as NEW.`);
      if (newItems.length === 0) {
        console.log(`Sample parsed item[0]:`, parsedItems[0]);
        console.log(`Is parsed item[0].id in db?`, seen.has(String(parsedItems[0].id)));
      }
    }
  } catch (e) {
    console.error(`Fetch error for ${source}:`, e.message);
  }
}

async function run() {
  // JAVHDz
  const javhdzParser = (html) => {
    const $=cheerio.load(html); const items=[];
    $('.movie-item.m-block').each((i,el)=>{
      const t=$(el).find('.movie-title-1').text().trim();
      const h=$(el).attr('href');
      const m=h?h.match(/-(\d+)\.html$/):null;
      if(t&&h&&m) items.push({ id: m[1], title: t, link: h });
    });
    return items;
  };
  await inspectSource('javhdz', `https://${domains.javhdz}/category/uncensored-3/`, javhdzParser);

  // SubJAV
  const subjavParser = (html) => {
    const $=cheerio.load(html); const items=[];
    $('.item-video').each((i,el)=>{
      const idAttr=$(el).attr('id')||''; const match=idAttr.match(/post-(\d+)/); if(!match) return;
      const id=match[1]; const a=$(el).find('a').last(); const href=a.attr('href')||'';
      const title=$(el).find('img').attr('alt')||a.text().trim();
      if(id&&href) items.push({ id: String(id), title, link: href });
    });
    return items;
  };
  await inspectSource('subjav', `https://${domains.subjav}/jav-vietsub/`, subjavParser);

  // JAVSub
  const javsubParser = (html) => {
    const $=cheerio.load(html); const items=[];
    $('.item').each((i,el)=>{
      const t=$(el).find('.item__title h4').text().trim();
      const h=$(el).find('.item__thumbnail').attr('href');
      const m=h?h.match(/phim-sex\/([^/]+)$/):null;
      if(t&&h&&m) items.push({ id: m[1], title: t, link: h });
    });
    return items;
  };
  await inspectSource('javsub', `https://javsub.blog/`, javsubParser);

  // JavTiful
  const javtifulParser = (html) => {
    const $=cheerio.load(html); const items=[];
    $('a[href*="/video/"]').each((i,el)=>{
      const href=$(el).attr('href'); if(!href) return;
      const m=href.match(/\/video\/([^/]+)/); if(!m) return;
      const id=m[1]; const title=$(el).find('img').attr('alt')||$(el).text().trim()||id;
      items.push({ id, title, link: href });
    });
    return items;
  };
  await inspectSource('javtiful', `https://javtiful.blog/`, javtifulParser);

  // PhimXYZ
  const phimxyzParser = (html) => {
    const $=cheerio.load(html); const items=[];
    $('a[href*="/phim/"]').each((i,el)=>{
      const href=$(el).attr('href'); if(!href||!href.match(/\/phim\/(.+)$/)) return;
      const id=href.match(/\/phim\/(.+)$/)[1];
      const alt=$(el).find('img').attr('alt')||';';
      if(!alt||alt==='Nhật Bản'||alt==='Trung Quốc'||alt==='Châu Âu'||alt==='Phim Sex HD'||alt===';') return;
      items.push({ id, title: alt, link: href });
    });
    return items;
  };
  await inspectSource('phimxyz', `https://${domains.phimxyz}/the-loai/jav`, phimxyzParser);
}

run();
