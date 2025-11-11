
import { create } from 'zustand';
import { User, FriendRequest } from '../types';
import {
    getFriends,
    getFriendRequests,
    searchUsers as searchUsersApi,
    sendFriendRequest as sendFriendRequestApi,
    acceptFriendRequest as acceptFriendRequestApi,
    declineFriendRequest as declineFriendRequestApi
} from '../services/geminiService';
import { toast } from '../components/Sonner';

interface FriendsState {
    friends: User[];
    friendRequests: FriendRequest[];
    searchResults: User[];
    sentRequests: string[]; // Store user IDs to whom a request has been sent in this session
    loading: {
        friends: boolean;
        requests: boolean;
        search: boolean;
    };
    fetchFriends: (userId: string) => Promise<void>;
    fetchFriendRequests: (userId: string) => Promise<void>;
    searchUsers: (query: string, currentUserId: string) => Promise<void>;
    sendFriendRequest: (requesterId: string, receiverId: string) => Promise<void>;
    acceptFriendRequest: (friendshipId: string, currentUserId: string) => Promise<void>;
    declineFriendRequest: (friendshipId: string) => Promise<void>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
    friends: [],
    friendRequests: [],
    searchResults: [],
    sentRequests: [],
    loading: {
        friends: false,
        requests: false,
        search: false,
    },

    fetchFriends: async (userId) => {
        set(state => ({ loading: { ...state.loading, friends: true }}));
        try {
            const friends = await getFriends(userId);
            set({ friends });
        } catch (error) {
            console.error("Failed to fetch friends:", error);
            toast.error("Não foi possível carregar sua lista de amigos.");
        } finally {
            set(state => ({ loading: { ...state.loading, friends: false }}));
        }
    },

    fetchFriendRequests: async (userId) => {
        set(state => ({ loading: { ...state.loading, requests: true }}));
        try {
            const friendRequests = await getFriendRequests(userId);
            set({ friendRequests });
        } catch (error) {
            console.error("Failed to fetch friend requests:", error);
            toast.error("Não foi possível carregar os pedidos de amizade.");
        } finally {
            set(state => ({ loading: { ...state.loading, requests: false }}));
        }
    },

    searchUsers: async (query, currentUserId) => {
        if (!query.trim()) {
            set({ searchResults: [] });
            return;
        }
        set(state => ({ loading: { ...state.loading, search: true }}));
        try {
            const searchResults = await searchUsersApi(query, currentUserId);
            set({ searchResults });
        } catch (error) {
            console.error("Failed to search users:", error);
            toast.error("Erro ao buscar usuários.");
        } finally {
            set(state => ({ loading: { ...state.loading, search: false }}));
        }
    },
    
    sendFriendRequest: async (requesterId, receiverId) => {
        try {
            await sendFriendRequestApi(requesterId, receiverId);
            set(state => ({
                sentRequests: [...state.sentRequests, receiverId],
            }));
            toast.success("Pedido de amizade enviado!");
        } catch (error: any) {
            console.error("Failed to send friend request:", error);
            toast.error(error.message || "Não foi possível enviar o pedido.");
        }
    },

    acceptFriendRequest: async (friendshipId, currentUserId) => {
        try {
            await acceptFriendRequestApi(friendshipId);
            set(state => ({
                friendRequests: state.friendRequests.filter(req => req.friendship_id !== friendshipId),
            }));
            toast.success("Amigo adicionado!");
            // Refresh friends list
            get().fetchFriends(currentUserId);
        } catch (error) {
            console.error("Failed to accept friend request:", error);
            toast.error("Não foi possível aceitar o pedido.");
        }
    },

    declineFriendRequest: async (friendshipId) => {
        try {
            await declineFriendRequestApi(friendshipId);
            set(state => ({
                friendRequests: state.friendRequests.filter(req => req.friendship_id !== friendshipId),
            }));
            toast("Pedido de amizade recusado.");
        } catch (error) {
            console.error("Failed to decline friend request:", error);
            toast.error("Não foi possível recusar o pedido.");
        }
    },
}));
