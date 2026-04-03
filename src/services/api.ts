// =====================================================
// Multi-Source API with automatic failover
// Priority: phimapi.com > vsmov.com > phim.nguonc.com
// =====================================================

interface MovieListResult {
  items: any[];
  pagination?: any;
}

interface MovieDetailResult {
  movie: any;
  episodes: any[];
}

interface SearchResult {
  items: any[];
  pagination?: any;
}

// =====================================================
// Source 1: phimapi.com (Primary - best player sources)
// =====================================================
const PHIMAPI_URL = 'https://phimapi.com';

const phimapiNormalizeListItem = (item: any) => ({
  name: item.name,
  slug: item.slug,
  original_name: item.origin_name,
  thumb_url: item.thumb_url || item.poster_url,
  poster_url: item.poster_url || item.thumb_url,
  year: item.year,
  _source: 'phimapi',
});

const phimapiFetchList = async (endpoint: string, page: number): Promise<MovieListResult> => {
  // Map NguonC-style endpoints to phimapi endpoints
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
  if (!res.ok) throw new Error(`phimapi list failed: ${res.status}`);
  const data = await res.json();

  // phimapi /danh-sach returns { items: [...] }
  // phimapi /v1/api returns { data: { items: [...] } }
  const items = data.items || data.data?.items || [];
  return {
    items: items.map(phimapiNormalizeListItem),
    pagination: data.pagination || data.data?.params?.pagination,
  };
};

const phimapiNormalizeEpisode = (ep: any) => ({
  name: ep.name,
  slug: ep.slug,
  embed: ep.link_embed || '',
  m3u8: ep.link_m3u8 || '',
});

const phimapiFetchDetail = async (slug: string): Promise<MovieDetailResult> => {
  const res = await fetch(`${PHIMAPI_URL}/phim/${slug}`);
  if (!res.ok) throw new Error(`phimapi detail failed: ${res.status}`);
  const data = await res.json();

  const movie = data.movie;
  const episodes = (data.episodes || []).map((server: any) => ({
    server_name: server.server_name,
    items: (server.server_data || []).map(phimapiNormalizeEpisode),
  }));

  return {
    movie: {
      ...movie,
      name: movie.name,
      slug: movie.slug,
      original_name: movie.origin_name,
      description: movie.content,
      thumb_url: movie.thumb_url,
      poster_url: movie.poster_url,
      quality: movie.quality,
      language: movie.lang,
      time: movie.time,
      current_episode: movie.episode_current,
      total_episodes: movie.episode_total,
      director: Array.isArray(movie.director) ? movie.director.join(', ') : movie.director,
      casts: Array.isArray(movie.actor) ? movie.actor.join(', ') : movie.actor,
      _source: 'phimapi',
    },
    episodes,
  };
};

const phimapiSearch = async (keyword: string): Promise<SearchResult> => {
  const res = await fetch(`${PHIMAPI_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error(`phimapi search failed: ${res.status}`);
  const data = await res.json();
  const items = data.data?.items || [];
  return {
    items: items.map(phimapiNormalizeListItem),
    pagination: data.data?.params?.pagination,
  };
};

// =====================================================
// Source 2: phim.nguonc.com (Backup)
// =====================================================
const NGUONC_URL = 'https://phim.nguonc.com/api';

const nguoncNormalizeListItem = (item: any) => ({
  name: item.name,
  slug: item.slug,
  original_name: item.original_name,
  thumb_url: item.thumb_url,
  poster_url: item.poster_url,
  year: item.year,
  _source: 'nguonc',
});

const nguoncFetchList = async (endpoint: string, page: number): Promise<MovieListResult> => {
  const res = await fetch(`${NGUONC_URL}${endpoint}?page=${page}`);
  if (!res.ok) throw new Error(`nguonc list failed: ${res.status}`);
  const data = await res.json();
  return {
    items: (data.items || []).map(nguoncNormalizeListItem),
    pagination: data.pagination,
  };
};

const nguoncFetchDetail = async (slug: string): Promise<MovieDetailResult> => {
  const res = await fetch(`${NGUONC_URL}/film/${slug}`);
  if (!res.ok) throw new Error(`nguonc detail failed: ${res.status}`);
  const data = await res.json();
  return {
    movie: { ...data.movie, _source: 'nguonc' },
    episodes: data.movie?.episodes || [],
  };
};

const nguoncSearch = async (keyword: string): Promise<SearchResult> => {
  const res = await fetch(`${NGUONC_URL}/films/search?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error(`nguonc search failed: ${res.status}`);
  const data = await res.json();
  return {
    items: (data.items || []).map(nguoncNormalizeListItem),
    pagination: data.pagination,
  };
};

// =====================================================
// Source 3: vsmov.com (Backup for listings)
// =====================================================
const VSMOV_URL = 'https://vsmov.com/api';

const vsmovNormalizeListItem = (item: any) => ({
  name: item.name,
  slug: item.slug,
  original_name: item.origin_name,
  thumb_url: typeof item.thumb_url === 'string' ? item.thumb_url : '',
  poster_url: typeof item.poster_url === 'string' ? item.poster_url : '',
  year: item.year,
  _source: 'vsmov',
});

const vsmovFetchList = async (endpoint: string, page: number): Promise<MovieListResult> => {
  let vsmovEndpoint = endpoint;
  if (endpoint === '/films/phim-moi-cap-nhat') vsmovEndpoint = '/danh-sach/phim-moi-cap-nhat';
  else if (endpoint.startsWith('/films/danh-sach/')) vsmovEndpoint = endpoint.replace('/films/danh-sach/', '/danh-sach/');
  else if (endpoint.startsWith('/films/the-loai/')) vsmovEndpoint = endpoint.replace('/films/the-loai/', '/the-loai/');
  else if (endpoint.startsWith('/films/quoc-gia/')) vsmovEndpoint = endpoint.replace('/films/quoc-gia/', '/quoc-gia/');

  const res = await fetch(`${VSMOV_URL}${vsmovEndpoint}?page=${page}`);
  if (!res.ok) throw new Error(`vsmov list failed: ${res.status}`);
  const data = await res.json();
  return {
    items: (data.items || []).map(vsmovNormalizeListItem),
    pagination: data.pagination,
  };
};

// =====================================================
// Multi-Source Orchestrator
// =====================================================

const fetchWithTimeout = (promise: Promise<any>, ms: number = 8000): Promise<any> => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
  ]);
};

export const fetchMovies = async (endpoint: string, page: number = 1): Promise<any> => {
  // Try sources in priority order
  const sources = [
    () => fetchWithTimeout(phimapiFetchList(endpoint, page)),
    () => fetchWithTimeout(nguoncFetchList(endpoint, page)),
    () => fetchWithTimeout(vsmovFetchList(endpoint, page)),
  ];

  for (const source of sources) {
    try {
      const result = await source();
      if (result.items && result.items.length > 0) return result;
    } catch (err) {
      console.warn('Source failed, trying next:', err);
    }
  }

  return { items: [] };
};

export const fetchMovieDetail = async (slug: string): Promise<any> => {
  // Try sources in priority order
  const sources = [
    () => fetchWithTimeout(phimapiFetchDetail(slug)),
    () => fetchWithTimeout(nguoncFetchDetail(slug)),
  ];

  for (const source of sources) {
    try {
      const result = await source();
      if (result.movie) {
        // Merge episodes into movie object for compatibility
        return {
          movie: {
            ...result.movie,
            episodes: result.episodes,
          },
        };
      }
    } catch (err) {
      console.warn('Detail source failed, trying next:', err);
    }
  }

  throw new Error('All movie detail sources failed');
};

export const searchMovies = async (keyword: string): Promise<any> => {
  const sources = [
    () => fetchWithTimeout(phimapiSearch(keyword)),
    () => fetchWithTimeout(nguoncSearch(keyword)),
  ];

  for (const source of sources) {
    try {
      const result = await source();
      if (result.items) return result;
    } catch (err) {
      console.warn('Search source failed, trying next:', err);
    }
  }

  return { items: [] };
};
