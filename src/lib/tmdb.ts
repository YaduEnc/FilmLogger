import { Movie } from "@/types/movie";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

interface TMDBMovie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  runtime?: number;
  genres?: { id: number; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  overview?: string;
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  credits?: {
    crew?: { job: string; name: string }[];
    cast?: { name: string; character: string; order: number }[];
  };
  videos?: {
    results: { key: string; site: string; type: string }[];
  };
}

interface TMDBSearchResponse {
  results: TMDBMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

function transformMovie(tmdbMovie: TMDBMovie): Movie {
  const director = tmdbMovie.credits?.crew?.find((c) => c.job === "Director")?.name;
  const cast = tmdbMovie.credits?.cast?.slice(0, 10).map((c) => c.name);
  const trailer = tmdbMovie.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );

  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title,
    year: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.split("-")[0]) : 0,
    posterUrl: tmdbMovie.poster_path
      ? `${TMDB_IMAGE_BASE}/w500${tmdbMovie.poster_path}`
      : undefined,
    backdropUrl: tmdbMovie.backdrop_path
      ? `${TMDB_IMAGE_BASE}/original${tmdbMovie.backdrop_path}`
      : undefined,
    runtime: tmdbMovie.runtime,
    genres: tmdbMovie.genres?.map((g) => g.name),
    countries: tmdbMovie.production_countries?.map((c) => c.name),
    director,
    cast,
    synopsis: tmdbMovie.overview,
    language: tmdbMovie.original_language?.toUpperCase(),
    rating: tmdbMovie.vote_average,
    voteCount: tmdbMovie.vote_count,
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
  };
}

async function fetchTMDB(endpoint: string): Promise<any> {
  const url = `${TMDB_BASE_URL}${endpoint}`;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`
    }
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function searchMovies(query: string, page = 1): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  try {
    const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`);

    return {
      movies: data.results.map(transformMovie),
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("TMDB search error:", error);
    throw new Error("Failed to search movies");
  }
}

export async function getMovieDetails(movieId: number): Promise<Movie> {
  try {
    const data = await fetchTMDB(`/movie/${movieId}?append_to_response=credits,videos`);
    return transformMovie(data);
  } catch (error) {
    console.error("TMDB movie error:", error);
    throw new Error("Failed to fetch movie details");
  }
}

export async function getPopularMovies(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  try {
    const data = await fetchTMDB(`/movie/popular?page=${page}`);

    return {
      movies: data.results.map(transformMovie),
      totalPages: data.total_pages,
    };
  } catch (error) {
    console.error("TMDB popular error:", error);
    throw new Error("Failed to fetch popular movies");
  }
}

export async function getTrendingMovies(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  try {
    const data = await fetchTMDB(`/trending/movie/week?page=${page}`);

    return {
      movies: data.results.map(transformMovie),
      totalPages: data.total_pages,
    };
  } catch (error) {
    console.error("TMDB trending error:", error);
    throw new Error("Failed to fetch trending movies");
  }
}

export function getPosterUrl(posterPath: string | undefined, size: "w92" | "w154" | "w185" | "w300" | "w500" | "original" = "w300"): string | undefined {
  if (!posterPath) return undefined;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}
