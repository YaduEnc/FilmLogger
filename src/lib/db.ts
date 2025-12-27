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
    deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { LogEntry, Movie } from "@/types/movie";

export const createLogEntry = async (userId: string, entry: Omit<LogEntry, "id" | "createdAt" | "updatedAt">) => {
    try {
        const logsRef = collection(db, "logs");
        const docRef = await addDoc(logsRef, {
            ...entry,
            userId,
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

export const getUserLogs = async (userId: string, limitCount = 50) => {
    try {
        const logsRef = collection(db, "logs");
        const q = query(
            logsRef,
            where("userId", "==", userId),
            limit(limitCount)
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
        console.error("Error getting user logs:", error);
        throw error;
    }
};

export const getMovieLogs = async (userId: string, movieId: number) => {
    try {
        const logsRef = collection(db, "logs");
        const q = query(
            logsRef,
            where("userId", "==", userId),
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

export const getUserStats = async (logs: LogEntry[]) => {
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
        lists: 0
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
