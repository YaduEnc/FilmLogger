import { db } from './firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';

const safeTimestampToISO = (value: any): string => {
    if (!value) return new Date().toISOString();
    if (typeof value === 'string') return value;
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return new Date().toISOString();
};

// ==================== MESSAGING FUNCTIONS ====================

// Create or get conversation between two users
export const getOrCreateConversation = async (user1Id: string, user2Id: string, user1Data: any, user2Data: any) => {
    try {
        // Check if conversation already exists
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', user1Id)
        );

        const snapshot = await getDocs(q);
        const existing = snapshot.docs.find(doc =>
            doc.data().participants.includes(user2Id)
        );

        if (existing) {
            return existing.id;
        }

        // Create new conversation
        const newConversation = {
            participants: [user1Id, user2Id],
            participantNames: {
                [user1Id]: user1Data.displayName,
                [user2Id]: user2Data.displayName
            },
            participantUsernames: {
                [user1Id]: user1Data.username || '',
                [user2Id]: user2Data.username || ''
            },
            participantPhotos: {
                [user1Id]: user1Data.photoURL || '',
                [user2Id]: user2Data.photoURL || ''
            },
            lastMessage: '',
            lastMessageTime: new Date().toISOString(),
            lastMessageSenderId: '',
            unreadCount: {
                [user1Id]: 0,
                [user2Id]: 0
            },
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(conversationsRef, newConversation);
        return docRef.id;
    } catch (error) {
        console.error("Error creating conversation:", error);
        throw error;
    }
};

// Send a message
export const sendMessage = async (messageData: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    text: string;
    movieId?: number;
    movieTitle?: string;
    moviePoster?: string;
    mediaType?: 'movie' | 'tv';
    recipientId: string;
}) => {
    try {
        const { conversationId, recipientId, ...messageFields } = messageData;

        // Add message
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, {
            ...messageFields,
            read: false,
            createdAt: new Date().toISOString()
        });

        // Update conversation
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);
        const currentUnread = conversationSnap.data()?.unreadCount || {};

        await updateDoc(conversationRef, {
            lastMessage: messageData.text,
            lastMessageTime: new Date().toISOString(),
            lastMessageSenderId: messageData.senderId,
            unreadCount: {
                ...currentUnread,
                [recipientId]: (currentUnread[recipientId] || 0) + 1
            }
        });
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

// Subscribe to user's conversations
export const subscribeToConversations = (userId: string, callback: (conversations: any[]) => void): Unsubscribe => {
    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', userId),
            orderBy('lastMessageTime', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const conversations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: safeTimestampToISO(doc.data().createdAt),
                lastMessageTime: safeTimestampToISO(doc.data().lastMessageTime)
            }));
            callback(conversations);
        }, (error) => {
            console.error("Error subscribing to conversations:", error);
            callback([]);
        });
    } catch (error) {
        console.error("Error setting up conversation subscription:", error);
        return () => { };
    }
};

// Get user's conversations (Legacy - keep for now if needed, or remove)
export const getUserConversations = async (userId: string) => {
    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', userId),
            orderBy('lastMessageTime', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt),
            lastMessageTime: safeTimestampToISO(doc.data().lastMessageTime)
        }));
    } catch (error) {
        console.error("Error getting conversations:", error);
        return [];
    }
};

// Subscribe to messages in a conversation
export const subscribeToMessages = (conversationId: string, callback: (messages: any[]) => void): Unsubscribe => {
    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: safeTimestampToISO(doc.data().createdAt)
            }));
            callback(messages);
        }, (error) => {
            console.error("Error subscribing to messages:", error);
            callback([]);
        });
    } catch (error) {
        console.error("Error setting up message subscription:", error);
        return () => { };
    }
};

// Get messages in a conversation
export const getConversationMessages = async (conversationId: string) => {
    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: safeTimestampToISO(doc.data().createdAt)
        }));
    } catch (error) {
        console.error("Error getting messages:", error);
        return [];
    }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId: string, userId: string) => {
    try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);
        const currentUnread = conversationSnap.data()?.unreadCount || {};

        await updateDoc(conversationRef, {
            unreadCount: {
                ...currentUnread,
                [userId]: 0
            }
        });
    } catch (error) {
        console.error("Error marking messages as read:", error);
    }
};

