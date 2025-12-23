import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../services/supabaseClient';
import { toast, Toaster } from './Sonner';
import { LandmarkIcon, EyeIcon, EyeOffIcon, LockIcon, ArrowRightIcon, AlertCircleIcon, CheckCircle2Icon } from './icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Schema de validação para nova senha
const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'A senha deve ter pelo menos 8 caracteres')
        .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
        .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
        .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Limpar flag de recovery ao desmontar ou concluir
    useEffect(() => {
        return () => {
            sessionStorage.removeItem('evolui_recovery_flow');
            (window as any).__IS_RECOVERY_FLOW__ = false;
        };
    }, []);

    const form = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    // Verificar se o usuário chegou via link de reset (com token na URL)
    useEffect(() => {
        const handleHashChange = async () => {
            // O Supabase envia o token como hash fragment
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessTokenFromHash = hashParams.get('access_token');
            const type = hashParams.get('type');
            const errorDescription = hashParams.get('error_description');

            if (errorDescription) {
                setError(decodeURIComponent(errorDescription));
                return;
            }

            if (accessTokenFromHash && type === 'recovery') {
                setAccessToken(accessTokenFromHash);

                // Configurar a sessão com o token de recovery
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessTokenFromHash,
                    refresh_token: hashParams.get('refresh_token') || '',
                });

                if (sessionError) {
                    setError('Link de recuperação inválido ou expirado. Por favor, solicite um novo link.');
                    console.error('Session error:', sessionError);
                }
            } else if (!accessTokenFromHash) {
                // Se não há token, verificar se já existe uma sessão ativa de recovery
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setError('Link de recuperação inválido ou expirado. Por favor, solicite um novo link.');
                }
            }
        };

        handleHashChange();

        // Também ouvir mudanças de hash
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const onSubmit = async (data: ResetPasswordInput) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) {
                throw error;
            }

            setSuccess(true);
            toast.success('Senha alterada com sucesso!');

            // Limpar flags
            sessionStorage.removeItem('evolui_recovery_flow');

            // Redirecionar para o dashboard após 2 segundos
            // Usando window.location.href para forçar reload completo e limpar o estado de recovery
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } catch (err: any) {
            console.error('Reset password error:', err);
            toast.error(err.message || 'Erro ao alterar a senha. Tente novamente.');
            form.setError('root', { message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
            <Toaster />

            {/* Background decorativo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-card p-8 space-y-6">
                    {/* Logo e título */}
                    <div className="text-center space-y-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-4 shadow-lg"
                        >
                            <LandmarkIcon className="w-8 h-8 text-black" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-foreground">Redefinir senha</h1>
                        <p className="text-muted-foreground">
                            {error ? 'Ocorreu um erro' : success ? 'Senha alterada!' : 'Digite sua nova senha'}
                        </p>
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircleIcon className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    Link inválido
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {error}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="w-full h-11 px-4 flex items-center justify-center gap-2 btn-gradient shadow-lg shadow-primary/20 hover:shadow-primary/40"
                            >
                                Voltar para o início
                            </button>
                        </div>
                    )}

                    {/* Sucesso */}
                    {success && !error && (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2Icon className="w-8 h-8 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    Senha alterada com sucesso!
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Você será redirecionado para o dashboard em instantes...
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => window.location.href = '/dashboard'}
                                className="w-full h-11 px-4 flex items-center justify-center gap-2 btn-gradient shadow-lg shadow-primary/20 hover:shadow-primary/40"
                            >
                                Ir para o Dashboard
                                <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Formulário */}
                    {!error && !success && (
                        <motion.form
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    Nova senha
                                </label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...form.register('password')}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOffIcon className="w-5 h-5" />
                                        ) : (
                                            <EyeIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {form.formState.errors.password && (
                                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircleIcon className="w-3 h-3" />
                                        {form.formState.errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    Confirmar nova senha
                                </label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        {...form.register('confirmPassword')}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOffIcon className="w-5 h-5" />
                                        ) : (
                                            <EyeIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {form.formState.errors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircleIcon className="w-3 h-3" />
                                        {form.formState.errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            {/* Requisitos da senha */}
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">A senha deve conter:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li className="flex items-center gap-2">
                                        <span className={form.watch('password')?.length >= 8 ? 'text-green-500' : ''}>
                                            {form.watch('password')?.length >= 8 ? '✓' : '○'}
                                        </span>
                                        Pelo menos 8 caracteres
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={/[A-Z]/.test(form.watch('password') || '') ? 'text-green-500' : ''}>
                                            {/[A-Z]/.test(form.watch('password') || '') ? '✓' : '○'}
                                        </span>
                                        Uma letra maiúscula
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={/[a-z]/.test(form.watch('password') || '') ? 'text-green-500' : ''}>
                                            {/[a-z]/.test(form.watch('password') || '') ? '✓' : '○'}
                                        </span>
                                        Uma letra minúscula
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={/[0-9]/.test(form.watch('password') || '') ? 'text-green-500' : ''}>
                                            {/[0-9]/.test(form.watch('password') || '') ? '✓' : '○'}
                                        </span>
                                        Um número
                                    </li>
                                </ul>
                            </div>

                            {form.formState.errors.root && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-xs text-red-500 flex items-center gap-2">
                                        <AlertCircleIcon className="w-4 h-4" />
                                        {form.formState.errors.root.message}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 px-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                        Alterando senha...
                                    </>
                                ) : (
                                    <>
                                        Alterar senha
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
