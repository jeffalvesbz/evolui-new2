import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../../../stores/useAuthStore';

// Mock do Supabase
vi.mock('../../../services/supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signInWithOAuth: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            signOut: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
    },
}));

// Mock do toast
vi.mock('../../../components/Sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('useAuthStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useAuthStore.setState({
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false,
        });
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = useAuthStore.getState();

            expect(state.user).toBeNull();
            expect(state.session).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.loading).toBe(false);
        });
    });

    describe('logout', () => {
        it('should clear user state on logout', async () => {
            // Set up initial authenticated state
            useAuthStore.setState({
                user: { id: '123', name: 'Test User', email: 'test@example.com' },
                session: { access_token: 'token' } as any,
                isAuthenticated: true,
            });

            // Verify initial state
            expect(useAuthStore.getState().isAuthenticated).toBe(true);

            // Call logout
            await useAuthStore.getState().logout();

            // Verify state was cleared
            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.session).toBeNull();
            expect(state.isAuthenticated).toBe(false);
        });
    });

    describe('store actions', () => {
        it('should have login function', () => {
            const { login } = useAuthStore.getState();
            expect(typeof login).toBe('function');
        });

        it('should have signup function', () => {
            const { signup } = useAuthStore.getState();
            expect(typeof signup).toBe('function');
        });

        it('should have signInWithOAuth function', () => {
            const { signInWithOAuth } = useAuthStore.getState();
            expect(typeof signInWithOAuth).toBe('function');
        });

        it('should have resetPassword function', () => {
            const { resetPassword } = useAuthStore.getState();
            expect(typeof resetPassword).toBe('function');
        });

        it('should have checkAuth function', () => {
            const { checkAuth } = useAuthStore.getState();
            expect(typeof checkAuth).toBe('function');
        });
    });
});
