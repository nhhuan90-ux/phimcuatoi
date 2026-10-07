const fs = require('fs');
const path = require('path');

const DOMAINS_FILE = path.join(__dirname, 'domains.json');
const DATA_FILE = path.join(__dirname, 'movies.json');

const newDomains = {
  javhdz: 'javhdz.mobi',
  subjav: 'subjav.city',
  phimxyz: 'i1.phimxyz.blog',
  javsub: 'javsub.blog',
  javtiful: 'javtiful.fit'
};

fs.writeFileSync(DOMAINS_FILE, JSON.stringify(newDomains, null, 2), 'utf-8');
console.log('[1/3] Updated domains.json:', newDomains);

// Migrate movies.json entries
const moviesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
let countJavhdz = 0;
let countVlxx = 0;
let countJavtiful = 0;

function migrateItem(obj) {
  if (!obj) return;
  if (obj.img) {
    if (obj.img.includes('javhdz.fun') || obj.img.includes('javhdz.red')) {
      obj.img = obj.img.replace(/javhdz\.(fun|red|city)/g, 'javhdz.mobi');
      countJavhdz++;
    }
    if (obj.img.includes('vlxx.net') || obj.img.includes('vlxx.moi')) {
      obj.img = obj.img.replace(/vlxx\.(net|moi)/g, 'vlxx.phd');
      countVlxx++;
    }
    if (obj.img.includes('javtiful.blog')) {
      obj.img = obj.img.replace('javtiful.blog', 'javtiful.fit');
      countJavtiful++;
    }
  }
  if (obj.link) {
    if (obj.link.includes('javhdz.fun') || obj.link.includes('javhdz.red')) {
      obj.link = obj.link.replace(/javhdz\.(fun|red|city)/g, 'javhdz.mobi');
    }
    if (obj.link.includes('vlxx.net') || obj.link.includes('vlxx.moi')) {
      obj.link = obj.link.replace(/vlxx\.(net|moi)/g, 'vlxx.phd');
    }
    if (obj.link.includes('javtiful.blog')) {
      obj.link = obj.link.replace('javtiful.blog', 'javtiful.fit');
    }
  }
}

['javhdz', 'vlxx', 'javsub', 'javtiful', 'phimxyz', 'subjav', 'all'].forEach(k => {
  if (Array.isArray(moviesData[k])) {
    moviesData[k].forEach(migrateItem);
  }
});

fs.writeFileSync(DATA_FILE, JSON.stringify(moviesData, null, 2), 'utf-8');
console.log(`[2/3] Updated movies.json entries (JAVHDz: ${countJavhdz}, VLXX: ${countVlxx}, JavTiful: ${countJavtiful})`);

console.log('[3/3] Migration script finished!');
