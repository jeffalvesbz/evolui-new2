import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SettingsIcon,
    LogOutIcon,
    TrophyIcon,
    ChevronDownIcon,
    UserIcon,
    CreditCardIcon
} from './icons';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

interface User {
    name: string;
    email: string;
    avatar_url?: string;
}

interface UserMenuProps {
    user: User;
    logout: () => void;
    setActiveView: (view: string) => void;
    onCloseSidebar?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, logout, setActiveView, onCloseSidebar }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { planType, hasActiveSubscription } = useSubscriptionStore();
    const isPremium = planType === 'premium' && hasActiveSubscription();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNavigate = (view: string) => {
        setActiveView(view);
        setIsOpen(false);
        if (onCloseSidebar) {
            onCloseSidebar();
        }
    };

    const handleLogout = () => {
        logout();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 flex items-center gap-3 rounded-xl transition-all duration-200 border ${isOpen
                    ? 'bg-muted/40 border-primary/20 shadow-lg shadow-primary/5'
                    : 'bg-muted/10 border-transparent hover:bg-muted/20 hover:border-white/5'
                    }`}
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 shrink-0">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="font-bold text-primary text-lg">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>

                <ChevronDownIcon className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 w-full mb-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                    >
                        <div className="p-2 space-y-1">
                            {!isPremium && (
                                <button
                                    onClick={() => handleNavigate('pagamento')}
                                    className="w-full p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-500 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-3 group"
                                >
                                    <div className="p-1.5 bg-amber-500/20 rounded-md group-hover:scale-110 transition-transform">
                                        <TrophyIcon className="w-4 h-4" />
                                    </div>
                                    <span>Fazer Upgrade</span>
                                </button>
                            )}

                            <div className="h-px bg-white/5 my-1 mx-2" />

                            <button
                                onClick={() => handleNavigate('configuracoes')}
                                className="w-full p-2.5 hover:bg-white/5 text-muted-foreground hover:text-foreground rounded-lg text-sm transition-colors flex items-center gap-3"
                            >
                                <SettingsIcon className="w-4 h-4" />
                                <span>Configurações</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full p-2.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded-lg text-sm transition-colors flex items-center gap-3"
                            >
                                <LogOutIcon className="w-4 h-4" />
                                <span>Sair</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserMenu;
