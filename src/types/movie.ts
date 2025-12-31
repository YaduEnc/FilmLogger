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
  // Enhanced Media
  videos?: { key: string; name: string; type: string; official?: boolean }[];
  backdrops?: { url: string; width: number; height: number }[];
  posters?: { url: string; width: number; height: number }[];
  productionCompanies?: { id: number; name: string; logoUrl?: string; originCountry?: string }[];
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
    episodes?: {
      id: number;
      name: string;
      overview: string;
      still_path?: string;
      episode_number: number;
      air_date: string;
      runtime?: number;
      vote_average?: number;
    }[];
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
  // TV Show Progress
  currentSeason?: number;
  currentEpisode?: number;
  totalSeasons?: number;
  totalEpisodes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TVProgress {
  id: string;
  userId: string;
  tvId: number;
  tvTitle: string;
  tvPosterUrl?: string;
  currentSeason: number;
  currentEpisode: number;
  totalSeasons: number;
  totalEpisodes: number;
  lastWatchedDate: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MovieList {
  id: string;
  userId?: string;
  userName?: string;
  userPhoto?: string;
  name: string;
  description?: string;
  visibility: 'private' | 'followers' | 'public';
  movies: Movie[];
  createdAt: string;
  updatedAt?: string;
  // Engagement metrics
  likeCount?: number;
  saveCount?: number;
  commentCount?: number;
  viewCount?: number;
  // Categorization
  tags?: string[];
  listType?: 'standard' | 'ranked' | 'watchlist' | 'collaborative';
  isRanked?: boolean;
  // Collaboration
  collaborators?: string[];
  collaboratorDetails?: { id: string; name: string; photo?: string }[];
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
  top5Movies?: Movie[];
  createdAt: string;
}

export interface ConnectionStatus {
  status: 'none' | 'pending' | 'accepted' | 'rejected' | 'incoming';
  requestId?: string;
}

export interface Review {
  id: string;
  movieId: number;
  movieTitle?: string;
  moviePoster?: string;
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

// ==================== ACTIVITY FEED ====================
export type ActivityType =
  | 'log'
  | 'review'
  | 'list_created'
  | 'favorite'
  | 'connection'
  | 'poll_created'
  | 'debate_created'
  | 'list_comment'
  | 'debate_comment';

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  type: ActivityType;
  createdAt: string;

  // Activity-specific data
  movieId?: number;
  movieTitle?: string;
  moviePoster?: string;
  mediaType?: 'movie' | 'tv';
  rating?: number;
  reviewText?: string;
  listId?: string;
  listName?: string;
  pollId?: string;
  pollQuestion?: string;
  debateId?: string;
  debateTitle?: string;
  connectedUserId?: string;
  connectedUserName?: string;
  tvProgress?: string; // Format: "S1E5" for Season 1 Episode 5
}

// ==================== MOVIE STATISTICS ====================
export interface MovieStats {
  movieId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterUrl?: string;

  // Engagement metrics
  logCount: number; // How many times logged
  favoriteCount: number; // How many favorites
  reviewCount: number; // How many reviews
  avgRating: number; // Average rating
  watchlistCount: number; // How many in watchlists

  // Time-based metrics
  weeklyLogs: number;
  monthlyLogs: number;

  lastUpdated: string;
}

// ==================== USER RECOMMENDATIONS ====================
export interface UserRecommendation {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  bio?: string;

  // Recommendation score factors
  commonMovies: number; // Number of movies in common
  commonGenres: string[]; // Shared favorite genres
  activityScore: number; // How active they are
  isNewUser: boolean; // Joined recently

  // Display stats
  totalWatched: number;
  reviewCount: number;

  recommendationScore: number; // Overall score
}

// ==================== ADMIN ANALYTICS ====================
export interface AdminStats {
  // User Metrics
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;

  // Content Metrics
  totalLogs: number;
  newLogsToday: number;
  newLogsThisWeek: number;
  totalReviews: number;
  newReviewsToday: number;
  newReviewsThisWeek: number;
  totalLists: number;
  newListsToday: number;
  totalComments: number;
  newCommentsToday: number;

  // Engagement Metrics
  totalConnections: number;
  newConnectionsToday: number;
  totalPolls: number;
  newPollsToday: number;
  totalDebates: number;
  newDebatesToday: number;
  totalMessages: number;
  newMessagesToday: number;

  // Growth Trends
  userGrowth: { date: string; count: number }[];
  activityGrowth: { date: string; logs: number; reviews: number; comments: number }[];

  // Top Content
  topMovies: { movieId: number; title: string; logCount: number; favoriteCount: number }[];
  topUsers: { uid: string; username: string; displayName: string; activityCount: number }[];

  // Time-based breakdowns
  hourlyActivity: { hour: number; count: number }[];
  dailyActivity: { date: string; count: number }[];
}

// ==================== ANNOUNCEMENTS ====================
export interface Announcement {
  id: string;
  title: string;
  content: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  articleUrl?: string;
  imageUrl?: string;
  category: 'news' | 'trailer' | 'release' | 'update' | 'event';
  isActive: boolean;
  isPinned: boolean;
  authorUid: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

// ==================== NOTIFICATIONS ====================
export type NotificationType =
  | 'like_list'
  | 'save_list'
  | 'comment_list'
  | 'like_review'
  | 'comment_review'
  | 'like_comment'
  | 'follow'
  | 'connection_request';

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;

  // Action context
  listId?: string;
  listName?: string;
  movieId?: number;
  movieTitle?: string;
  reviewId?: string;
  commentId?: string;
  text?: string; // e.g., the comment text
}
