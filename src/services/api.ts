// =====================================================
// Multi-Source API — phimapi.com is PRIMARY
// =====================================================

const PHIMAPI_URL = 'https://phimapi.com';
const PHIMAPI_IMG = 'https://phimimg.com';

export const getOptimizedImageUrl = (url: string | undefined, width?: number, quality?: number): string => {
  if (!url || typeof url !== 'string') return '';
  return url;
};

const fixImageUrl = (url: any, width?: number): string => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http')) return url;
  return `${PHIMAPI_IMG}/${url}`;
};

const ophimFixImageUrl = (url: any, width?: number): string => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http')) return url;
  return `https://img.ophim.live/uploads/movies/${url}`;
};

export const normalizeName = (name: string | undefined): string => {
  if (!name) return '';
  return name.replace(/[^a-z0-9]/gi, '').toLowerCase();
};

export const getBaseName = (name: string | undefined): string => {
  if (!name) return '';
  // Removes (Phần X), (Season X), Phần X, Season X, P.X, etc.
  return name.replace(/\s*\([^)]*(?:phần|season|ss|part|\bp\.)[^)]*\)\s*/i, '')
             .replace(/\s*(?:phần|season|ss|part|\bp\.)\s*\d+\s*/i, '')
             .trim();
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
  thumb_url: fixImageUrl(item.thumb_url, 300) || fixImageUrl(item.poster_url, 300),
  poster_url: fixImageUrl(item.poster_url, 450) || fixImageUrl(item.thumb_url, 450),
  year: item.year,
  _source: 'PhimAPI',
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
  if (!data.status || !data.movie || data.movie === '') {
    throw new Error(`phimapi detail not found`);
  }
  const movie = data.movie;
  const episodes = (data.episodes || []).map((server: any) => ({
    server_name: server.server_name || 'PhimAPI',
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
      thumb_url: fixImageUrl(movie.poster_url, 600) || fixImageUrl(movie.thumb_url, 600),
      poster_url: fixImageUrl(movie.thumb_url, 800) || fixImageUrl(movie.poster_url, 800),
      quality: movie.quality,
      language: movie.lang,
      time: movie.time,
      current_episode: movie.episode_current,
      total_episodes: movie.episode_total,
      year: movie.year,
      director: Array.isArray(movie.director) ? movie.director.join(', ') : movie.director,
      casts: Array.isArray(movie.actor) ? movie.actor.join(', ') : movie.actor,
      category: movie.category,
      country: movie.country,
      episodes,
      _source: 'PhimAPI',
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
// phim.nguonc.com — BACKUP SOURCE
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
      thumb_url: getOptimizedImageUrl(item.poster_url, 300) || getOptimizedImageUrl(item.thumb_url, 300),
      poster_url: getOptimizedImageUrl(item.thumb_url, 450) || getOptimizedImageUrl(item.poster_url, 450),
      year: item.year,
      _source: 'NguonC',
    })),
    pagination: data.pagination,
  };
};

const nguoncFetchDetail = async (slug: string) => {
  const res = await fetch(`${NGUONC_URL}/film/${slug}`);
  if (!res.ok) throw new Error(`nguonc detail ${res.status}`);
  const data = await res.json();
  if (data.status !== 'success' || !data.movie || data.movie === '') {
    throw new Error(`nguonc detail not found`);
  }
  const movie = data.movie;
  const episodes = (movie?.episodes || []).map((server: any) => ({
    server_name: server.server_name || 'NguonC',
    items: (server.server_data || server.items || []).map((ep: any) => ({
      name: ep.name,
      slug: ep.slug,
      embed: ep.embed || ep.link_embed || '',
      m3u8: ep.m3u8 || ep.link_m3u8 || '',
    })),
  }));
  
  return {
    movie: {
      ...movie,
      thumb_url: getOptimizedImageUrl(movie.thumb_url, 600) || getOptimizedImageUrl(movie.poster_url, 600),
      poster_url: getOptimizedImageUrl(movie.poster_url, 800) || getOptimizedImageUrl(movie.thumb_url, 800),
      episodes,
      _source: 'NguonC'
    }
  };
};

const nguoncSearch = async (keyword: string) => {
    const res = await fetch(`${NGUONC_URL}/films/search?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) throw new Error(`nguonc search ${res.status}`);
    const data = await res.json();
    return {
      items: (data.items || []).map((item: any) => ({
        name: item.name,
        slug: item.slug,
        original_name: item.original_name,
        thumb_url: getOptimizedImageUrl(item.poster_url) || getOptimizedImageUrl(item.thumb_url),
        poster_url: getOptimizedImageUrl(item.thumb_url) || getOptimizedImageUrl(item.poster_url),
        year: item.year,
        _source: 'NguonC',
      })),
    };
};

// =====================================================
// vsmov.com — BACKUP SOURCE
// =====================================================
const VSMOV_URL = 'https://vsmov.com/api';

const vsmovFetchList = async (endpoint: string, page: number) => {
  let url = '';
  if (endpoint === '/films/phim-moi-cap-nhat') {
    url = `${VSMOV_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`;
  } else if (endpoint.startsWith('/films/danh-sach/')) {
    let slug = endpoint.replace('/films/danh-sach/', '');
    if (slug === 'phim-bo') slug = 'series';
    else if (slug === 'phim-le') slug = 'single';
    else if (slug === 'hoat-hinh') slug = 'hoathinh';
    else if (slug === 'tv-shows') slug = 'tvshows';
    url = `${VSMOV_URL}/danh-sach?type=${slug}&page=${page}`;
  } else if (endpoint.startsWith('/films/the-loai/')) {
    const slug = endpoint.replace('/films/the-loai/', '');
    url = `${VSMOV_URL}/danh-sach?category=${slug}&page=${page}`;
  } else if (endpoint.startsWith('/films/quoc-gia/')) {
    const slug = endpoint.replace('/films/quoc-gia/', '');
    url = `${VSMOV_URL}/danh-sach?country=${slug}&page=${page}`;
  } else {
    url = `${VSMOV_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`vsmov list ${res.status}`);
  const data = await res.json();
  const items = data.items || data.data?.items || [];
  return {
    items: items.map((item: any) => ({
      name: item.name,
      slug: item.slug,
      original_name: item.origin_name || item.original_name,
      thumb_url: getOptimizedImageUrl(item.poster_url, 300) || getOptimizedImageUrl(item.thumb_url, 300),
      poster_url: getOptimizedImageUrl(item.thumb_url, 450) || getOptimizedImageUrl(item.poster_url, 450),
      year: item.year,
      _source: 'VSMov',
    })),
    pagination: data.pagination || data.data?.params?.pagination,
  };
};

const vsmovFetchDetail = async (slug: string) => {
  const res = await fetch(`${VSMOV_URL}/phim/${slug}`);
  if (!res.ok) throw new Error(`vsmov detail ${res.status}`);
  const data = await res.json();
  if (data.status === false) {
    throw new Error(`vsmov detail not found`);
  }
  const movie = data.movie || data.data?.item;
  
  if (!movie || movie === '') throw new Error('VSMov no movie data');

  const episodes = (movie.episodes || data.episodes || data.data?.item?.episodes || []).map((server: any) => ({
    server_name: server.server_name || 'VSMov',
    items: (server.server_data || server.items || []).map((ep: any) => {
      const embed = ep.link_embed || ep.embed || '';
      let m3u8 = ep.link_m3u8 || ep.m3u8 || '';
      if (!m3u8 && embed && embed.includes('/video/')) {
        m3u8 = embed.replace(/\/video\/([^/?#]+).*/, '/stream/$1/master.m3u8');
      }
      return {
        name: ep.name,
        slug: ep.slug,
        embed,
        m3u8,
      };
    }),
  }));

  return {
    movie: {
      name: movie.name,
      slug: movie.slug,
      original_name: movie.origin_name || movie.original_name,
      description: movie.content || movie.description,
      thumb_url: getOptimizedImageUrl(movie.thumb_url, 600) || getOptimizedImageUrl(movie.poster_url, 600),
      poster_url: getOptimizedImageUrl(movie.poster_url, 800) || getOptimizedImageUrl(movie.thumb_url, 800),
      quality: movie.quality,
      language: movie.lang || movie.language,
      time: movie.time,
      current_episode: movie.episode_current,
      total_episodes: movie.episode_total,
      year: movie.year,
      director: Array.isArray(movie.director) ? movie.director.join(', ') : movie.director,
      casts: Array.isArray(movie.actor) ? movie.actor.join(', ') : movie.actor,
      category: movie.category,
      country: movie.country,
      episodes,
      _source: 'VSMov',
    }
  };
};

const vsmovSearch = async (keyword: string) => {
  const res = await fetch(`${VSMOV_URL}/tim-kiem?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error(`vsmov search ${res.status}`);
  const data = await res.json();
  const items = data.items || data.data?.items || [];
  return {
    items: items.map((item: any) => ({
      name: item.name,
      slug: item.slug,
      original_name: item.origin_name || item.original_name,
      thumb_url: getOptimizedImageUrl(item.poster_url) || getOptimizedImageUrl(item.thumb_url),
      poster_url: getOptimizedImageUrl(item.thumb_url) || getOptimizedImageUrl(item.poster_url),
      year: item.year,
      _source: 'VSMov',
    })),
    pagination: data.pagination || data.data?.params?.pagination,
  };
};


// =====================================================
// ophim1.com — SERVER 4
// =====================================================
const OPHIM_URL = 'https://ophim1.com/v1/api';

const ophimFetchList = async (endpoint: string, page: number) => {
  let url = '';
  if (endpoint === '/films/phim-moi-cap-nhat') {
    url = `https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=${page}`;
  } else if (endpoint.startsWith('/films/danh-sach/')) {
    const slug = endpoint.replace('/films/danh-sach/', '');
    url = `${OPHIM_URL}/danh-sach/${slug}?page=${page}`;
  } else if (endpoint.startsWith('/films/the-loai/')) {
    const slug = endpoint.replace('/films/the-loai/', '');
    url = `${OPHIM_URL}/the-loai/${slug}?page=${page}`;
  } else if (endpoint.startsWith('/films/quoc-gia/')) {
    const slug = endpoint.replace('/films/quoc-gia/', '');
    url = `${OPHIM_URL}/quoc-gia/${slug}?page=${page}`;
  } else {
    url = `https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=${page}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`ophim list ${res.status}`);
  const data = await res.json();
  const items = data.items || data.data?.items || [];
  return {
    items: items.map((item: any) => ({
      name: item.name,
      slug: item.slug,
      original_name: item.origin_name,
      thumb_url: ophimFixImageUrl(item.thumb_url, 300) || ophimFixImageUrl(item.poster_url, 300),
      poster_url: ophimFixImageUrl(item.poster_url, 450) || ophimFixImageUrl(item.thumb_url, 450),
      year: item.year,
      _source: 'OPhim',
    })),
    pagination: data.pagination || data.data?.params?.pagination,
  };
};

const ophimFetchDetail = async (slug: string) => {
  const res = await fetch(`${OPHIM_URL}/phim/${slug}`);
  if (!res.ok) throw new Error(`ophim detail ${res.status}`);
  const data = await res.json();
  
  // OPhim v1 API response places movie details in data.item under the data root key
  const movie = data.data?.item;
  if (!movie) {
    throw new Error(`ophim detail not found`);
  }
  const episodes = (movie.episodes || []).map((server: any) => ({
    server_name: server.server_name || 'OPhim',
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
      thumb_url: ophimFixImageUrl(movie.poster_url, 600) || ophimFixImageUrl(movie.thumb_url, 600),
      poster_url: ophimFixImageUrl(movie.thumb_url, 800) || ophimFixImageUrl(movie.poster_url, 800),
      quality: movie.quality,
      language: movie.lang,
      time: movie.time,
      current_episode: movie.episode_current,
      total_episodes: movie.episode_total,
      year: movie.year,
      director: Array.isArray(movie.director) ? movie.director.join(', ') : movie.director,
      casts: Array.isArray(movie.actor) ? movie.actor.join(', ') : movie.actor,
      category: movie.category,
      country: movie.country,
      episodes,
      _source: 'OPhim',
    },
  };
};

const ophimSearch = async (keyword: string) => {
  const res = await fetch(`${OPHIM_URL}/tim-kiem?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error(`ophim search ${res.status}`);
  const data = await res.json();
  const items = data.data?.items || [];
  return {
    items: items.map((item: any) => ({
      name: item.name,
      slug: item.slug,
      original_name: item.origin_name,
      thumb_url: ophimFixImageUrl(item.thumb_url) || ophimFixImageUrl(item.poster_url),
      poster_url: ophimFixImageUrl(item.poster_url) || ophimFixImageUrl(item.thumb_url),
      year: item.year,
      _source: 'OPhim',
    })),
    pagination: data.data?.params?.pagination,
  };
};

// =====================================================
// ontv.icu (OBB) — SERVER 5
// =====================================================
const OBB_URL = 'https://ontv.icu/v1/api';

const obbFetchList = async (endpoint: string, page: number) => {
  let url = '';
  if (endpoint === '/films/phim-moi-cap-nhat') {
    url = `https://ontv.icu/danh-sach/phim-moi-cap-nhat?page=${page}`;
  } else if (endpoint.startsWith('/films/danh-sach/')) {
    const slug = endpoint.replace('/films/danh-sach/', '');
    url = `${OBB_URL}/danh-sach/${slug}?page=${page}`;
  } else if (endpoint.startsWith('/films/the-loai/')) {
    const slug = endpoint.replace('/films/the-loai/', '');
    url = `${OBB_URL}/the-loai/${slug}?page=${page}`;
  } else if (endpoint.startsWith('/films/quoc-gia/')) {
    const slug = endpoint.replace('/films/quoc-gia/', '');
    url = `${OBB_URL}/quoc-gia/${slug}?page=${page}`;
  } else {
    url = `https://ontv.icu/danh-sach/phim-moi-cap-nhat?page=${page}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`obb list ${res.status}`);
  const data = await res.json();
  const items = data.items || data.data?.items || [];
  return {
    items: items.map((item: any) => ({
      name: item.name,
      slug: item.slug,
      original_name: item.origin_name,
      thumb_url: fixImageUrl(item.thumb_url, 300) || fixImageUrl(item.poster_url, 300),
      poster_url: fixImageUrl(item.poster_url, 450) || fixImageUrl(item.thumb_url, 450),
      year: item.year,
      _source: 'OBB',
    })),
    pagination: data.pagination || data.data?.params?.pagination,
  };
};

const obbFetchDetail = async (slug: string) => {
  const res = await fetch(`${OBB_URL}/phim/${slug}`);
  if (!res.ok) throw new Error(`obb detail ${res.status}`);
  const data = await res.json();
  
  // OBB v1 API response places movie details in data.item under the data root key
  const movie = data.data?.item;
  if (!movie) {
    throw new Error(`obb detail not found`);
  }
  const episodes = (movie.episodes || []).map((server: any) => ({
    server_name: server.server_name || 'OBB',
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
      thumb_url: fixImageUrl(movie.poster_url, 600) || fixImageUrl(movie.thumb_url, 600),
      poster_url: fixImageUrl(movie.thumb_url, 800) || fixImageUrl(movie.poster_url, 800),
      quality: movie.quality,
      language: movie.lang,
      time: movie.time,
      current_episode: movie.episode_current,
      total_episodes: movie.episode_total,
      year: movie.year,
      director: Array.isArray(movie.director) ? movie.director.join(', ') : movie.director,
      casts: Array.isArray(movie.actor) ? movie.actor.join(', ') : movie.actor,
      category: movie.category,
      country: movie.country,
      episodes,
      _source: 'OBB',
    },
  };
};

const obbSearch = async (keyword: string) => {
  const res = await fetch(`${OBB_URL}/tim-kiem?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error(`obb search ${res.status}`);
  const data = await res.json();
  const items = data.data?.items || [];
  return {
    items: items.map((item: any) => ({
      name: item.name,
      slug: item.slug,
      original_name: item.origin_name,
      thumb_url: fixImageUrl(item.thumb_url) || fixImageUrl(item.poster_url),
      poster_url: fixImageUrl(item.poster_url) || fixImageUrl(item.thumb_url),
      year: item.year,
      _source: 'OBB',
    })),
    pagination: data.data?.params?.pagination,
  };
};


// =====================================================
// PUBLIC API — Auto-failover & Merging
// =====================================================

export const fetchMovies = async (endpoint: string, page: number = 1) => {
  const results = await Promise.allSettled([
    fetchWithTimeout(phimapiFetchList(endpoint, page), 6000),
    fetchWithTimeout(nguoncFetchList(endpoint, page), 6000),
    fetchWithTimeout(vsmovFetchList(endpoint, page), 6000),
    fetchWithTimeout(ophimFetchList(endpoint, page), 6000),
    fetchWithTimeout(obbFetchList(endpoint, page), 3000)
  ]);
  
  const allItems: any[] = [];
  const slugs = new Set();
  let latestPagination = null;
  
  results.forEach((res) => {
    if (res.status === 'fulfilled' && res.value?.items) {
      if (!latestPagination && res.value.pagination) {
        latestPagination = res.value.pagination;
      }
      res.value.items.forEach((item: any) => {
        // 1. Strict deduplication based on exact/normalized original name
        let isRefused = false;
        const normOrigName = normalizeName(item.original_name);
        const normName = normalizeName(item.name);
        const baseNormName = normalizeName(getBaseName(item.name));
        const baseNormOrigName = normalizeName(getBaseName(item.original_name));

        const existing = allItems.find(i => {
           if (i.slug === item.slug) return true;
           const iNormOrigName = normalizeName(i.original_name);
           const iNormName = normalizeName(i.name);
           if (iNormOrigName && normOrigName && iNormOrigName === normOrigName) return true;
           if (iNormName && normName && iNormName === normName) return true;
           
           // Season grouping blocker: if a base version of this movie is already in list, hide this season
           const iBaseNormName = normalizeName(getBaseName(i.name));
           const iBaseNormOrigName = normalizeName(getBaseName(i.original_name));
           if (baseNormName && iBaseNormName && baseNormName === iBaseNormName) return true;
           if (baseNormOrigName && iBaseNormOrigName && baseNormOrigName === iBaseNormOrigName) return true;
           
           return false;
        });

        if (!existing && !slugs.has(item.slug)) {
          slugs.add(item.slug);
          allItems.push(item);
        }
      });
    } else if (res.status === 'rejected') {
      console.warn('One of the apis failed to fetch movies', res.reason);
    }
  });

  return { items: allItems, pagination: latestPagination };
};

export const fetchMovieDetail = async (slug: string) => {
  // 1. Initial attempt by slug
  const results = await Promise.allSettled([
    fetchWithTimeout(phimapiFetchDetail(slug), 6000),
    fetchWithTimeout(nguoncFetchDetail(slug), 6000),
    fetchWithTimeout(vsmovFetchDetail(slug), 6000),
    fetchWithTimeout(ophimFetchDetail(slug), 6000),
    fetchWithTimeout(obbFetchDetail(slug), 3000)
  ]);

  let baseMovie: any = null;
  const allEpisodes: any[] = [];

  const processResult = (result: any, sourceName: string) => {
    if (result.status === 'fulfilled' && result.value?.movie) {
      if (!baseMovie) {
        baseMovie = { ...result.value.movie, _source: sourceName };
      }
      
      const eps = result.value.movie.episodes;
      if (eps && eps.length > 0) {
        eps.forEach((server: any) => {
          allEpisodes.push({
            ...server,
            server_name: `${server.server_name} (${sourceName})`
          });
        });
      }
      return true;
    }
    return false;
  };

  // Prioritize PhimAPI for base info, then NguonC, then VSMov
  const hasPhimApi = processResult(results[0], 'PhimAPI');
  const hasNguonc = processResult(results[1], 'NguonC');
  const hasVsmov = processResult(results[2], 'VSMov');
  const hasOphim = processResult(results[3], 'OPhim');
  const hasObb = processResult(results[4], 'OBB');

  if (!baseMovie) {
    throw new Error('All sources failed or movie not found');
  }

  // 2. For any source that failed (404 due to different slugs), try searching by name
  const tryFallbackSearch = async (
    hasSource: boolean, 
    sourceName: string, 
    searchFn: (kw: string) => Promise<any>, 
    detailFn: (s: string) => Promise<any>
  ) => {
    if (hasSource || !baseMovie) return;
    try {
      const keyword = baseMovie.original_name || baseMovie.name;
      if (!keyword) return;

      const searchRes = await fetchWithTimeout(searchFn(keyword), 4000);
      if (searchRes.items && searchRes.items.length > 0) {
        // Find the most confident match
        const match = searchRes.items.find((item: any) => 
          (normalizeName(item.original_name) && normalizeName(item.original_name) === normalizeName(baseMovie.original_name)) ||
          (normalizeName(item.name) && normalizeName(item.name) === normalizeName(baseMovie.name)) ||
          (item.slug && item.slug.includes(slug))
        ) || searchRes.items.find((item: any) => 
          (normalizeName(getBaseName(item.name)) === normalizeName(getBaseName(baseMovie.name)))
        ) || searchRes.items[0]; // Fallback

        if (match && match.slug !== slug) {
          const detailRes = await fetchWithTimeout(detailFn(match.slug), 4000);
          processResult({ status: 'fulfilled', value: detailRes }, sourceName);
        }
      }
    } catch (e) {
      console.warn(`Fallback for ${sourceName} failed:`, e);
    }
  };

  await Promise.allSettled([
    tryFallbackSearch(hasPhimApi, 'PhimAPI', phimapiSearch, phimapiFetchDetail),
    tryFallbackSearch(hasNguonc, 'NguonC', nguoncSearch, nguoncFetchDetail),
    tryFallbackSearch(hasVsmov, 'VSMov', vsmovSearch, vsmovFetchDetail),
    tryFallbackSearch(hasOphim, 'OPhim', ophimSearch, ophimFetchDetail),
    tryFallbackSearch(hasObb, 'OBB', obbSearch, obbFetchDetail)
  ]);

  // Deduplicate servers just in case
  baseMovie.episodes = allEpisodes;

  return { movie: baseMovie };
};

export const searchMovies = async (keyword: string) => {
  const results = await Promise.allSettled([
    fetchWithTimeout(phimapiSearch(keyword), 6000),
    fetchWithTimeout(nguoncSearch(keyword), 6000),
    fetchWithTimeout(vsmovSearch(keyword), 6000),
    fetchWithTimeout(ophimSearch(keyword), 6000),
    fetchWithTimeout(obbSearch(keyword), 3000)
  ]);
  
  const allItems: any[] = [];
  const slugs = new Set();
  
  results.forEach((res) => {
    if (res.status === 'fulfilled' && res.value?.items) {
      res.value.items.forEach((item: any) => {
        const normOrigName = normalizeName(item.original_name);
        const normName = normalizeName(item.name);
        const baseNormName = normalizeName(getBaseName(item.name));

        const existing = allItems.find(i => {
           if (i.slug === item.slug) return true;
           const iNormOrigName = normalizeName(i.original_name);
           const iNormName = normalizeName(i.name);
           if (iNormOrigName && normOrigName && iNormOrigName === normOrigName) return true;
           if (iNormName && normName && iNormName === normName) return true;
           
           // Season grouping blocker
           const iBaseNormName = normalizeName(getBaseName(i.name));
           if (baseNormName && iBaseNormName && baseNormName === iBaseNormName) return true;
           
           return false;
        });

        if (!existing && !slugs.has(item.slug)) {
          slugs.add(item.slug);
          allItems.push(item);
        }
      });
    } else if (res.status === 'rejected') {
      console.warn('One of the search apis failed', res.reason);
    }
  });

  return { items: allItems };
};
