import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { ensureUserDocument } from "@/lib/db";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    await ensureUserDocument(user);
                }
                setUser(user);
            } catch (error) {
                console.error("Error synchronizing user profile:", error);
                setUser(user);
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const userCredential = await signInWithPopup(auth, googleProvider);
            await ensureUserDocument(userCredential.user);
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await ensureUserDocument(userCredential.user);
        } catch (error) {
            console.error("Error signing in with email:", error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, password: string, displayName: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName });
            await ensureUserDocument(auth.currentUser || userCredential.user);
        } catch (error) {
            console.error("Error signing up with email:", error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
