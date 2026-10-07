const axios = require('axios');
const fs = require('fs');

const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testSubjavAjax() {
  console.log('=== TESTING SUBJAV ADMIN-AJAX.PHP ===');
  const ajaxUrl = `https://${domains.subjav}/wp-admin/admin-ajax.php`;

  const actions = [
    'get_video_player',
    'tiktok_get_video',
    'get_video',
    'load_video',
    'get_player',
    'tiktok_ajax_get_video',
    'tiktok_video_play'
  ];

  for (const act of actions) {
    try {
      const res = await axios.post(ajaxUrl, new URLSearchParams({
        action: act,
        id: '36019',
        post_id: '36019',
        server: '1'
      }), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `https://${domains.subjav}/`
        }
      });
      console.log(`Action "${act}":`, res.status, JSON.stringify(res.data).slice(0, 150));
    } catch (e) {
      console.error(`Action "${act}" fail:`, e.message);
    }
  }
}

testSubjavAjax();
