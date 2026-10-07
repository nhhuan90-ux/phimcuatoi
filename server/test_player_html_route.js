const fs = require('fs');
const path = require('path');

async function testPlayerHtmlRoute() {
  const p = path.join(__dirname, 'public', 'player.html');
  console.log('Path exists:', fs.existsSync(p));
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    console.log('Content length:', content.length);
    console.log('Title in file:', content.match(/<title>(.*?)<\/title>/)?.[1]);
  }
}

testPlayerHtmlRoute();
