const axios = require('axios');
async function checkDeploy() {
  const url = 'https://phimcuatoi.vercel.app/phim-18';
  try {
    const res = await axios.get(url);
    const match = res.data.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (match) {
      const jsUrl = 'https://phimcuatoi.vercel.app' + match[1];
      const jsRes = await axios.get(jsUrl);
      console.log('Includes sandbox?', jsRes.data.includes('allow-scripts allow-same-origin allow-forms'));
    } else {
      console.log('JS bundle not found in HTML');
    }
  } catch (e) { console.error(e.message); }
}
checkDeploy();
