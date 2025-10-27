import { create } from 'zustand';
import { User, FriendRequest } from '../types';
import {
    getFriends,
    getFriendRequests,
    searchUsers as searchUsersApi,
    sendFriendRequest as sendFriendRequestApi,
    acceptFriendRequest as acceptFriendRequestApi,
    declineFriendRequest as declineFriendRequestApi,
    getFriendsRanking
} from '../services/geminiService';
import { toast } from '../components/Sonner';
import { WeeklyRankingData } from './useGamificationStore';

interface FriendsState {
    friends: User[];
    friendRequests: FriendRequest[];
    searchResults: User[];
    friendsRanking: WeeklyRankingData | null;
    sentRequests: string[]; // Store user IDs to whom a request has been sent in this session
    loading: {
        friends: boolean;
        requests: boolean;
        search: boolean;
        ranking: boolean;
    };
    fetchFriends: (userId: string) => Promise<void>;
    fetchFriendRequests: (userId: string) => Promise<void>;
    fetchFriendsRanking: (userId: string) => Promise<void>;
    searchUsers: (query: string, currentUserId: string) => Promise<void>;
    sendFriendRequest: (requesterId: string, receiverId: string) => Promise<void>;
    acceptFriendRequest: (friendshipId: string, requesterId: string) => Promise<void>;
    declineFriendRequest: (friendshipId: string) => Promise<void>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
    friends: [],
    friendRequests: [],
    searchResults: [],
    friendsRanking: null,
    sentRequests: [],
    loading: {
        friends: false,
        requests: false,
        search: false,
        ranking: false,
    },

    fetchFriends: async (userId) => {
        set(state => ({ loading: { ...state.loading, friends: true } }));
        try {
            const friends = await getFriends(userId);
            set({ friends });
        } catch (error) {
            console.error("Failed to fetch friends:", error);
            toast.error("Não foi possível carregar sua lista de amigos.");
        } finally {
            set(state => ({ loading: { ...state.loading, friends: false } }));
        }
    },

    fetchFriendRequests: async (userId) => {
        set(state => ({ loading: { ...state.loading, requests: true } }));
        try {
            const requests = await getFriendRequests(userId);
            set({ friendRequests: requests });
        } catch (error) {
            console.error("Failed to fetch friend requests:", error);
            toast.error("Não foi possível carregar os pedidos de amizade.");
        } finally {
            set(state => ({ loading: { ...state.loading, requests: false } }));
        }
    },
    
    fetchFriendsRanking: async (userId) => {
        set(state => ({ loading: { ...state.loading, ranking: true } }));
        try {
            const ranking = await getFriendsRanking(userId);
            set({ friendsRanking: ranking });
        } catch (error) {
            console.error("Failed to fetch friends ranking:", error);
            toast.error("Não foi possível carregar o ranking de amigos.");
        } finally {
            set(state => ({ loading: { ...state.loading, ranking: false } }));
        }
    },

    searchUsers: async (query, currentUserId) => {
        if (!query.trim()) {
            set({ searchResults: [] });
            return;
        }
        set(state => ({ loading: { ...state.loading, search: true } }));
        try {
            const users = await searchUsersApi(query, currentUserId);
            set({ searchResults: users });
        } catch (error) {
            console.error("Failed to search users:", error);
        } finally {
            set(state => ({ loading: { ...state.loading, search: false } }));
        }
    },

    sendFriendRequest: async (requesterId, receiverId) => {
        try {
            await sendFriendRequestApi(requesterId, receiverId);
            set(state => ({ sentRequests: [...state.sentRequests, receiverId] }));
            toast.success("Pedido de amizade enviado!");
        } catch (error) {
            console.error("Failed to send friend request:", error);
            toast.error("Não foi possível enviar o pedido.");
        }
    },

    acceptFriendRequest: async (friendshipId, requesterId) => {
        try {
            await acceptFriendRequestApi(friendshipId);
            set(state => ({
                friendRequests: state.friendRequests.filter(req => req.friendship_id !== friendshipId),
            }));
            // Re-fetch friends list after accepting
            get().fetchFriends(requesterId);
            toast.success("Amigo adicionado!");
        } catch (error) {
            console.error("Failed to accept friend request:", error);
            toast.error("Erro ao aceitar pedido.");
        }
    },
    
    declineFriendRequest: async (friendshipId) => {
         try {
            await declineFriendRequestApi(friendshipId);
            set(state => ({
                friendRequests: state.friendRequests.filter(req => req.friendship_id !== friendshipId),
            }));
            // FIX: The `toast.info` method does not exist. Use the default `toast()` function which defaults to the 'info' type.
            toast("Pedido de amizade recusado.");
        } catch (error) {
            console.error("Failed to decline friend request:", error);
            toast.error("Erro ao recusar pedido.");
        }
    },
}));