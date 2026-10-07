const cheerio = require('cheerio');

function simulateScript2(videoData, searchParamsStr) {
  const params = new URLSearchParams(searchParamsStr);

  function n(t, n) {
    if (t.sources) return t.sources;
    const e = n.get("src") || n.get("source") || n.get("url") || n.get("video");
    return e ? [{ file: e, label: "Auto" }] : [];
  }

  function t(t, a) {
    const s = { ...videoData, ...a };
    return {
      sources: n(s, t),
      iw: s.iw
    };
  }

  const o = t(params, {});
  console.log('Resulting o:', o);
  const isBlocked = !o.iw || (o.sources && o.sources.length === 0);
  console.log('Is Blocked?:', isBlocked);
}

const windowVideoData = {
  "id": "690854634daac3b7ce088f72",
  "title": "690854634daac3b7ce088f72",
  "thumbnail": "//pod8ca.top/videos/690854634daac3b7ce088f72/posters/3.jpg",
  "iw": true,
  "domain": "javsub.blog"
};

console.log('--- TEST 1: WITHOUT QUERY PARAM (DEFAULT) ---');
simulateScript2(windowVideoData, '?event_id=player-wrapper');

console.log('\n--- TEST 2: WITH VIDEO QUERY PARAM ---');
const masterM3u8 = '/api/proxy/hls?url=' + encodeURIComponent('https://e.streamforester.name/videos/690854634daac3b7ce088f72/master.m3u8');
simulateScript2(windowVideoData, `?event_id=player-wrapper&video=${encodeURIComponent(masterM3u8)}`);
