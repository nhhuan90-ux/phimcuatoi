const axios = require('axios');
axios.get('https://phimcuatoi.vercel.app/api/embed/javhdz/4003', { timeout: 15000 })
  .then(res => console.log('Clean:', res.data.includes('hls.js')))
  .catch(err => console.error(err.message));
