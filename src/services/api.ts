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
      thumb_url: item.thumb_url,
      poster_url: item.poster_url,
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
  const movie = data.movie;
  const episodes = (movie?.episodes || []).map((server: any) => ({
    server_name: server.server_name || 'NguonC',
    items: (server.items || []).map((ep: any) => ({
      name: ep.name,
      slug: ep.slug,
      embed: ep.embed || ep.link_embed || '',
      m3u8: ep.m3u8 || ep.link_m3u8 || '',
    })),
  }));
  
  return {
    movie: {
      ...movie,
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
        thumb_url: item.thumb_url,
        poster_url: item.poster_url,
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
      thumb_url: item.thumb_url,
      poster_url: item.poster_url,
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
  const movie = data.movie || data.data?.item;
  
  if (!movie) throw new Error('VSMov no movie data');

  const episodes = (movie.episodes || data.episodes || data.data?.item?.episodes || []).map((server: any) => ({
    server_name: server.server_name || 'VSMov',
    items: (server.server_data || server.items || []).map((ep: any) => ({
      name: ep.name,
      slug: ep.slug,
      embed: ep.link_embed || ep.embed || '',
      m3u8: ep.link_m3u8 || ep.m3u8 || '',
    })),
  }));

  return {
    movie: {
      name: movie.name,
      slug: movie.slug,
      original_name: movie.origin_name || movie.original_name,
      description: movie.content || movie.description,
      thumb_url: movie.thumb_url,
      poster_url: movie.poster_url,
      quality: movie.quality,
      language: movie.lang || movie.language,
      time: movie.time,
      current_episode: movie.episode_current,
      total_episodes: movie.episode_total,
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
      thumb_url: item.thumb_url,
      poster_url: item.poster_url,
      year: item.year,
      _source: 'VSMov',
    })),
    pagination: data.pagination || data.data?.params?.pagination,
  };
};


// =====================================================
// PUBLIC API — Auto-failover & Merging
// =====================================================

export const fetchMovies = async (endpoint: string, page: number = 1) => {
  const results = await Promise.allSettled([
    fetchWithTimeout(phimapiFetchList(endpoint, page), 6000),
    fetchWithTimeout(nguoncFetchList(endpoint, page), 6000),
    fetchWithTimeout(vsmovFetchList(endpoint, page), 6000)
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
        const existing = allItems.find(i => i.slug === item.slug || (i.original_name && i.original_name === item.original_name));
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
  const results = await Promise.allSettled([
    fetchWithTimeout(phimapiFetchDetail(slug), 8000),
    fetchWithTimeout(nguoncFetchDetail(slug), 8000),
    fetchWithTimeout(vsmovFetchDetail(slug), 8000)
  ]);

  let baseMovie: any = null;
  const allEpisodes: any[] = [];

  const addMovieData = (result: any, sourceName: string) => {
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
  addMovieData(results[0], 'PhimAPI');
  addMovieData(results[1], 'NguonC');
  addMovieData(results[2], 'VSMov');

  if (!baseMovie) {
    throw new Error('All sources failed or movie not found');
  }

  // Deduplicate servers just in case
  baseMovie.episodes = allEpisodes;

  return { movie: baseMovie };
};

export const searchMovies = async (keyword: string) => {
  const results = await Promise.allSettled([
    fetchWithTimeout(phimapiSearch(keyword), 6000),
    fetchWithTimeout(nguoncSearch(keyword), 6000),
    fetchWithTimeout(vsmovSearch(keyword), 6000)
  ]);
  
  const allItems: any[] = [];
  const slugs = new Set();
  
  results.forEach((res) => {
    if (res.status === 'fulfilled' && res.value?.items) {
      res.value.items.forEach((item: any) => {
        const existing = allItems.find(i => i.slug === item.slug || (i.original_name && i.original_name === item.original_name));
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
