const axios = require('axios');
axios.get('https://subjav.bike/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => {
    const match = r.data.match(/<iframe[^>]*src=["']([^"']+)["']/i);
    console.log(match ? match[1] : 'none');
  })
  .catch(e => console.log(e.message));
