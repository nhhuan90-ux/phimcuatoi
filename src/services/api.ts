const BASE_URL = 'https://phim.nguonc.com/api';

export const fetchMovies = async (endpoint: string, page: number = 1) => {
  const response = await fetch(`${BASE_URL}${endpoint}?page=${page}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export const fetchMovieDetail = async (slug: string) => {
  const response = await fetch(`${BASE_URL}/film/${slug}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export const searchMovies = async (keyword: string) => {
  const response = await fetch(`${BASE_URL}/films/search?keyword=${encodeURIComponent(keyword)}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};
