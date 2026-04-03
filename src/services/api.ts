// =====================================================
// Multi-Source API — phimapi.com is PRIMARY
// =====================================================

const PHIMAPI_URL = 'https://phimapi.com';
const PHIMAPI_IMG = 'https://phimimg.com';

// Helper: ensure image URL is absolute
const fixImageUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http')) return url;
  return `${PHIMAPI_IMG}/${url}`;
};

const fetchWithTimeout = (promise: Promise<any>, ms: number = 10000): Promise<any> => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
  ]);
};

// =====================================================
// phimapi.com — PRIMARY SOURCE
// =====================================================

const phimapiNormalizeListItem = (item: any) => ({
  name: item.name,
  slug: item.slug,
  original_name: item.origin_name,
  thumb_url: fixImageUrl(item.thumb_url) || fixImageUrl(item.poster_url),
  poster_url: fixImageUrl(item.poster_url) || fixImageUrl(item.thumb_url),
  year: item.year,
  _source: 'phimapi',
});

const phimapiFetchList = async (endpoint: string, page: number) => {
  let url = '';
  if (endpoint === '/films/phim-moi-cap-nhat') {
    url = `${PHIMAPI_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`;
  } else if (endpoint.startsWith('/films/danh-sach/')) {
    const slug = endpoint.replace('/films/danh-sach/', '');
    url = `${PHIMAPI_URL}/v1/api/danh-sach/${slug}?page=${page}`;
  } else if (endpoint.startsWith('/films/the-loai/')) {
    const slug = endpoint.replace('/films/the-loai/', '');
    url = `${PHIMAPI_URL}/v1/api/the-loai/${slug}?page=${page}`;
  } else if (endpoint.startsWith('/films/quoc-gia/')) {
    const slug = endpoint.replace('/films/quoc-gia/', '');
    url = `${PHIMAPI_URL}/v1/api/quoc-gia/${slug}?page=${page}`;
  } else {
    url = `${PHIMAPI_URL}${endpoint}?page=${page}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`phimapi list ${res.status}`);
  const data = await res.json();
  const items = data.items || data.data?.items || [];
  return {
    items: items.map(phimapiNormalizeListItem),
    pagination: data.pagination || data.data?.params?.pagination,
  };
};

const phimapiFetchDetail = async (slug: string) => {
  const res = await fetch(`${PHIMAPI_URL}/phim/${slug}`);
  if (!res.ok) throw new Error(`phimapi detail ${res.status}`);
  const data = await res.json();
  const movie = data.movie;
  const episodes = (data.episodes || []).map((server: any) => ({
    server_name: server.server_name,
    items: (server.server_data || []).map((ep: any) => ({
      name: ep.name,
      slug: ep.slug,
      embed: ep.link_embed || '',
      m3u8: ep.link_m3u8 || '',
    })),
  }));

  return {
    movie: {
      name: movie.name,
      slug: movie.slug,
      original_name: movie.origin_name,
      description: movie.content,
      thumb_url: fixImageUrl(movie.thumb_url),
      poster_url: fixImageUrl(movie.poster_url),
      quality: movie.quality,
      language: movie.lang,
      time: movie.time,
      current_episode: movie.episode_current,
      total_episodes: movie.episode_total,
      director: Array.isArray(movie.director) ? movie.director.join(', ') : movie.director,
      casts: Array.isArray(movie.actor) ? movie.actor.join(', ') : movie.actor,
      category: movie.category,
      country: movie.country,
      episodes,
      _source: 'phimapi',
    },
  };
};

const phimapiSearch = async (keyword: string) => {
  const res = await fetch(`${PHIMAPI_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error(`phimapi search ${res.status}`);
  const data = await res.json();
  const items = data.data?.items || [];
  return {
    items: items.map(phimapiNormalizeListItem),
    pagination: data.data?.params?.pagination,
  };
};

// =====================================================
// phim.nguonc.com — BACKUP (listings only)
// =====================================================
const NGUONC_URL = 'https://phim.nguonc.com/api';

const nguoncFetchList = async (endpoint: string, page: number) => {
  const res = await fetch(`${NGUONC_URL}${endpoint}?page=${page}`);
  if (!res.ok) throw new Error(`nguonc list ${res.status}`);
  const data = await res.json();
  return {
    items: (data.items || []).map((item: any) => ({
      name: item.name,
      slug: item.slug,
      original_name: item.original_name,
      thumb_url: item.thumb_url,
      poster_url: item.poster_url,
      year: item.year,
      _source: 'nguonc',
    })),
    pagination: data.pagination,
  };
};

// =====================================================
// PUBLIC API — Auto-failover
// =====================================================

export const fetchMovies = async (endpoint: string, page: number = 1) => {
  // Try phimapi first, then nguonc
  try {
    const result = await fetchWithTimeout(phimapiFetchList(endpoint, page));
    if (result.items && result.items.length > 0) return result;
  } catch (err) {
    console.warn('phimapi list failed:', err);
  }

  try {
    const result = await fetchWithTimeout(nguoncFetchList(endpoint, page));
    if (result.items && result.items.length > 0) return result;
  } catch (err) {
    console.warn('nguonc list failed:', err);
  }

  return { items: [] };
};

export const fetchMovieDetail = async (slug: string) => {
  // Always use phimapi for details (working player sources)
  try {
    return await fetchWithTimeout(phimapiFetchDetail(slug));
  } catch (err) {
    console.warn('phimapi detail failed:', err);
  }

  // Fallback to nguonc (broken player but at least has data)
  try {
    const res = await fetch(`${NGUONC_URL}/film/${slug}`);
    if (!res.ok) throw new Error(`nguonc detail ${res.status}`);
    const data = await res.json();
    return { movie: { ...data.movie, episodes: data.movie?.episodes || [], _source: 'nguonc' } };
  } catch (err) {
    console.warn('nguonc detail failed:', err);
  }

  throw new Error('All sources failed');
};

export const searchMovies = async (keyword: string) => {
  try {
    const result = await fetchWithTimeout(phimapiSearch(keyword));
    if (result.items) return result;
  } catch (err) {
    console.warn('phimapi search failed:', err);
  }

  try {
    const res = await fetch(`${NGUONC_URL}/films/search?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) throw new Error(`nguonc search ${res.status}`);
    const data = await res.json();
    return { items: data.items || [] };
  } catch (err) {
    console.warn('nguonc search failed:', err);
  }

  return { items: [] };
};
