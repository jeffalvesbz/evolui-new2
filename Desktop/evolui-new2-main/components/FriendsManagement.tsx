import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import { UsersIcon, SearchIcon, UserPlusIcon, UserCheckIcon, UserXIcon, EllipsisIcon } from './icons';
import { useFriendsStore } from '../stores/useFriendsStore';
import { useAuthStore } from '../stores/useAuthStore';
import Avatar from './Avatar';
import { User } from '../types';

type ActiveTab = 'friends' | 'search' | 'requests';

const FriendsManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('friends');
    const { friendRequests, fetchFriends, fetchFriendRequests } = useFriendsStore();
    const user = useAuthStore(state => state.user);

    // Carregar amigos e pedidos quando o componente for montado
    useEffect(() => {
        if (user?.id) {
            fetchFriends(user.id);
            fetchFriendRequests(user.id);
        }
    }, [user?.id, fetchFriends, fetchFriendRequests]);

    const TabButton: React.FC<{ label: string; tab: ActiveTab; count?: number }> = ({ label, tab, count }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`relative flex-1 py-2 text-xs font-bold text-center transition-colors ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
            {label}
            {count && count > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">{count}</span>
            )}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
    );

    return (
        <Card className="border-border shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UsersIcon className="w-5 h-5 text-primary" /> Amigos</CardTitle>
            </CardHeader>
            <div className="border-b border-border flex">
                <TabButton label="Meus Amigos" tab="friends" />
                <TabButton label="Buscar" tab="search" />
                <TabButton label="Pedidos" tab="requests" count={friendRequests.length} />
            </div>
            <CardContent className="p-4 max-h-[400px] overflow-y-auto">
                {activeTab === 'friends' && <FriendsList />}
                {activeTab === 'search' && <SearchFriends />}
                {activeTab === 'requests' && <FriendRequests />}
            </CardContent>
        </Card>
    );
};

const FriendsList: React.FC = () => {
    const { friends, loading } = useFriendsStore();

    if (loading.friends) return <p className="text-center text-sm text-muted-foreground py-8">Carregando amigos...</p>;
    if (friends.length === 0) return <p className="text-center text-sm text-muted-foreground py-8">Você ainda não tem amigos. Adicione alguns!</p>;
    
    return (
        <div className="space-y-2">
            {friends.map(friend => (
                <div key={friend.id} className="p-2.5 rounded-lg flex items-center gap-3 hover:bg-muted/50 transition-colors">
                    <Avatar name={friend.name} size="sm" />
                    <p className="text-sm font-bold text-foreground flex-1 truncate">{friend.name}</p>
                    <button className="p-2 text-muted-foreground hover:text-foreground"><EllipsisIcon className="w-4 h-4"/></button>
                </div>
            ))}
        </div>
    );
};

const SearchFriends: React.FC = () => {
    const [query, setQuery] = useState('');
    const [sendingRequest, setSendingRequest] = useState<string | null>(null); // ID do usuário que está sendo enviado pedido
    const user = useAuthStore(state => state.user);
    const { searchUsers, searchResults, loading, sendFriendRequest, sentRequests, friends } = useFriendsStore();
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    
    const friendIds = new Set(friends.map(f => f.id));

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        
        // Limpar timer anterior
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        
        // Se a query estiver vazia, limpar resultados imediatamente
        if (!value.trim()) {
            searchUsers('', user?.id || ''); // Isso limpa os resultados no store
            return;
        }
        
        // Aguardar 500ms antes de buscar (debounce)
        debounceTimer.current = setTimeout(() => {
            if (user?.id && value.trim().length >= 2) {
                searchUsers(value.trim(), user.id);
            }
        }, 500);
    };

    // Limpar timer ao desmontar
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    return (
        <div className="space-y-4">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={handleSearch}
                    placeholder="Buscar usuário..."
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 pl-9 text-sm"
                />
            </div>
            <div className="space-y-2">
                {loading.search && <p className="text-center text-sm text-muted-foreground py-4">Buscando...</p>}
                {!loading.search && searchResults.map(result => {
                    const isFriend = friendIds.has(result.id);
                    const requestSent = sentRequests.includes(result.id);
                    const isSending = sendingRequest === result.id;
                    return (
                        <div key={result.id} className="p-2.5 rounded-lg flex items-center gap-3 bg-background/50">
                            <Avatar name={result.name} size="sm" />
                            <p className="text-sm font-bold text-foreground flex-1 truncate">{result.name}</p>
                            {isFriend ? (
                                <span className="text-xs font-semibold text-secondary">Amigo</span>
                            ) : requestSent || isSending ? (
                                <button className="px-3 py-1.5 text-xs font-semibold rounded-md bg-muted text-muted-foreground" disabled>
                                    {isSending ? 'Enviando...' : 'Pedido Enviado'}
                                </button>
                            ) : (
                                <button 
                                    onClick={async () => {
                                        if (user && !isSending && !requestSent) {
                                            setSendingRequest(result.id);
                                            try {
                                                await sendFriendRequest(user.id, result.id);
                                            } catch (error) {
                                                // Erro já é tratado no store com toast
                                            } finally {
                                                setSendingRequest(null);
                                            }
                                        }
                                    }}
                                    disabled={isSending || requestSent}
                                    className="p-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserPlusIcon className="w-5 h-5"/>
                                </button>
                            )}
                        </div>
                    );
                })}
                 {!loading.search && query && searchResults.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nenhum usuário encontrado.</p>}
            </div>
        </div>
    );
};

const FriendRequests: React.FC = () => {
    const { friendRequests, loading, acceptFriendRequest, declineFriendRequest, fetchFriendRequests } = useFriendsStore();
    const user = useAuthStore(state => state.user);

    // Recarregar pedidos quando aceitar/recusar
    const handleAccept = async (friendshipId: string) => {
        if (user?.id) {
            await acceptFriendRequest(friendshipId, user.id);
            fetchFriendRequests(user.id);
        }
    };

    const handleDecline = async (friendshipId: string) => {
        await declineFriendRequest(friendshipId);
        if (user?.id) {
            fetchFriendRequests(user.id);
        }
    };

    if (loading.requests) return <p className="text-center text-sm text-muted-foreground py-8">Carregando pedidos...</p>;
    if (friendRequests.length === 0) return <p className="text-center text-sm text-muted-foreground py-8">Nenhum pedido de amizade pendente.</p>;
    
    return (
        <div className="space-y-2">
            {friendRequests.map(req => (
                <div key={req.friendship_id} className="p-2.5 rounded-lg flex items-center gap-3 bg-background/50">
                    <Avatar name={req.requester_name} size="sm" />
                    <div className="flex-1">
                         <p className="text-sm font-bold text-foreground truncate">{req.requester_name}</p>
                    </div>
                    <button onClick={() => handleDecline(req.friendship_id)} className="p-2 text-muted-foreground hover:text-red-500"><UserXIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleAccept(req.friendship_id)} className="p-2 text-muted-foreground hover:text-green-500"><UserCheckIcon className="w-5 h-5"/></button>
                </div>
            ))}
        </div>
    );
};

export default FriendsManagement;
