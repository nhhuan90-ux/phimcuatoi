const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'movies.json');

function migrate() {
  console.log('Reading movies.json...');
  if (!fs.existsSync(DATA_FILE)) {
    console.error('movies.json not found!');
    return;
  }
  
  const moviesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  
  let phimxyzUpdated = 0;
  let subjavUpdated = 0;
  let subjavTagsFixed = 0;
  
  // Helper function to update source arrays
  function processList(list) {
    if (!list) return;
    list.forEach(m => {
      // 1. PhimXYZ migration
      if (m.source === 'phimxyz') {
        if (m.img && m.img.includes('i.phimxyz.blog')) {
          m.img = m.img.replace('i.phimxyz.blog', 'i1.phimxyz.blog');
          phimxyzUpdated++;
        }
        if (m.link && m.link.includes('i.phimxyz.blog')) {
          m.link = m.link.replace('i.phimxyz.blog', 'i1.phimxyz.blog');
        }
      }
      
      // 2. SubJAV migration & tag reclassification
      if (m.source === 'subjav') {
        let isVertical = false;
        
        if (m.img && m.img.includes('subjav.sbs')) {
          m.img = m.img.replace('subjav.sbs', 'subjav.men');
          subjavUpdated++;
        }
        if (m.link && m.link.includes('subjav.sbs')) {
          m.link = m.link.replace('subjav.sbs', 'subjav.men');
        }
        
        // Check if vertical video
        if ((m.link && m.link.includes('/video/')) || (m.img && m.img.includes('tiktok-thumbnails'))) {
          isVertical = true;
        }
        
        if (isVertical && m.tag !== 'Shorts') {
          m.tag = 'Shorts';
          subjavTagsFixed++;
        }
      }
    });
  }
  
  // Process individual source listings
  processList(moviesData.phimxyz);
  processList(moviesData.subjav);
  
  // Process the combined "all" listing
  processList(moviesData.all);
  
  console.log(`Migration results:`);
  console.log(`  - PhimXYZ thumbnails updated: ${phimxyzUpdated}`);
  console.log(`  - SubJAV thumbnails updated: ${subjavUpdated}`);
  console.log(`  - SubJAV vertical tags corrected: ${subjavTagsFixed}`);
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(moviesData, null, 2), 'utf-8');
  console.log('movies.json updated successfully!');
}

migrate();
