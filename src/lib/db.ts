import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    updateDoc,
    arrayUnion,
    runTransaction
} from "firebase/firestore";
import { db } from "./firebase";
import { LogEntry, Movie, MovieList, Review, ReviewComment, TVProgress } from "@/types/movie";

// Community Ratings & Genres
export const updateCommunityRating = async (userId: string, mediaId: string, mediaType: 'movie' | 'tv', rating: number) => {
    try {
        const docId = `${mediaType}_${mediaId}`;
        const ratingRef = doc(db, "community_ratings", docId);
        const userRatingRef = doc(db, "community_ratings", docId, "user_ratings", userId);

        await runTransaction(db, async (transaction) => {
            const ratingDoc = await transaction.get(ratingRef);
            const userRatingDoc = await transaction.get(userRatingRef);

            let newTotal = 0;
            let newSum = 0;

            if (!ratingDoc.exists()) {
                // Initialize if doesn't exist
                newTotal = 1;
                newSum = rating;
                transaction.set(ratingRef, {
                    mediaId,
                    mediaType,
                    totalRatings: newTotal,
                    sumRatings: newSum,
                    averageRating: rating,
                    genreVotes: {},
                    topGenres: [],
                    lastUpdated: serverTimestamp()
                });
            } else {
                const data = ratingDoc.data();
                const currentTotal = data.totalRatings || 0;
                const currentSum = data.sumRatings || 0;

                if (userRatingDoc.exists()) {
                    // Updating existing rating
                    const oldRating = userRatingDoc.data().rating;
                    newTotal = currentTotal; // Count doesn't change
                    newSum = currentSum - oldRating + rating;
                } else {
                    // New rating
                    newTotal = currentTotal + 1;
                    newSum = currentSum + rating;
                }

                transaction.update(ratingRef, {
                    totalRatings: newTotal,
                    sumRatings: newSum,
                    averageRating: newSum / newTotal,
                    lastUpdated: serverTimestamp()
                });
            }

            transaction.set(userRatingRef, {
                rating,
                timestamp: serverTimestamp()
            });
        });
    } catch (error) {
        console.error("Error updating community rating:", error);
        throw error;
    }
};

export const voteGenre = async (userId: string, mediaId: string, mediaType: 'movie' | 'tv', genres: string[]) => {
    try {
        const docId = `${mediaType}_${mediaId}`;
        const ratingRef = doc(db, "community_ratings", docId);
        const userVoteRef = doc(db, "community_ratings", docId, "genre_votes", userId);

        await runTransaction(db, async (transaction) => {
            const ratingDoc = await transaction.get(ratingRef);
            const userVoteDoc = await transaction.get(userVoteRef);

            let genreVotes: Record<string, number> = {};

            if (ratingDoc.exists()) {
                genreVotes = ratingDoc.data().genreVotes || {};
            } else {
                // Initialize doc if needed (though usually rating comes first)
                transaction.set(ratingRef, {
                    mediaId,
                    mediaType,
                    totalRatings: 0,
                    sumRatings: 0,
                    averageRating: 0,
                    genreVotes: {},
                    topGenres: [],
                    lastUpdated: serverTimestamp()
                });
            }

            // Remove old votes if any area existing
            if (userVoteDoc.exists()) {
                const oldGenres = userVoteDoc.data().genres as string[];
                oldGenres.forEach(g => {
                    if (genreVotes[g]) {
                        genreVotes[g] = Math.max(0, genreVotes[g] - 1);
                        if (genreVotes[g] === 0) delete genreVotes[g];
                    }
                });
            }

            // Add new votes
            genres.forEach(g => {
                const standardizedGenre = g.trim(); // We rely on UI for capitalization consistency for now, or normalize here
                genreVotes[standardizedGenre] = (genreVotes[standardizedGenre] || 0) + 1;
            });

            // Calculate top 5
            const topGenres = Object.entries(genreVotes)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name]) => name);

            if (ratingDoc.exists()) {
                transaction.update(ratingRef, {
                    genreVotes,
                    topGenres
                });
            } else {
                transaction.set(ratingRef, {
                    mediaId,
                    mediaType,
                    totalRatings: 0,
                    sumRatings: 0,
                    averageRating: 0,
                    genreVotes,
                    topGenres,
                    lastUpdated: serverTimestamp()
                });
            }

            transaction.set(userVoteRef, {
                genres,
                timestamp: serverTimestamp()
            });
        });
    } catch (error) {
        console.error("Error voting genre:", error);
        throw error;
    }
};

export const getCommunityRating = async (mediaId: string, mediaType: 'movie' | 'tv') => {
    try {
        const docRef = doc(db, "community_ratings", `${mediaType}_${mediaId}`);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error getting community rating:", error);
        return null;
    }
};

export const getUserCommunityInteraction = async (userId: string, mediaId: string, mediaType: 'movie' | 'tv') => {
    try {
        const docId = `${mediaType}_${mediaId}`;
        const ratingRef = doc(db, "community_ratings", docId, "user_ratings", userId);
        const voteRef = doc(db, "community_ratings", docId, "genre_votes", userId);

        const [ratingSnap, voteSnap] = await Promise.all([getDoc(ratingRef), getDoc(voteRef)]);

        return {
            rating: ratingSnap.exists() ? ratingSnap.data().rating : null,
            genres: voteSnap.exists() ? voteSnap.data().genres : []
        };
    } catch (error) {
        console.error("Error getting user interaction:", error);
        return { rating: null, genres: [] };
    }
};



export const createLogEntry = async (userId: string, entry: Omit<LogEntry, "id" | "createdAt" | "updatedAt">) => {
    try {
        const logsRef = collection(db, "users", userId, "logs");
        
        // Check if this is a rewatch
        const existingLogsQuery = query(
            logsRef,
            where('movieId', '==', entry.movieId)
        );
        const existingLogs = await getDocs(existingLogsQuery);
        const isRewatch = existingLogs.size > 0;
        const rewatchCount = existingLogs.size;
        
        // Clean undefined fields from the movie object and the entire entry
        const cleanedEntry = cleanUndefinedFields({
            ...entry,
            movie: cleanUndefinedFields(entry.movie), 
            userId, 
            isRewatch,
            rewatchCount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            watchedDate: Timestamp.fromDate(new Date(entry.watchedDate))
        });
        
        const docRef = await addDoc(logsRef, cleanedEntry);

        // Update community rating if rating is provided
        if (entry.rating > 0) {
            // We don't await this to keep UI snappy, but we catch errors
            updateCommunityRating(userId, entry.movieId.toString(), entry.mediaType, entry.rating)
                .catch(err => console.error("Failed to update community rating:", err));
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating log entry:", error);
        throw error;
    }
};

export const getUserLogs = async (userId: string, options: { currentUserId?: string, isConnection?: boolean, limitCount?: number } = {}) => {
    const { currentUserId, isConnection = false, limitCount = 50 } = options;
    try {
        const logsRef = collection(db, "users", userId, "logs");
        let q = query(
            logsRef,
            orderBy("watchedDate", "desc"),
            limit(limitCount)
        );



        const querySnapshot = await getDocs(q);
        let logs = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                watchedDate: safeTimestampToISO(data.watchedDate),
                createdAt: safeTimestampToISO(data.createdAt),
                updatedAt: safeTimestampToISO(data.updatedAt),
            } as LogEntry;
        });

        // If viewing someone else's profile, filter by visibility
        if (currentUserId !== userId) {
            logs = logs.filter(log => {
                if (log.visibility === 'public') return true;
                if (log.visibility === 'followers' && isConnection) return true;
                return false;
            });
        }

        return logs;
    } catch (error) {
        console.error("Error getting user logs:", error);
        throw error;
    }
};


export const getMovieLogs = async (userId: string, movieId: number, mediaType: 'movie' | 'tv' = 'movie') => {
    try {
        const logsRef = collection(db, "users", userId, "logs");
        const q = query(
            logsRef,
            where("movieId", "==", movieId),
            where("mediaType", "==", mediaType)
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                watchedDate: safeTimestampToISO(data.watchedDate),
                createdAt: safeTimestampToISO(data.createdAt),
                updatedAt: safeTimestampToISO(data.updatedAt),
            } as LogEntry;
        }).sort((a, b) => new Date(b.watchedDate).getTime() - new Date(a.watchedDate).getTime());
    } catch (error) {
        console.error("Error getting movie logs:", error);
        throw error;
    }
};

// Helper function to remove undefined values from objects (Firestore doesn't support undefined)
const cleanUndefinedFields = (obj: any): any => {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== undefined) {
            if (Array.isArray(value)) {
                cleaned[key] = value.map(item => 
                    typeof item === 'object' && item !== null ? cleanUndefinedFields(item) : item
                );
            } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                cleaned[key] = cleanUndefinedFields(value);
            } else {
                cleaned[key] = value;
            }
        }
    });
    return cleaned;
};

// Helper function to safely convert Firestore Timestamp to ISO string
const safeTimestampToISO = (value: any): string => {
    if (!value) return new Date().toISOString();
    
    // If it's already a string, return it
    if (typeof value === 'string') return value;
    
    // If it's a Firestore Timestamp, convert it
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    
    // If it's a Date object
    if (value instanceof Date) {
        return value.toISOString();
    }
    
    // Fallback
    return new Date().toISOString();
};

export const getUserStats = async (logs: LogEntry[], listsCount: number = 0) => {
    const totalWatched = logs.length;
    const thisYear = new Date().getFullYear();
    const currentYearLogs = logs.filter(log => new Date(log.watchedDate).getFullYear() === thisYear);
    const thisYearWatched = currentYearLogs.length;

    const ratings = logs.filter(log => log.rating > 0).map(log => log.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const totalMinutes = logs.reduce((acc, log) => acc + (log.movie.runtime || 0), 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Genres breakdown
    const genreCounts: Record<string, number> = {};
    logs.forEach(log => {
        log.movie.genres?.forEach(genre => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
    });
    const topGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    // Directors breakdown
    const directorCounts: Record<string, number> = {};
    logs.forEach(log => {
        if (log.movie.director) {
            directorCounts[log.movie.director] = (directorCounts[log.movie.director] || 0) + 1;
        }
    });
    const topDirectors = Object.entries(directorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    // Countries breakdown
    const countryCounts: Record<string, number> = {};
    logs.forEach(log => {
        log.movie.countries?.forEach(country => {
            countryCounts[country] = (countryCounts[country] || 0) + 1;
        });
    });
    const topCountries = Object.entries(countryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    // Monthly data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyCounts = months.map(month => ({ month, films: 0 }));
    currentYearLogs.forEach(log => {
        const monthIndex = new Date(log.watchedDate).getMonth();
        monthlyCounts[monthIndex].films++;
    });

    return {
        totalWatched,
        thisYearWatched,
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalHours,
        topGenres,
        topDirectors,
        topCountries,
        filmsPerMonth: monthlyCounts,
        lists: listsCount
    };
};

export const toggleWatchlist = async (userId: string, movie: Movie) => {
    try {
        const watchlistRef = doc(db, "users", userId, "watchlist", `${movie.mediaType || 'movie'}_${movie.id}`);
        const watchlistDoc = await getDoc(watchlistRef);

        if (watchlistDoc.exists()) {
            await deleteDoc(watchlistRef);
            return false; // Removed
        } else {
            // Clean undefined fields before saving to Firestore
            const cleanedMovie = cleanUndefinedFields({
                ...movie,
                mediaType: movie.mediaType || 'movie',
                addedAt: serverTimestamp()
            });
            await setDoc(watchlistRef, cleanedMovie);
            return true; // Added
        }
    } catch (error) {
        console.error("Error toggling watchlist:", error);
        throw error;
    }
};

export const getWatchlist = async (userId: string) => {
    try {
        const watchlistRef = collection(db, "users", userId, "watchlist");
        const q = query(watchlistRef, orderBy("addedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as Movie);
    } catch (error) {
        console.error("Error getting watchlist:", error);
        return [];
    }
};

export const isInWatchlist = async (userId: string, movieId: number, mediaType: 'movie' | 'tv' = 'movie') => {
    try {
        const watchlistRef = doc(db, "users", userId, "watchlist", `${mediaType}_${movieId}`);
        let watchlistDoc = await getDoc(watchlistRef);

        // Backward compatibility for old movies saved with just ID
        if (!watchlistDoc.exists() && mediaType === 'movie') {
            const oldRef = doc(db, "users", userId, "watchlist", movieId.toString());
            watchlistDoc = await getDoc(oldRef);
        }

        return watchlistDoc.exists();
    } catch (error) {
        console.error("Error checking watchlist:", error);
        return false;
    }
};

export const toggleFavorite = async (userId: string, movie: Movie) => {
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", `${movie.mediaType || 'movie'}_${movie.id}`);
        const favoriteDoc = await getDoc(favoriteRef);

        if (favoriteDoc.exists()) {
            await deleteDoc(favoriteRef);
            return false; // Removed
        } else {
            // Clean undefined fields before saving to Firestore
            const cleanedMovie = cleanUndefinedFields({
                ...movie,
                mediaType: movie.mediaType || 'movie',
                addedAt: serverTimestamp()
            });
            await setDoc(favoriteRef, cleanedMovie);
            return true; // Added
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
    }
};

export const isFavorite = async (userId: string, movieId: number, mediaType: 'movie' | 'tv' = 'movie') => {
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", `${mediaType}_${movieId}`);
        let favoriteDoc = await getDoc(favoriteRef);

        // Backward compatibility
        if (!favoriteDoc.exists() && mediaType === 'movie') {
            const oldRef = doc(db, "users", userId, "favorites", movieId.toString());
            favoriteDoc = await getDoc(oldRef);
        }

        return favoriteDoc.exists();
    } catch (error) {
        console.error("Error checking favorite:", error);
        return false;
    }
};

export const getFavoriteMovies = async (userId: string) => {
    try {
        const favsRef = collection(db, "users", userId, "favorites");
        const querySnapshot = await getDocs(favsRef);
        return querySnapshot.docs.map(doc => doc.data() as Movie);
    } catch (error) {
        console.error("Error getting favorites:", error);
        return [];
    }
};

// Custom Lists
export const createCustomList = async (userId: string, name: string, description: string = "") => {
    try {
        const listsRef = collection(db, "users", userId, "lists");
        const docRef = await addDoc(listsRef, {
            name,
            description,
            movies: [],
            createdAt: serverTimestamp(),
            visibility: "public"
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating custom list:", error);
        throw error;
    }
};

export const getUserLists = async (userId: string) => {
    try {
        const listsRef = collection(db, "users", userId, "lists");
        const q = query(listsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as MovieList));
    } catch (error) {
        console.error("Error getting user lists:", error);
        return [];
    }
};

export const addMovieToList = async (userId: string, listId: string, movie: Movie) => {
    try {
        const listRef = doc(db, "users", userId, "lists", listId);
        // Clean undefined fields before adding to array
        const cleanedMovie = cleanUndefinedFields(movie);
        await updateDoc(listRef, {
            movies: arrayUnion(cleanedMovie)
        });
    } catch (error) {
        console.error("Error adding movie to list:", error);
        throw error;
    }
};

export const getUserByUsername = async (username: string) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username.toLowerCase()), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
        console.error("Error getting user by username:", error);
        return null;
    }
};

export const updateUserData = async (userId: string, data: any) => {
    try {
        const userRef = doc(db, "users", userId);

        // If updating username, also update the usernames collection
        if (data.username) {
            const usernameRef = doc(db, "usernames", data.username.toLowerCase());
            await setDoc(usernameRef, { uid: userId });
        }

        await setDoc(userRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating user data:", error);
        throw error;
    }
};

export const checkUsernameAvailable = async (username: string) => {
    try {
        const usernameRef = doc(db, "usernames", username.toLowerCase());
        const usernameDoc = await getDoc(usernameRef);
        return !usernameDoc.exists();
    } catch (error) {
        console.error("Error checking username:", error);
        return false;
    }
};

export const searchUsers = async (searchTerm: string) => {
    try {
        const usersRef = collection(db, "users");
        // Simple prefix search using Firestore query
        const q = query(
            usersRef,
            where("username", ">=", searchTerm.toLowerCase()),
            where("username", "<=", searchTerm.toLowerCase() + "\uf8ff"),
            limit(10)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
};

// Connections Management
export const getConnectionStatus = async (currentUid: string, targetUid: string) => {
    try {
        // Check if connected
        const connId = [currentUid, targetUid].sort().join("_");
        const connDoc = await getDoc(doc(db, "connections", connId));
        if (connDoc.exists()) return { status: 'accepted' };

        // Check for pending requests
        const requestsRef = collection(db, "connection_requests");
        const qOut = query(requestsRef, where("from", "==", currentUid), where("to", "==", targetUid));
        const outSnapshot = await getDocs(qOut);
        if (!outSnapshot.empty) return { status: 'pending', requestId: outSnapshot.docs[0].id };

        const qIn = query(requestsRef, where("from", "==", targetUid), where("to", "==", currentUid));
        const inSnapshot = await getDocs(qIn);
        if (!inSnapshot.empty) return { status: 'incoming', requestId: inSnapshot.docs[0].id };

        return { status: 'none' };
    } catch (error) {
        console.error("Error getting connection status:", error);
        return { status: 'none' };
    }
};

export const sendConnectionRequest = async (fromUid: string, toUid: string) => {
    try {
        const requestsRef = collection(db, "connection_requests");
        await addDoc(requestsRef, {
            from: fromUid,
            to: toUid,
            status: "pending",
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending connection request:", error);
        throw error;
    }
};

export const acceptConnectionRequest = async (requestId: string, fromUid: string, toUid: string) => {
    try {
        const connId = [fromUid, toUid].sort().join("_");
        await setDoc(doc(db, "connections", connId), {
            uids: [fromUid, toUid],
            status: "accepted",
            since: serverTimestamp()
        });
        await deleteDoc(doc(db, "connection_requests", requestId));
    } catch (error) {
        console.error("Error accepting connection request:", error);
        throw error;
    }
};

// Get user's friends (accepted connections)
export const getUserFriends = async (userId: string) => {
    try {
        const connectionsRef = collection(db, "connections");
        const q = query(connectionsRef, where("uids", "array-contains", userId));
        const snapshot = await getDocs(q);
        
        const friendIds = snapshot.docs.map(doc => {
            const uids = doc.data().uids;
            return uids.find((uid: string) => uid !== userId);
        }).filter(Boolean);
        
        // Get user details for each friend
        const friends = await Promise.all(
            friendIds.map(async (friendId) => {
                const userDoc = await getDoc(doc(db, "users", friendId));
                if (userDoc.exists()) {
                    return {
                        uid: friendId,
                        ...userDoc.data()
                    };
                }
                return null;
            })
        );
        
        return friends.filter(Boolean);
    } catch (error) {
        console.error("Error getting user friends:", error);
        return [];
    }
};

export const rejectConnectionRequest = async (requestId: string) => {
    try {
        await deleteDoc(doc(db, "connection_requests", requestId));
    } catch (error) {
        console.error("Error rejecting connection request:", error);
        throw error;
    }
};

// ==================== ACTIVITY FEED ====================

// Log user activity
export const logActivity = async (activity: {
    userId: string;
    userName: string;
    userPhoto?: string;
    type: string;
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
    tvProgress?: string;
}) => {
    try {
        await addDoc(collection(db, "user_activities"), {
            ...activity,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

// Get recent activities (for activity feed)
export const getRecentActivities = async (limitCount: number = 50) => {
    try {
        const activitiesRef = collection(db, "user_activities");
        const q = query(activitiesRef, orderBy("createdAt", "desc"), limit(limitCount));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
    } catch (error) {
        console.error("Error getting recent activities:", error);
        return [];
    }
};

// Get user's activities
export const getUserActivities = async (userId: string, limitCount: number = 20) => {
    try {
        const activitiesRef = collection(db, "user_activities");
        const q = query(
            activitiesRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
    } catch (error: any) {
        // If index error, provide helpful message
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            const indexUrl = error?.message?.match(/https:\/\/[^\s]+/)?.[0];
            if (indexUrl) {
                console.warn("Firestore index required. Create it here:", indexUrl);
            } else {
                console.warn("Firestore index required for user_activities collection. Please create a composite index on userId (Ascending) and createdAt (Descending)");
            }
        }
        console.error("Error getting user activities:", error);
        return [];
    }
};

// ==================== MOVIE STATISTICS ====================

// Update movie statistics (call this when user logs, favorites, reviews a movie)
export const updateMovieStats = async (
    movieId: number,
    mediaType: 'movie' | 'tv',
    title: string,
    posterUrl: string | undefined,
    action: 'log' | 'favorite' | 'review' | 'watchlist',
    rating?: number
) => {
    try {
        const statsId = `${mediaType}_${movieId}`;
        const statsRef = doc(db, "movie_stats", statsId);
        const statsDoc = await getDoc(statsRef);
        
        if (!statsDoc.exists()) {
            // Create new stats document
            await setDoc(statsRef, {
                movieId,
                mediaType,
                title,
                posterUrl: posterUrl || '',
                logCount: action === 'log' ? 1 : 0,
                favoriteCount: action === 'favorite' ? 1 : 0,
                reviewCount: action === 'review' ? 1 : 0,
                watchlistCount: action === 'watchlist' ? 1 : 0,
                avgRating: rating || 0,
                ratingSum: rating || 0,
                ratingCount: rating ? 1 : 0,
                weeklyLogs: action === 'log' ? 1 : 0,
                monthlyLogs: action === 'log' ? 1 : 0,
                lastUpdated: serverTimestamp()
            });
        } else {
            // Update existing stats
            const currentData = statsDoc.data();
            const updates: any = {
                lastUpdated: serverTimestamp()
            };
            
            if (action === 'log') {
                updates.logCount = (currentData.logCount || 0) + 1;
                updates.weeklyLogs = (currentData.weeklyLogs || 0) + 1;
                updates.monthlyLogs = (currentData.monthlyLogs || 0) + 1;
            } else if (action === 'favorite') {
                updates.favoriteCount = (currentData.favoriteCount || 0) + 1;
            } else if (action === 'review') {
                updates.reviewCount = (currentData.reviewCount || 0) + 1;
            } else if (action === 'watchlist') {
                updates.watchlistCount = (currentData.watchlistCount || 0) + 1;
            }
            
            if (rating) {
                const newRatingSum = (currentData.ratingSum || 0) + rating;
                const newRatingCount = (currentData.ratingCount || 0) + 1;
                updates.ratingSum = newRatingSum;
                updates.ratingCount = newRatingCount;
                updates.avgRating = newRatingSum / newRatingCount;
            }
            
            await updateDoc(statsRef, updates);
        }
    } catch (error) {
        console.error("Error updating movie stats:", error);
    }
};

// Get unified trending movies combining all metrics (logs, favorites, ratings, comments)
export const getUnifiedTrending = async (limitCount: number = 20): Promise<any[]> => {
    try {
        // Get all movie stats (limit to top 200 by any metric to avoid loading too much)
        const statsRef = collection(db, "movie_stats");
        const statsQuery = query(statsRef, limit(200));
        const statsSnapshot = await getDocs(statsQuery);
        
        // Get all comments to count per movie
        const commentsRef = collection(db, "comments");
        const commentsSnapshot = await getDocs(query(commentsRef, limit(1000))); // Limit to avoid huge queries
        
        // Group comments by reviewId, then get reviews to map to movies
        const reviewCommentMap = new Map<string, number>();
        commentsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const reviewId = data.reviewId;
            if (reviewId) {
                reviewCommentMap.set(reviewId, (reviewCommentMap.get(reviewId) || 0) + 1);
            }
        });
        
        // Get reviews to map comments to movies
        const reviewIds = Array.from(reviewCommentMap.keys());
        const movieCommentMap = new Map<number, number>();
        
        if (reviewIds.length > 0) {
            const reviewPromises = reviewIds.slice(0, 500).map(reviewId => getDoc(doc(db, "reviews", reviewId)));
            const reviewDocs = await Promise.all(reviewPromises);
            
            reviewDocs.forEach((reviewDoc, index) => {
                if (reviewDoc.exists()) {
                    const reviewData = reviewDoc.data() as Review;
                    const movieId = reviewData.movieId;
                    const commentCount = reviewCommentMap.get(reviewIds[index]) || 0;
                    movieCommentMap.set(movieId, (movieCommentMap.get(movieId) || 0) + commentCount);
                }
            });
        }
        
        // Also get comment counts from review.commentCount field as fallback
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(reviewsRef, where("commentCount", ">", 0), limit(500));
        try {
            const reviewsSnapshot = await getDocs(reviewsQuery);
            reviewsSnapshot.docs.forEach(doc => {
                const reviewData = doc.data() as Review;
                const movieId = reviewData.movieId;
                const commentCount = reviewData.commentCount || 0;
                movieCommentMap.set(movieId, (movieCommentMap.get(movieId) || 0) + commentCount);
            });
        } catch (e) {
            // If index doesn't exist, continue without this data
            console.log("Could not fetch reviews with comments, continuing...");
        }
        
        // Calculate trending score for each movie
        const moviesWithScore = statsSnapshot.docs.map(doc => {
            const data = doc.data();
            const movieId = data.movieId;
            const weeklyLogs = data.weeklyLogs || 0;
            const logCount = data.logCount || 0;
            const favoriteCount = data.favoriteCount || 0;
            const avgRating = data.avgRating || 0;
            const ratingCount = data.ratingCount || 0;
            const commentCount = movieCommentMap.get(movieId) || 0;
            
            // Calculate weighted trending score
            // Weekly logs: 3x (recent activity is most important)
            // Favorites: 2x (shows strong engagement)
            // Ratings: normalized (rating * count) - 1.5x
            // Comments: 2x (shows discussion)
            // Total logs: 1x (baseline engagement)
            
            const weeklyScore = weeklyLogs * 3;
            const favoriteScore = favoriteCount * 2;
            const ratingScore = (avgRating * ratingCount) * 1.5;
            const commentScore = commentCount * 2;
            const logScore = logCount * 1;
            
            const trendingScore = weeklyScore + favoriteScore + ratingScore + commentScore + logScore;
            
            return {
                id: doc.id,
                movieId,
                mediaType: data.mediaType || 'movie',
                title: data.title || '',
                posterUrl: data.posterUrl || '',
                logCount,
                favoriteCount,
                reviewCount: data.reviewCount || 0,
                avgRating,
                ratingCount,
                weeklyLogs,
                monthlyLogs: data.monthlyLogs || 0,
                commentCount,
                trendingScore
            };
        });
        
        // Sort by trending score (descending)
        moviesWithScore.sort((a, b) => b.trendingScore - a.trendingScore);
        
        return moviesWithScore.slice(0, limitCount);
    } catch (error) {
        console.error("Error getting unified trending movies:", error);
        return [];
    }
};

// ==================== USER RECOMMENDATIONS ====================

// Get recommended users for a given user
export const getRecommendedUsers = async (currentUserId: string, limitCount: number = 10) => {
    try {
        // Get all users except current user
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        // Get current user's data
        const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
        if (!currentUserDoc.exists()) return [];
        
        // Get current user's logs to find common movies
        const currentUserLogs = await getUserLogs(currentUserId);
        const currentUserMovieIds = new Set(currentUserLogs.map(log => log.movieId));
        
        // Get current user's connections to exclude them
        const connections = await getUserFriends(currentUserId);
        const connectedUserIds = new Set(connections.map((f: any) => f.uid));
        
        const recommendations = [];
        
        for (const userDoc of usersSnapshot.docs) {
            if (userDoc.id === currentUserId || connectedUserIds.has(userDoc.id)) continue;
            
            const userData = userDoc.data();
            
            // Get user's logs
            const userLogs = await getUserLogs(userDoc.id);
            const userMovieIds = new Set(userLogs.map(log => log.movieId));
            
            // Calculate common movies
            const commonMovies = [...currentUserMovieIds].filter(id => userMovieIds.has(id)).length;
            
            // Calculate activity score (recent activity)
            const recentActivities = await getUserActivities(userDoc.id, 10);
            const activityScore = recentActivities.length;
            
            // Check if new user (joined in last 30 days)
            const createdAt = new Date(userData.createdAt);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const isNewUser = createdAt > thirtyDaysAgo;
            
            // Calculate recommendation score
            const recommendationScore = 
                (commonMovies * 10) + // Common movies weight heavily
                (activityScore * 2) + // Active users
                (isNewUser ? 5 : 0); // Boost for new users
            
            if (recommendationScore > 0) {
                recommendations.push({
                    uid: userDoc.id,
                    username: userData.username,
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                    bio: userData.bio,
                    commonMovies,
                    commonGenres: [], // TODO: Calculate common genres
                    activityScore,
                    isNewUser,
                    totalWatched: userLogs.length,
                    reviewCount: recentActivities.filter((a: any) => a.type === 'review').length,
                    recommendationScore
                });
            }
        }
        
        // Sort by recommendation score and limit
        return recommendations
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, limitCount);
    } catch (error) {
        console.error("Error getting recommended users:", error);
        return [];
    }
};

// Get most active users
export const getMostActiveUsers = async (currentUserId: string, limitCount: number = 8) => {
    try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const connections = await getUserFriends(currentUserId);
        const connectedUserIds = new Set(connections.map((f: any) => f.uid));
        
        const usersWithActivity = [];
        
        for (const userDoc of usersSnapshot.docs) {
            if (userDoc.id === currentUserId || connectedUserIds.has(userDoc.id)) continue;
            
            const userData = userDoc.data();
            const recentActivities = await getUserActivities(userDoc.id, 20);
            const userLogs = await getUserLogs(userDoc.id);
            
            if (recentActivities.length > 0) {
                usersWithActivity.push({
                    uid: userDoc.id,
                    username: userData.username,
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                    bio: userData.bio,
                    activityScore: recentActivities.length,
                    totalWatched: userLogs.length,
                    reviewCount: recentActivities.filter((a: any) => a.type === 'review').length
                });
            }
        }
        
        return usersWithActivity
            .sort((a, b) => b.activityScore - a.activityScore)
            .slice(0, limitCount);
    } catch (error) {
        console.error("Error getting most active users:", error);
        return [];
    }
};

// Get new users
export const getNewUsers = async (currentUserId: string, limitCount: number = 8) => {
    try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const connections = await getUserFriends(currentUserId);
        const connectedUserIds = new Set(connections.map((f: any) => f.uid));
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const newUsers = [];
        
        for (const userDoc of usersSnapshot.docs) {
            if (userDoc.id === currentUserId || connectedUserIds.has(userDoc.id)) continue;
            
            const userData = userDoc.data();
            const createdAt = new Date(userData.createdAt);
            
            if (createdAt > thirtyDaysAgo) {
                const userLogs = await getUserLogs(userDoc.id);
                newUsers.push({
                    uid: userDoc.id,
                    username: userData.username,
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                    bio: userData.bio,
                    totalWatched: userLogs.length,
                    createdAt: userData.createdAt
                });
            }
        }
        
        return newUsers
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limitCount);
    } catch (error) {
        console.error("Error getting new users:", error);
        return [];
    }
};

export const getIncomingRequests = async (userId: string) => {
    try {
        const requestsRef = collection(db, "connection_requests");
        const q = query(requestsRef, where("to", "==", userId), where("status", "==", "pending"));
        const snapshot = await getDocs(q);

        // We'll need user details for each request
        const requests = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const fromUser = await getUserData(data.from);
            return {
                id: doc.id,
                ...data,
                fromUser,
                createdAt: safeTimestampToISO(data.createdAt)
            };
        }));

        return requests;
    } catch (error) {
        console.error("Error getting incoming requests:", error);
        return [];
    }
};


// Reviews & Comments
export const submitReview = async (review: Omit<Review, "id" | "createdAt" | "likeCount" | "commentCount">) => {
    try {
        const reviewsRef = collection(db, "reviews");
        const docRef = await addDoc(reviewsRef, {
            ...review,
            likeCount: 0,
            commentCount: 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error submitting review:", error);
        throw error;
    }
};

export const getMovieReviews = async (movieId: number) => {
    try {
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, where("movieId", "==", movieId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        } as Review)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error("Error getting reviews:", error);
        return [];
    }
};

export const submitComment = async (comment: Omit<ReviewComment, "id" | "createdAt" | "likeCount">) => {
    try {
        const commentsRef = collection(db, "comments");
        const docRef = await addDoc(commentsRef, {
            ...comment,
            likeCount: 0,
            createdAt: serverTimestamp()
        });

        // Increment comment count on review
        const reviewRef = doc(db, "reviews", comment.reviewId);
        const reviewSnapshot = await getDoc(reviewRef);
        await updateDoc(reviewRef, {
            commentCount: (reviewSnapshot.data()?.commentCount || 0) + 1
        });

        return docRef.id;
    } catch (error) {
        console.error("Error submitting comment:", error);
        throw error;
    }
};

export const getReviewComments = async (reviewId: string) => {
    try {
        const commentsRef = collection(db, "comments");
        const q = query(commentsRef, where("reviewId", "==", reviewId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        } as unknown as ReviewComment)).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
        console.error("Error getting comments:", error);
        return [];
    }
};

export const toggleEntityLike = async (userId: string, entityId: string, entityType: 'review' | 'comment' | 'list') => {
    try {
        const likeRef = doc(db, `${entityType}_likes`, `${entityId}_${userId}`);
        const entityRef = doc(db, entityType === 'review' ? 'reviews' : entityType === 'comment' ? 'comments' : 'users/' + userId + '/lists', entityId);

        const likeDoc = await getDoc(likeRef);

        if (likeDoc.exists()) {
            await deleteDoc(likeRef);
            await updateDoc(entityRef, {
                likeCount: (await getDoc(entityRef)).data()?.likeCount - 1
            });
            return false;
        } else {
            await setDoc(likeRef, { userId, entityId, createdAt: serverTimestamp() });
            await updateDoc(entityRef, {
                likeCount: ((await getDoc(entityRef)).data()?.likeCount || 0) + 1
            });
            return true;
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
};

export const getUserData = async (userId: string) => {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        return userDoc.exists() ? { uid: userDoc.id, ...userDoc.data() } as any : null;
    } catch (error) {
        console.error("Error getting user data:", error);
        return null;
    }
};

// ==================== ACCOUNT DELETION ====================

// Helper function to delete all documents in a collection
const deleteCollection = async (collectionPath: string) => {
    try {
        const collectionRef = collection(db, collectionPath);
        const snapshot = await getDocs(collectionRef);
        const batch = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(batch);
    } catch (error) {
        console.error(`Error deleting collection ${collectionPath}:`, error);
    }
};

// Delete user account and all associated data
export const deleteUserAccount = async (userId: string) => {
    try {
        // Get user data first to get username
        const userData = await getUserData(userId);
        const username = userData?.username;

        // 1. Delete subcollections
        await Promise.all([
            deleteCollection(`users/${userId}/logs`),
            deleteCollection(`users/${userId}/lists`),
            deleteCollection(`users/${userId}/watchlist`),
            deleteCollection(`users/${userId}/favorites`)
        ]);

        // 2. Delete username mapping
        if (username) {
            try {
                await deleteDoc(doc(db, "usernames", username.toLowerCase()));
            } catch (error) {
                console.error("Error deleting username mapping:", error);
            }
        }

        // 3. Delete connections
        const connectionsRef = collection(db, "connections");
        const connectionsQuery = query(connectionsRef, where("uids", "array-contains", userId));
        const connectionsSnapshot = await getDocs(connectionsQuery);
        await Promise.all(connectionsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

        // 4. Delete connection requests
        const requestsRef = collection(db, "connection_requests");
        const requestsFromQuery = query(requestsRef, where("from", "==", userId));
        const requestsToQuery = query(requestsRef, where("to", "==", userId));
        const [fromSnapshot, toSnapshot] = await Promise.all([
            getDocs(requestsFromQuery),
            getDocs(requestsToQuery)
        ]);
        await Promise.all([
            ...fromSnapshot.docs.map(doc => deleteDoc(doc.ref)),
            ...toSnapshot.docs.map(doc => deleteDoc(doc.ref))
        ]);

        // 5. Delete reviews
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(reviewsRef, where("authorUid", "==", userId));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        await Promise.all(reviewsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

        // 6. Delete user activities
        const activitiesRef = collection(db, "user_activities");
        const activitiesQuery = query(activitiesRef, where("userId", "==", userId));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        await Promise.all(activitiesSnapshot.docs.map(doc => deleteDoc(doc.ref)));

        // 7. Delete conversations
        const conversationsRef = collection(db, "conversations");
        const conversationsQuery = query(conversationsRef, where("participants", "array-contains", userId));
        const conversationsSnapshot = await getDocs(conversationsQuery);
        await Promise.all(conversationsSnapshot.docs.map(async (convDoc) => {
            // Delete messages subcollection
            const messagesRef = collection(db, "conversations", convDoc.id, "messages");
            const messagesSnapshot = await getDocs(messagesRef);
            await Promise.all(messagesSnapshot.docs.map(msgDoc => deleteDoc(msgDoc.ref)));
            // Delete conversation
            await deleteDoc(convDoc.ref);
        }));

        // 8. Delete polls created by user
        const pollsRef = collection(db, "polls");
        const pollsQuery = query(pollsRef, where("authorUid", "==", userId));
        const pollsSnapshot = await getDocs(pollsQuery);
        await Promise.all(pollsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

        // 9. Delete debates created by user
        const debatesRef = collection(db, "debates");
        const debatesQuery = query(debatesRef, where("authorUid", "==", userId));
        const debatesSnapshot = await getDocs(debatesQuery);
        await Promise.all(debatesSnapshot.docs.map(doc => deleteDoc(doc.ref)));

        // 10. Delete user ratings from community_ratings
        const communityRatingsRef = collection(db, "community_ratings");
        const communityRatingsSnapshot = await getDocs(communityRatingsRef);
        await Promise.all(communityRatingsSnapshot.docs.map(async (ratingDoc) => {
            const userRatingRef = doc(db, "community_ratings", ratingDoc.id, "user_ratings", userId);
            try {
                await deleteDoc(userRatingRef);
                // Update the rating document to recalculate averages
                const ratingData = ratingDoc.data();
                const newTotal = (ratingData.totalRatings || 1) - 1;
                if (newTotal > 0) {
                    const userRating = ratingData.userRatings?.[userId];
                    if (userRating) {
                        const newSum = (ratingData.sumRatings || 0) - userRating;
                        await updateDoc(ratingDoc.ref, {
                            totalRatings: newTotal,
                            sumRatings: newSum,
                            averageRating: newSum / newTotal
                        });
                    }
                } else {
                    // If no ratings left, delete the document
                    await deleteDoc(ratingDoc.ref);
                }
            } catch (error) {
                console.error("Error deleting user rating:", error);
            }
        }));

        // 11. Delete list comments
        const listCommentsRef = collection(db, "list_comments");
        const listCommentsQuery = query(listCommentsRef, where("authorUid", "==", userId));
        const listCommentsSnapshot = await getDocs(listCommentsQuery);
        await Promise.all(listCommentsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

        // 12. Delete debate comments
        const debateCommentsRef = collection(db, "debate_comments");
        const debateCommentsQuery = query(debateCommentsRef, where("authorUid", "==", userId));
        const debateCommentsSnapshot = await getDocs(debateCommentsQuery);
        await Promise.all(debateCommentsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

        // 13. Finally, delete the user document
        await deleteDoc(doc(db, "users", userId));

        return true;
    } catch (error) {
        console.error("Error deleting user account:", error);
        throw error;
    }
};

// ==================== COMMUNITY FEATURES ====================

// POLLS
export const createPoll = async (poll: any) => {
    try {
        const pollsRef = collection(db, "polls");
        const docRef = await addDoc(pollsRef, {
            ...poll,
            totalVotes: 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating poll:", error);
        throw error;
    }
};

export const getPolls = async (limitCount: number = 20) => {
    try {
        const pollsRef = collection(db, "polls");
        const q = query(pollsRef, orderBy("createdAt", "desc"), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
    } catch (error) {
        console.error("Error getting polls:", error);
        return [];
    }
};

export const votePoll = async (pollId: string, optionId: string, userId: string) => {
    try {
        const voteRef = doc(db, "poll_votes", `${pollId}_${userId}`);
        const voteDoc = await getDoc(voteRef);
        
        if (voteDoc.exists()) {
            throw new Error("You have already voted on this poll");
        }

        await runTransaction(db, async (transaction) => {
            const pollRef = doc(db, "polls", pollId);
            const pollDoc = await transaction.get(pollRef);
            
            if (!pollDoc.exists()) throw new Error("Poll not found");
            
            const pollData = pollDoc.data();
            const options = pollData.options.map((opt: any) => 
                opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            );
            
            transaction.update(pollRef, {
                options,
                totalVotes: pollData.totalVotes + 1
            });
            
            transaction.set(voteRef, {
                pollId,
                optionId,
                userId,
                createdAt: serverTimestamp()
            });
        });
    } catch (error) {
        console.error("Error voting on poll:", error);
        throw error;
    }
};

export const getUserPollVote = async (pollId: string, userId: string) => {
    try {
        const voteRef = doc(db, "poll_votes", `${pollId}_${userId}`);
        const voteDoc = await getDoc(voteRef);
        return voteDoc.exists() ? voteDoc.data().optionId : null;
    } catch (error) {
        console.error("Error getting poll vote:", error);
        return null;
    }
};

// DEBATES
export const createDebate = async (debate: any) => {
    try {
        const debatesRef = collection(db, "debates");
        const docRef = await addDoc(debatesRef, {
            ...debate,
            side1Votes: 0,
            side2Votes: 0,
            commentCount: 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating debate:", error);
        throw error;
    }
};

export const getDebates = async (limitCount: number = 20) => {
    try {
        const debatesRef = collection(db, "debates");
        const q = query(debatesRef, orderBy("createdAt", "desc"), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
    } catch (error) {
        console.error("Error getting debates:", error);
        return [];
    }
};

export const voteDebate = async (debateId: string, side: 1 | 2, userId: string) => {
    try {
        const voteRef = doc(db, "debate_votes", `${debateId}_${userId}`);
        const voteDoc = await getDoc(voteRef);
        
        await runTransaction(db, async (transaction) => {
            const debateRef = doc(db, "debates", debateId);
            const debateDoc = await transaction.get(debateRef);
            
            if (!debateDoc.exists()) throw new Error("Debate not found");
            
            const debateData = debateDoc.data();
            let side1Votes = debateData.side1Votes;
            let side2Votes = debateData.side2Votes;
            
            if (voteDoc.exists()) {
                // Change vote
                const oldSide = voteDoc.data().side;
                if (oldSide === 1) side1Votes--;
                else side2Votes--;
            }
            
            if (side === 1) side1Votes++;
            else side2Votes++;
            
            transaction.update(debateRef, { side1Votes, side2Votes });
            transaction.set(voteRef, {
                debateId,
                side,
                userId,
                createdAt: serverTimestamp()
            });
        });
    } catch (error) {
        console.error("Error voting on debate:", error);
        throw error;
    }
};

export const getUserDebateVote = async (debateId: string, userId: string) => {
    try {
        const voteRef = doc(db, "debate_votes", `${debateId}_${userId}`);
        const voteDoc = await getDoc(voteRef);
        return voteDoc.exists() ? voteDoc.data().side : null;
    } catch (error) {
        console.error("Error getting debate vote:", error);
        return null;
    }
};

export const addDebateComment = async (comment: any) => {
    try {
        const commentsRef = collection(db, "debate_comments");
        const docRef = await addDoc(commentsRef, {
            ...comment,
            likeCount: 0,
            createdAt: serverTimestamp()
        });
        
        // Increment comment count
        const debateRef = doc(db, "debates", comment.debateId);
        const debateDoc = await getDoc(debateRef);
        await updateDoc(debateRef, {
            commentCount: (debateDoc.data()?.commentCount || 0) + 1
        });
        
        return docRef.id;
    } catch (error) {
        console.error("Error adding debate comment:", error);
        throw error;
    }
};

export const getDebateComments = async (debateId: string) => {
    try {
        const commentsRef = collection(db, "debate_comments");
        const q = query(commentsRef, where("debateId", "==", debateId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
    } catch (error) {
        console.error("Error getting debate comments:", error);
        return [];
    }
};

// PUBLIC LISTS
export const getPublicLists = async (limitCount: number = 20) => {
    try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        
        const allLists: any[] = [];
        
        for (const userDoc of usersSnapshot.docs) {
            const listsRef = collection(db, "users", userDoc.id, "lists");
            const q = query(listsRef, where("visibility", "==", "public"));
            const listsSnapshot = await getDocs(q);
            
            listsSnapshot.docs.forEach(listDoc => {
                allLists.push({
                    id: listDoc.id,
                    userId: userDoc.id,
                    userName: userDoc.data().displayName,
                    userPhoto: userDoc.data().photoURL,
                    ...listDoc.data(),
                    createdAt: safeTimestampToISO(listDoc.data().createdAt)
                });
            });
        }
        
        // Sort by creation date
        allLists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return allLists.slice(0, limitCount);
    } catch (error) {
        console.error("Error getting public lists:", error);
        return [];
    }
};

export const addListComment = async (comment: any) => {
    try {
        const commentsRef = collection(db, "list_comments");
        const docRef = await addDoc(commentsRef, {
            ...comment,
            likeCount: 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding list comment:", error);
        throw error;
    }
};

export const getListComments = async (listId: string, listOwnerId: string) => {
    try {
        const commentsRef = collection(db, "list_comments");
        const q = query(
            commentsRef, 
            where("listId", "==", listId),
            where("listOwnerId", "==", listOwnerId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
    } catch (error) {
        console.error("Error getting list comments:", error);
        return [];
    }
};

// ==================== DIRECTOR & ACTOR TRACKING ====================

// Get director filmography from user's logs
export const getDirectorFilmography = async (userId: string, directorName: string) => {
    try {
        const logsRef = collection(db, 'users', userId, 'logs');
        const snapshot = await getDocs(logsRef);
        
        const films = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                watchedDate: safeTimestampToISO(doc.data().watchedDate),
                createdAt: safeTimestampToISO(doc.data().createdAt)
            }))
            .filter((log: any) => log.movie.director?.toLowerCase().includes(directorName.toLowerCase()));
        
        return films;
    } catch (error) {
        console.error("Error getting director filmography:", error);
        return [];
    }
};

// Get actor filmography from user's logs
export const getActorFilmography = async (userId: string, actorName: string) => {
    try {
        const logsRef = collection(db, 'users', userId, 'logs');
        const snapshot = await getDocs(logsRef);
        
        const films = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                watchedDate: safeTimestampToISO(doc.data().watchedDate),
                createdAt: safeTimestampToISO(doc.data().createdAt)
            }))
            .filter((log: any) => {
                const cast = log.movie.cast || [];
                return cast.some((actor: string) => actor.toLowerCase().includes(actorName.toLowerCase()));
            });
        
        return films;
    } catch (error) {
        console.error("Error getting actor filmography:", error);
        return [];
    }
};

// Get all directors from user's logs
export const getAllDirectors = async (userId: string) => {
    try {
        const logsRef = collection(db, 'users', userId, 'logs');
        const snapshot = await getDocs(logsRef);
        
        const directorMap = new Map<string, { name: string; count: number; films: any[] }>();
        
        snapshot.docs.forEach(doc => {
            const log = doc.data();
            const director = log.movie.director;
            
            if (director) {
                if (directorMap.has(director)) {
                    const entry = directorMap.get(director)!;
                    entry.count++;
                    entry.films.push(log.movie);
                } else {
                    directorMap.set(director, {
                        name: director,
                        count: 1,
                        films: [log.movie]
                    });
                }
            }
        });
        
        return Array.from(directorMap.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
        console.error("Error getting all directors:", error);
        return [];
    }
};

// Get all actors from user's logs
export const getAllActors = async (userId: string) => {
    try {
        const logsRef = collection(db, 'users', userId, 'logs');
        const snapshot = await getDocs(logsRef);
        
        const actorMap = new Map<string, { name: string; count: number; films: any[] }>();
        
        snapshot.docs.forEach(doc => {
            const log = doc.data();
            const cast = log.movie.cast || [];
            
            cast.forEach((actor: string) => {
                if (actorMap.has(actor)) {
                    const entry = actorMap.get(actor)!;
                    entry.count++;
                    entry.films.push(log.movie);
                } else {
                    actorMap.set(actor, {
                        name: actor,
                        count: 1,
                        films: [log.movie]
                    });
                }
            });
        });
        
        return Array.from(actorMap.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
        console.error("Error getting all actors:", error);
        return [];
    }
};

// ==================== ADMIN STATISTICS ====================

export interface AdminStats {
    // User Statistics
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    activeUsersToday: number;
    activeUsersThisWeek: number;
    
    // Content Statistics
    totalLogs: number;
    newLogsToday: number;
    newLogsThisWeek: number;
    newLogsThisMonth: number;
    
    totalReviews: number;
    newReviewsToday: number;
    newReviewsThisWeek: number;
    newReviewsThisMonth: number;
    
    totalLists: number;
    newListsToday: number;
    newListsThisWeek: number;
    newListsThisMonth: number;
    
    totalFavorites: number;
    newFavoritesToday: number;
    newFavoritesThisWeek: number;
    
    // Community Statistics
    totalConnections: number;
    newConnectionsToday: number;
    newConnectionsThisWeek: number;
    
    totalPolls: number;
    newPollsToday: number;
    newPollsThisWeek: number;
    
    totalDebates: number;
    newDebatesToday: number;
    newDebatesThisWeek: number;
    
    totalComments: number;
    newCommentsToday: number;
    newCommentsThisWeek: number;
    
    totalActivities: number;
    newActivitiesToday: number;
    newActivitiesThisWeek: number;
    
    // Engagement
    avgLogsPerUser: number;
    avgReviewsPerUser: number;
    avgListsPerUser: number;
}

// Get admin statistics
export const getAdminStats = async (): Promise<AdminStats> => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Helper to check if date is within range
        const isToday = (dateStr: string) => new Date(dateStr) >= todayStart;
        const isThisWeek = (dateStr: string) => new Date(dateStr) >= weekStart;
        const isThisMonth = (dateStr: string) => new Date(dateStr) >= monthStart;
        
        // Get all users
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const allUsers = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
        
        const totalUsers = allUsers.length;
        const newUsersToday = allUsers.filter(u => isToday(u.createdAt)).length;
        const newUsersThisWeek = allUsers.filter(u => isThisWeek(u.createdAt)).length;
        const newUsersThisMonth = allUsers.filter(u => isThisMonth(u.createdAt)).length;
        
        // Get active users (users with activity today/this week)
        const activitiesRef = collection(db, "user_activities");
        const activitiesSnapshot = await getDocs(activitiesRef);
        const allActivities = activitiesSnapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
        
        const todayActivities = allActivities.filter(a => isToday(a.createdAt));
        const weekActivities = allActivities.filter(a => isThisWeek(a.createdAt));
        
        const activeUsersToday = new Set(todayActivities.map((a: any) => a.userId)).size;
        const activeUsersThisWeek = new Set(weekActivities.map((a: any) => a.userId)).size;
        
        // Get all logs
        let totalLogs = 0;
        let newLogsToday = 0;
        let newLogsThisWeek = 0;
        let newLogsThisMonth = 0;
        
        for (const userDoc of usersSnapshot.docs) {
            const logsRef = collection(db, "users", userDoc.id, "logs");
            const logsSnapshot = await getDocs(logsRef);
            const userLogs = logsSnapshot.docs.map(doc => ({
                ...doc.data(),
                createdAt: safeTimestampToISO(doc.data().createdAt)
            }));
            
            totalLogs += userLogs.length;
            newLogsToday += userLogs.filter((l: any) => isToday(l.createdAt)).length;
            newLogsThisWeek += userLogs.filter((l: any) => isThisWeek(l.createdAt)).length;
            newLogsThisMonth += userLogs.filter((l: any) => isThisMonth(l.createdAt)).length;
        }
        
        // Get reviews
        const reviewsRef = collection(db, "reviews");
        const reviewsSnapshot = await getDocs(reviewsRef);
        const allReviews = reviewsSnapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
        
        const totalReviews = allReviews.length;
        const newReviewsToday = allReviews.filter((r: any) => isToday(r.createdAt)).length;
        const newReviewsThisWeek = allReviews.filter((r: any) => isThisWeek(r.createdAt)).length;
        const newReviewsThisMonth = allReviews.filter((r: any) => isThisMonth(r.createdAt)).length;
        
        // Get lists
        let totalLists = 0;
        let newListsToday = 0;
        let newListsThisWeek = 0;
        let newListsThisMonth = 0;
        
        for (const userDoc of usersSnapshot.docs) {
            const listsRef = collection(db, "users", userDoc.id, "lists");
            const listsSnapshot = await getDocs(listsRef);
            const userLists = listsSnapshot.docs.map(doc => ({
                ...doc.data(),
                createdAt: safeTimestampToISO(doc.data().createdAt)
            }));
            
            totalLists += userLists.length;
            newListsToday += userLists.filter((l: any) => isToday(l.createdAt)).length;
            newListsThisWeek += userLists.filter((l: any) => isThisWeek(l.createdAt)).length;
            newListsThisMonth += userLists.filter((l: any) => isThisMonth(l.createdAt)).length;
        }
        
        // Get favorites
        let totalFavorites = 0;
        let newFavoritesToday = 0;
        let newFavoritesThisWeek = 0;
        
        for (const userDoc of usersSnapshot.docs) {
            const favoritesRef = collection(db, "users", userDoc.id, "favorites");
            const favoritesSnapshot = await getDocs(favoritesRef);
            const userFavorites = favoritesSnapshot.docs.map(doc => ({
                ...doc.data(),
                addedAt: safeTimestampToISO(doc.data().addedAt)
            }));
            
            totalFavorites += userFavorites.length;
            newFavoritesToday += userFavorites.filter((f: any) => f.addedAt && isToday(f.addedAt)).length;
            newFavoritesThisWeek += userFavorites.filter((f: any) => f.addedAt && isThisWeek(f.addedAt)).length;
        }
        
        // Get connections
        const connectionsRef = collection(db, "connections");
        const connectionsSnapshot = await getDocs(connectionsRef);
        const allConnections = connectionsSnapshot.docs.map(doc => ({
            ...doc.data(),
            since: safeTimestampToISO(doc.data().since)
        }));
        
        const totalConnections = allConnections.length;
        const newConnectionsToday = allConnections.filter((c: any) => c.since && isToday(c.since)).length;
        const newConnectionsThisWeek = allConnections.filter((c: any) => c.since && isThisWeek(c.since)).length;
        
        // Get polls
        const pollsRef = collection(db, "polls");
        const pollsSnapshot = await getDocs(pollsRef);
        const allPolls = pollsSnapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
        
        const totalPolls = allPolls.length;
        const newPollsToday = allPolls.filter((p: any) => isToday(p.createdAt)).length;
        const newPollsThisWeek = allPolls.filter((p: any) => isThisWeek(p.createdAt)).length;
        
        // Get debates
        const debatesRef = collection(db, "debates");
        const debatesSnapshot = await getDocs(debatesRef);
        const allDebates = debatesSnapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
        
        const totalDebates = allDebates.length;
        const newDebatesToday = allDebates.filter((d: any) => isToday(d.createdAt)).length;
        const newDebatesThisWeek = allDebates.filter((d: any) => isThisWeek(d.createdAt)).length;
        
        // Get comments (list comments + debate comments)
        const listCommentsRef = collection(db, "list_comments");
        const listCommentsSnapshot = await getDocs(listCommentsRef);
        const allListComments = listCommentsSnapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
        
        const debateCommentsRef = collection(db, "debate_comments");
        const debateCommentsSnapshot = await getDocs(debateCommentsRef);
        const allDebateComments = debateCommentsSnapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
        
        const totalComments = allListComments.length + allDebateComments.length;
        const newCommentsToday = 
            allListComments.filter((c: any) => isToday(c.createdAt)).length +
            allDebateComments.filter((c: any) => isToday(c.createdAt)).length;
        const newCommentsThisWeek = 
            allListComments.filter((c: any) => isThisWeek(c.createdAt)).length +
            allDebateComments.filter((c: any) => isThisWeek(c.createdAt)).length;
        
        // Activities
        const totalActivities = allActivities.length;
        const newActivitiesToday = todayActivities.length;
        const newActivitiesThisWeek = weekActivities.length;
        
        // Calculate averages
        const avgLogsPerUser = totalUsers > 0 ? parseFloat((totalLogs / totalUsers).toFixed(2)) : 0;
        const avgReviewsPerUser = totalUsers > 0 ? parseFloat((totalReviews / totalUsers).toFixed(2)) : 0;
        const avgListsPerUser = totalUsers > 0 ? parseFloat((totalLists / totalUsers).toFixed(2)) : 0;
        
        return {
            totalUsers,
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
            activeUsersToday,
            activeUsersThisWeek,
            totalLogs,
            newLogsToday,
            newLogsThisWeek,
            newLogsThisMonth,
            totalReviews,
            newReviewsToday,
            newReviewsThisWeek,
            newReviewsThisMonth,
            totalLists,
            newListsToday,
            newListsThisWeek,
            newListsThisMonth,
            totalFavorites,
            newFavoritesToday,
            newFavoritesThisWeek,
            totalConnections,
            newConnectionsToday,
            newConnectionsThisWeek,
            totalPolls,
            newPollsToday,
            newPollsThisWeek,
            totalDebates,
            newDebatesToday,
            newDebatesThisWeek,
            totalComments,
            newCommentsToday,
            newCommentsThisWeek,
            totalActivities,
            newActivitiesToday,
            newActivitiesThisWeek,
            avgLogsPerUser,
            avgReviewsPerUser,
            avgListsPerUser
        };
    } catch (error) {
        console.error("Error getting admin stats:", error);
        throw error;
    }
};

// Check if user is admin
export const isAdmin = async (userId: string): Promise<boolean> => {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.data();
        return userData?.isAdmin === true;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
};

// Set user as admin (for initial setup)
export const setUserAsAdmin = async (userId: string): Promise<void> => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            isAdmin: true,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error setting user as admin:", error);
        throw error;
    }
};

// ==================== TV SHOW PROGRESS TRACKING ====================

// Save or update TV show progress
export const saveTVProgress = async (
    userId: string,
    tvId: number,
    tvTitle: string,
    tvPosterUrl: string | undefined,
    currentSeason: number,
    currentEpisode: number,
    totalSeasons: number,
    totalEpisodes: number
): Promise<void> => {
    try {
        const progressRef = doc(db, "users", userId, "tv_progress", `tv_${tvId}`);
        const isCompleted = currentSeason >= totalSeasons && currentEpisode >= (totalEpisodes || 0);
        
        await setDoc(progressRef, {
            userId,
            tvId,
            tvTitle,
            tvPosterUrl: tvPosterUrl || null,
            currentSeason,
            currentEpisode,
            totalSeasons,
            totalEpisodes,
            isCompleted,
            lastWatchedDate: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error saving TV progress:", error);
        throw error;
    }
};

// Get TV show progress for a user
export const getTVProgress = async (userId: string, tvId: number): Promise<TVProgress | null> => {
    try {
        const progressRef = doc(db, "users", userId, "tv_progress", `tv_${tvId}`);
        const progressSnap = await getDoc(progressRef);
        
        if (!progressSnap.exists()) {
            return null;
        }
        
        const data = progressSnap.data();
        return {
            id: progressSnap.id,
            userId: data.userId,
            tvId: data.tvId,
            tvTitle: data.tvTitle,
            tvPosterUrl: data.tvPosterUrl,
            currentSeason: data.currentSeason,
            currentEpisode: data.currentEpisode,
            totalSeasons: data.totalSeasons,
            totalEpisodes: data.totalEpisodes,
            isCompleted: data.isCompleted || false,
            lastWatchedDate: data.lastWatchedDate?.toDate?.()?.toISOString() || new Date().toISOString(),
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as TVProgress;
    } catch (error) {
        console.error("Error getting TV progress:", error);
        throw error;
    }
};

// Get all TV shows in progress for a user
export const getAllTVProgress = async (userId: string): Promise<TVProgress[]> => {
    try {
        const progressRef = collection(db, "users", userId, "tv_progress");
        const progressSnap = await getDocs(progressRef);
        
        return progressSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                tvId: data.tvId,
                tvTitle: data.tvTitle,
                tvPosterUrl: data.tvPosterUrl,
                currentSeason: data.currentSeason,
                currentEpisode: data.currentEpisode,
                totalSeasons: data.totalSeasons,
                totalEpisodes: data.totalEpisodes,
                isCompleted: data.isCompleted || false,
                lastWatchedDate: data.lastWatchedDate?.toDate?.()?.toISOString() || new Date().toISOString(),
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
            } as TVProgress;
        }).filter(progress => !progress.isCompleted)
          .sort((a, b) => new Date(b.lastWatchedDate).getTime() - new Date(a.lastWatchedDate).getTime());
    } catch (error) {
        console.error("Error getting all TV progress:", error);
        throw error;
    }
};

// ==================== DATA EXPORT ====================

// Get all user data for export
export const getAllUserDataForExport = async (userId: string) => {
    try {
        // Get user profile
        const userData = await getUserData(userId);
        
        // Get all logs
        const logs = await getUserLogs(userId, { limitCount: 10000 });
        
        // Get all lists
        const lists = await getUserLists(userId);
        
        // Get favorites
        const favorites = await getFavoriteMovies(userId);
        
        // Get watchlist
        const watchlist = await getWatchlist(userId);
        
        // Get user's reviews
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(reviewsRef, where("authorUid", "==", userId));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviews = reviewsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        } as Review));
        
        // Get TV progress
        const tvProgress = await getAllTVProgress(userId);
        
        return {
            profile: userData,
            logs,
            lists,
            favorites,
            watchlist,
            reviews,
            tvProgress,
            exportDate: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error getting user data for export:", error);
        throw error;
    }
};
