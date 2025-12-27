import {
    collection,
    collectionGroup,
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
    arrayUnion
} from "firebase/firestore";
import { db } from "./firebase";
import { LogEntry, Movie, MovieList, Review, ReviewComment } from "@/types/movie";


export const createLogEntry = async (userId: string, entry: Omit<LogEntry, "id" | "createdAt" | "updatedAt">) => {
    try {
        const logsRef = collection(db, "users", userId, "logs");
        const docRef = await addDoc(logsRef, {
            ...entry,
            userId, // Keeping it for potential Collection Group queries
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            watchedDate: Timestamp.fromDate(new Date(entry.watchedDate))
        });
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
                watchedDate: (data.watchedDate as Timestamp).toDate().toISOString(),
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
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


export const getMovieLogs = async (userId: string, movieId: number) => {
    try {
        const logsRef = collection(db, "users", userId, "logs");
        const q = query(
            logsRef,
            where("movieId", "==", movieId)
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                watchedDate: (data.watchedDate as Timestamp).toDate().toISOString(),
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString(),
            } as LogEntry;
        }).sort((a, b) => new Date(b.watchedDate).getTime() - new Date(a.watchedDate).getTime());
    } catch (error) {
        console.error("Error getting movie logs:", error);
        throw error;
    }
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
        const watchlistRef = doc(db, "users", userId, "watchlist", movie.id.toString());
        const watchlistDoc = await getDoc(watchlistRef);

        if (watchlistDoc.exists()) {
            await deleteDoc(watchlistRef);
            return false; // Removed
        } else {
            await setDoc(watchlistRef, {
                ...movie,
                addedAt: serverTimestamp()
            });
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

export const isInWatchlist = async (userId: string, movieId: number) => {
    try {
        const watchlistRef = doc(db, "users", userId, "watchlist", movieId.toString());
        const watchlistDoc = await getDoc(watchlistRef);
        return watchlistDoc.exists();
    } catch (error) {
        console.error("Error checking watchlist:", error);
        return false;
    }
};

export const toggleFavorite = async (userId: string, movie: Movie) => {
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", movie.id.toString());
        const favoriteDoc = await getDoc(favoriteRef);

        if (favoriteDoc.exists()) {
            await deleteDoc(favoriteRef);
            return false; // Removed
        } else {
            await setDoc(favoriteRef, {
                ...movie,
                addedAt: serverTimestamp()
            });
            return true; // Added
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
    }
};

export const isFavorite = async (userId: string, movieId: number) => {
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", movieId.toString());
        const favoriteDoc = await getDoc(favoriteRef);
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
        await updateDoc(listRef, {
            movies: arrayUnion(movie)
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

export const rejectConnectionRequest = async (requestId: string) => {
    try {
        await deleteDoc(doc(db, "connection_requests", requestId));
    } catch (error) {
        console.error("Error rejecting connection request:", error);
        throw error;
    }
};

export const getConnectionUids = async (userId: string) => {
    try {
        const connectionsRef = collection(db, "connections");
        const q = query(connectionsRef, where("uids", "array-contains", userId), where("status", "==", "accepted"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const uids = doc.data().uids as string[];
            return uids.find(id => id !== userId);
        }).filter(Boolean) as string[];
    } catch (error) {
        console.error("Error getting connection UIDs:", error);
        return [];
    }
};

export const getConnectionActivity = async (connectionUids: string[], limitCount: number = 20) => {
    if (connectionUids.length === 0) return [];

    try {
        // collectionGroup allows querying all "logs" subcollections across all users
        const logsRef = collectionGroup(db, "logs");

        // Firestore 'in' query limit is 30. If user has more friends, we'd need to batch.
        // For current scope, we take the first 30 connections.
        const targetUids = connectionUids.slice(0, 30);

        const q = query(
            logsRef,
            where("userId", "in", targetUids),
            orderBy("watchedDate", "desc"),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);

        // Enrich logs with user profile data
        const enrichedLogs = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const userData = await getUserData(data.userId);
            return {
                id: doc.id,
                ...data,
                user: userData,
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString()
            };
        }));

        return enrichedLogs;
    } catch (error) {
        console.error("Error getting connection activity:", error);
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
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString()
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
            createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString()
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
            createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString()
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


