
import { create } from 'zustand';
import { User, FriendRequest } from '../types';
import {
    getFriends,
    getFriendRequests,
    searchUsers as searchUsersApi,
    sendFriendRequest as sendFriendRequestApi,
    acceptFriendRequest as acceptFriendRequestApi,
<<<<<<< HEAD
    declineFriendRequest as declineFriendRequestApi
} from '../services/geminiService';
import { toast } from '../components/Sonner';
=======
    declineFriendRequest as declineFriendRequestApi,
    getFriendsRanking
} from '../services/geminiService';
import { toast } from '../components/Sonner';
import { WeeklyRankingData } from './useGamificationStore';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a

interface FriendsState {
    friends: User[];
    friendRequests: FriendRequest[];
    searchResults: User[];
<<<<<<< HEAD
=======
    friendsRanking: WeeklyRankingData | null;
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    sentRequests: string[]; // Store user IDs to whom a request has been sent in this session
    loading: {
        friends: boolean;
        requests: boolean;
        search: boolean;
<<<<<<< HEAD
    };
    fetchFriends: (userId: string) => Promise<void>;
    fetchFriendRequests: (userId: string) => Promise<void>;
=======
        ranking: boolean;
    };
    fetchFriends: (userId: string) => Promise<void>;
    fetchFriendRequests: (userId: string) => Promise<void>;
    fetchFriendsRanking: (userId: string) => Promise<void>;
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    searchUsers: (query: string, currentUserId: string) => Promise<void>;
    sendFriendRequest: (requesterId: string, receiverId: string) => Promise<void>;
    acceptFriendRequest: (friendshipId: string, currentUserId: string) => Promise<void>;
    declineFriendRequest: (friendshipId: string) => Promise<void>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
    friends: [],
    friendRequests: [],
    searchResults: [],
<<<<<<< HEAD
=======
    friendsRanking: null,
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    sentRequests: [],
    loading: {
        friends: false,
        requests: false,
        search: false,
<<<<<<< HEAD
=======
        ranking: false,
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
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

<<<<<<< HEAD
=======
    fetchFriendsRanking: async (userId) => {
        set(state => ({ loading: { ...state.loading, ranking: true }}));
        try {
            const friendsRanking = await getFriendsRanking(userId);
            set({ friendsRanking });
        } catch (error) {
            console.error("Failed to fetch friends ranking:", error);
            toast.error("Não foi possível carregar o ranking de amigos.");
        } finally {
            set(state => ({ loading: { ...state.loading, ranking: false }}));
        }
    },

>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
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
<<<<<<< HEAD
            // Refresh friends list
            get().fetchFriends(currentUserId);
=======
            // Refresh friends list and ranking
            get().fetchFriends(currentUserId);
            get().fetchFriendsRanking(currentUserId);
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
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
