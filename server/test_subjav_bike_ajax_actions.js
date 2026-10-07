const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavAjaxAction(action, id) {
  try {
    const res = await axios.post('https://subjav.bike/wp-admin/admin-ajax.php', `action=${action}&id=${id}&post_id=${id}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://subjav.bike/bi-quyet-tre-dep-cua-co-chu-quan-dam-dang/${id}/`
      }
    });
    console.log(`Action "${action}" Status:`, res.status, 'Response:', JSON.stringify(res.data).slice(0, 200));
  } catch (e) {
    console.log(`Action "${action}" Error:`, e.message);
  }
}

async function run() {
  const actions = ['get_player', 'get_video', 'load_player', 'get_video_player', 'get_tiktok_slider_posts', 'player', 'get_source'];
  for (const act of actions) {
    await testSubjavAjaxAction(act, '36125');
  }
}

run();
