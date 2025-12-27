import { Movie } from "@/types/movie";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

interface TMDBMovie {
  id: number;
  title?: string;
  name?: string; // For TV
  release_date?: string;
  first_air_date?: string; // For TV
  poster_path?: string;
  backdrop_path?: string;
  runtime?: number;
  episode_run_time?: number[]; // For TV
  genres?: { id: number; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  overview?: string;
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: {
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
    episode_count: number;
    air_date: string;
  }[];
  credits?: {
    crew?: { id: number; job: string; name: string; profile_path?: string }[];
    cast?: { id: number; name: string; character: string; order: number; profile_path?: string }[];
  };
  videos?: {
    results: { key: string; site: string; type: string }[];
  };
  created_by?: { id: number; name: string; profile_path?: string }[];
  networks?: { id: number; name: string; logo_path?: string }[];
  status?: string;
  type?: string;
  last_air_date?: string;
}

interface TMDBSearchResponse {
  results: TMDBMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

function transformMovie(tmdbMovie: TMDBMovie): Movie {
  const directorInfo = tmdbMovie.credits?.crew?.find((c) => c.job === "Director");
  const directorId = directorInfo?.id;
  const director = directorInfo?.name;

  const cast = tmdbMovie.credits?.cast?.slice(0, 10).map((c) => c.name);
  const castMembers = tmdbMovie.credits?.cast?.slice(0, 10).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profileUrl: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : undefined
  }));

  const trailer = tmdbMovie.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );

  const isTV = !!tmdbMovie.first_air_date;
  const title = tmdbMovie.title || tmdbMovie.name || "Untitled";
  const date = tmdbMovie.release_date || tmdbMovie.first_air_date;
  const year = date ? parseInt(date.split("-")[0]) : 0;

  return {
    id: tmdbMovie.id,
    title,
    year,
    posterUrl: tmdbMovie.poster_path
      ? `${TMDB_IMAGE_BASE}/w500${tmdbMovie.poster_path}`
      : undefined,
    backdropUrl: tmdbMovie.backdrop_path
      ? `${TMDB_IMAGE_BASE}/original${tmdbMovie.backdrop_path}`
      : undefined,
    runtime: tmdbMovie.runtime || (tmdbMovie.episode_run_time?.[0]),
    genres: tmdbMovie.genres?.map((g) => g.name),
    countries: tmdbMovie.production_countries?.map((c) => c.name),
    director,
    directorId,
    cast,
    castMembers,
    synopsis: tmdbMovie.overview,
    language: tmdbMovie.original_language?.toUpperCase(),
    rating: tmdbMovie.vote_average,
    voteCount: tmdbMovie.vote_count,
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,

    // TV Specific
    mediaType: isTV ? 'tv' : 'movie',
    firstAirDate: tmdbMovie.first_air_date,
    numberOfSeasons: tmdbMovie.number_of_seasons,
    numberOfEpisodes: tmdbMovie.number_of_episodes,
    seasons: tmdbMovie.seasons,
    createdBy: tmdbMovie.created_by?.map(c => ({
      id: c.id,
      name: c.name,
      profileUrl: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : undefined
    })),
    networks: tmdbMovie.networks?.map(n => ({
      id: n.id,
      name: n.name,
      logoUrl: n.logo_path ? `${TMDB_IMAGE_BASE}/w92${n.logo_path}` : undefined
    })),
    status: tmdbMovie.status,
    type: tmdbMovie.type,
    lastAirDate: tmdbMovie.last_air_date
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

export async function getTrendingMovies(page = 1, timeWindow: 'day' | 'week' = 'week'): Promise<{ movies: Movie[]; totalPages: number }> {
  try {
    const data = await fetchTMDB(`/trending/movie/${timeWindow}?page=${page}`);
    return {
      movies: data.results.map(transformMovie),
      totalPages: data.total_pages,
    };
  } catch (error) {
    console.error("TMDB trending error:", error);
    throw new Error("Failed to fetch trending movies");
  }
}

// TV API Methods

export async function searchTV(query: string, page = 1): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  try {
    const data = await fetchTMDB(`/search/tv?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`);
    return {
      movies: data.results.map(transformMovie),
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("TMDB search tv error:", error);
    throw new Error("Failed to search tv shows");
  }
}

export async function getTVDetails(tvId: number): Promise<Movie> {
  try {
    const data = await fetchTMDB(`/tv/${tvId}?append_to_response=credits,videos`);
    return transformMovie(data);
  } catch (error) {
    console.error("TMDB tv details error:", error);
    throw new Error("Failed to fetch tv details");
  }
}

export async function getPopularTV(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  try {
    const data = await fetchTMDB(`/tv/popular?page=${page}`);
    return {
      movies: data.results.map(transformMovie),
      totalPages: data.total_pages,
    };
  } catch (error) {
    console.error("TMDB popular tv error:", error);
    throw new Error("Failed to fetch popular tv shows");
  }
}

export async function getTrendingTV(page = 1, timeWindow: 'day' | 'week' = 'week'): Promise<{ movies: Movie[]; totalPages: number }> {
  try {
    const data = await fetchTMDB(`/trending/tv/${timeWindow}?page=${page}`);
    return {
      movies: data.results.map(transformMovie),
      totalPages: data.total_pages,
    };
  } catch (error) {
    console.error("TMDB trending tv error:", error);
    throw new Error("Failed to fetch trending tv shows");
  }
}

export async function getTopRatedTV(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  try {
    const data = await fetchTMDB(`/tv/top_rated?page=${page}`);
    return {
      movies: data.results.map(transformMovie),
      totalPages: data.total_pages,
    };
  } catch (error) {
    console.error("TMDB top rated tv error:", error);
    throw new Error("Failed to fetch top rated tv shows");
  }
}

export async function getOnTheAirTV(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  try {
    const data = await fetchTMDB(`/tv/on_the_air?page=${page}`);
    return {
      movies: data.results.map(transformMovie),
      totalPages: data.total_pages,
    };
  } catch (error) {
    console.error("TMDB on the air tv error:", error);
    throw new Error("Failed to fetch on the air tv shows");
  }
}

export function getPosterUrl(posterPath: string | undefined, size: "w92" | "w154" | "w185" | "w300" | "w500" | "original" = "w300"): string | undefined {
  if (!posterPath) return undefined;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

export async function getPersonDetails(personId: number): Promise<any> {
  try {
    const data = await fetchTMDB(`/person/${personId}`);
    return {
      id: data.id,
      name: data.name,
      biography: data.biography,
      birthday: data.birthday,
      place_of_birth: data.place_of_birth,
      profile_path: data.profile_path ? `${TMDB_IMAGE_BASE}/original${data.profile_path}` : undefined,
      known_for_department: data.known_for_department
    };
  } catch (error) {
    console.error("TMDB person details error:", error);
    throw new Error("Failed to fetch person details");
  }
}

export async function getPersonCredits(personId: number): Promise<Movie[]> {
  try {
    const data = await fetchTMDB(`/person/${personId}/movie_credits`);
    const cast = data.cast || [];
    const crew = data.crew || [];

    // Combine and deduplicate by ID
    const all = [...cast, ...crew].reduce((acc, current) => {
      const x = acc.find((item: any) => item.id === current.id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    // Sort by popularity to show best known work first
    const sorted = all.sort((a: any, b: any) => b.popularity - a.popularity);

    return sorted.map(transformMovie);
  } catch (error) {
    console.error("TMDB person credits error:", error);
    throw new Error("Failed to fetch person credits");
  }
}
