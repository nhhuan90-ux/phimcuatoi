const fs = require('fs');

const html = fs.readFileSync('server/javhdz_site_page.html', 'utf-8');

const lines = html.split('\n');
console.log('Total lines:', lines.length);

lines.forEach((line, idx) => {
  if (line.includes('player') || line.includes('video') || line.includes('jwplayer') || line.includes('iframe') || line.includes('embed')) {
    if (!line.includes('whitetrafsa') && !line.includes('gtag') && !line.includes('litespeed')) {
      console.log(`Line #${idx + 1}:`, line.trim().slice(0, 250));
    }
  }
});
