const axios = require('axios');
async function testEmbed() {
  try {
    const res = await axios.get('https://phimcuatoi.vercel.app/api/embed/javhdz/4003', { timeout: 10000 });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers['content-type']);
    console.log('Body length:', res.data.length);
    console.log('Body snippet:', res.data.slice(0, 200));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testEmbed();
