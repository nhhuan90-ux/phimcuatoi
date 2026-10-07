const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'movies.json');
const moviesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

console.log('=== MIGRATING DATABASE DOMAIN LINKS ===');

let countJavhdz = 0;
let countVlxx = 0;

function migrateObject(obj) {
  if (!obj) return;
  if (obj.img) {
    if (obj.img.includes('javhdz.red') || obj.img.includes('javhdz.mobi')) {
      obj.img = obj.img.replace(/javhdz\.(red|mobi)/g, 'javhdz.fun');
      countJavhdz++;
    }
    if (obj.img.includes('vlxx.moi')) {
      obj.img = obj.img.replace('vlxx.moi', 'vlxx.net');
      countVlxx++;
    }
  }
  if (obj.link) {
    if (obj.link.includes('javhdz.red') || obj.link.includes('javhdz.mobi')) {
      obj.link = obj.link.replace(/javhdz\.(red|mobi)/g, 'javhdz.fun');
    }
    if (obj.link.includes('vlxx.moi')) {
      obj.link = obj.link.replace('vlxx.moi', 'vlxx.net');
    }
  }
}

['javhdz', 'vlxx', 'javsub', 'javtiful', 'phimxyz', 'subjav', 'all'].forEach(key => {
  if (Array.isArray(moviesData[key])) {
    moviesData[key].forEach(migrateObject);
  }
});

fs.writeFileSync(DATA_FILE, JSON.stringify(moviesData, null, 2), 'utf-8');
console.log(`Migration completed: Updated ${countJavhdz} JAVHDz entries to javhdz.fun and ${countVlxx} VLXX entries to vlxx.net!`);
