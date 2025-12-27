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
  // TV Specific
  mediaType?: 'movie' | 'tv';
  firstAirDate?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasons?: {
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
    episode_count: number;
    air_date: string;
  }[];
  createdBy?: { id: number; name: string; profileUrl?: string }[];
  networks?: { id: number; name: string; logoUrl?: string }[];
  status?: string;
  type?: string;
  lastAirDate?: string;
}

export interface LogEntry {
  id: string;
  movieId: number;
  movie: Movie;
  mediaType: 'movie' | 'tv';
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
  mediaType: 'movie' | 'tv';
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

// Community Features
export interface Poll {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  question: string;
  pollType: 'best_movie' | 'best_actor' | 'best_director' | 'best_genre' | 'custom';
  options: PollOption[];
  totalVotes: number;
  endsAt?: string;
  createdAt: string;
  tags?: string[]; // For tagging movies, actors, directors
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  movieId?: number; // If option is a movie
  personId?: number; // If option is an actor/director
  posterUrl?: string; // Movie poster URL
}

export interface PollVote {
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: string;
}

export interface Debate {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  title: string;
  description: string;
  side1: string; // e.g., "Marvel is better"
  side2: string; // e.g., "DC is better"
  side1Votes: number;
  side2Votes: number;
  commentCount: number;
  tags?: string[];
  createdAt: string;
}

export interface DebateVote {
  debateId: string;
  side: 1 | 2;
  userId: string;
  createdAt: string;
}

export interface DebateComment {
  id: string;
  debateId: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  side: 1 | 2 | null; // Which side they support, or neutral
  likeCount: number;
  createdAt: string;
}

export interface ListComment {
  id: string;
  listId: string;
  listOwnerId: string;
  authorUid: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  likeCount: number;
  createdAt: string;
}

// ==================== MESSAGING ====================
export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  participantNames: { [userId: string]: string };
  participantPhotos: { [userId: string]: string };
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId: string;
  unreadCount: { [userId: string]: number };
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  movieId?: number; // If sharing a movie
  movieTitle?: string;
  moviePoster?: string;
  mediaType?: 'movie' | 'tv';
  read: boolean;
  createdAt: string;
}

