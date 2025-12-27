export interface Movie {
  id: number;
  title: string;
  year: number;
  posterUrl?: string;
  runtime?: number;
  genres?: string[];
  director?: string;
  directorId?: number;
  cast?: string[];
  castMembers?: { id: number; name: string; character?: string; profileUrl?: string }[];
  synopsis?: string;
  language?: string;
  countries?: string[];
  rating?: number;
  voteCount?: number;
  backdropUrl?: string;
  trailerUrl?: string;
}

export interface LogEntry {
  id: string;
  movieId: number;
  movie: Movie;
  watchedDate: string;
  rating: number;
  reviewShort?: string;
  diaryLong?: string;
  tags: string[];
  mood?: string;
  location?: string;
  visibility: 'private' | 'followers' | 'public';
  isRewatch: boolean;
  rewatchCount: number;
  favoriteScenes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MovieList {
  id: string;
  name: string;
  description?: string;
  visibility: 'private' | 'followers' | 'public';
  movies: Movie[];
  createdAt: string;
}

export interface UserStats {
  totalWatched: number;
  thisYearWatched: number;
  avgRating: number;
  totalHours: number;
  topGenres: { name: string; count: number }[];
  topDirectors: { name: string; count: number }[];
  topCountries: { name: string; count: number }[];
  filmsPerMonth: { month: string; count: number }[];
  listCount?: number;
  connectionCount?: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  photoURL?: string;
  isPublic: boolean;
  stats?: UserStats;
  createdAt: string;
}

export interface ConnectionStatus {
  status: 'none' | 'pending' | 'accepted' | 'rejected' | 'incoming';
  requestId?: string;
}

export interface Review {
  id: string;
  movieId: number;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  spoilerFlag: boolean;
  visibility: 'public' | 'connections';
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  spoilerFlag: boolean;
  likeCount: number;
  createdAt: string;
}
