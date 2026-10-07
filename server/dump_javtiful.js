const axios = require('axios');
async function dumpJavtiful() {
  const url = 'https://upload18.org/play/index/DWD-151';
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log(res.data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
dumpJavtiful();
