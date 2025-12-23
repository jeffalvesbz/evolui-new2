import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, signupSchema, forgotPasswordSchema, type LoginInput, type SignupInput, type ForgotPasswordInput } from '../schemas/auth.schema';
import { useAuthStore } from '../stores/useAuthStore';
import { toast } from './Sonner';
import { LandmarkIcon, EyeIcon, EyeOffIcon, MailIcon, LockIcon, UserIcon, ArrowRightIcon, AlertCircleIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

// Ícones OAuth
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GitHubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

interface LoginPageProps {
  initialAuthMode?: 'login' | 'signup' | 'forgot';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialAuthMode = 'login' }) => {
  const { login, signup, signInWithOAuth, resetPassword, loading } = useAuthStore();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>(initialAuthMode);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const forgotForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onLoginSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
      loginForm.setError('root', { message: error.message });
    }
  };

  const onSignupSubmit = async (data: SignupInput) => {
    try {
      await signup(data.email, data.password, data.name);
      toast.success('Conta criada! Verifique seu email para confirmar.');
      setAuthMode('login');
      signupForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta.');
      signupForm.setError('root', { message: error.message });
    }
  };

  const onForgotSubmit = async (data: ForgotPasswordInput) => {
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de recuperação.');
      forgotForm.setError('root', { message: error.message });
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      await signInWithOAuth(provider);
    } catch (error: any) {
      toast.error(`Erro ao fazer login com ${provider === 'google' ? 'Google' : 'GitHub'}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
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
            <h1 className="text-3xl font-bold text-foreground">Bem-vindo ao Eleva</h1>
            <p className="text-muted-foreground">
              {authMode === 'login' && 'Faça login para continuar seus estudos'}
              {authMode === 'signup' && 'Crie sua conta e comece sua jornada'}
              {authMode === 'forgot' && 'Recupere sua senha'}
            </p>
          </div>

          {/* Tabs de modo */}
          {authMode !== 'forgot' && (
            <div className="flex bg-muted/50 p-1 rounded-lg">
              <button
                onClick={() => {
                  setAuthMode('login');
                  loginForm.reset();
                }}
                className={`flex-1 p-2 rounded-md text-sm font-semibold transition-all ${authMode === 'login'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  signupForm.reset();
                }}
                className={`flex-1 p-2 rounded-md text-sm font-semibold transition-all ${authMode === 'signup'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Registrar
              </button>
            </div>
          )}

          {/* OAuth Buttons */}
          {authMode !== 'forgot' && (
            <div className="space-y-3">
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
                className="w-full h-11 px-4 flex items-center justify-center gap-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <GoogleIcon className="w-5 h-5" />
                <span className="text-sm font-medium text-foreground">
                  Continuar com Google
                </span>
              </button>

              <button
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
                className="w-full h-11 px-4 flex items-center justify-center gap-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <GitHubIcon className="w-5 h-5" />
                <span className="text-sm font-medium text-foreground">
                  Continuar com GitHub
                </span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                </div>
              </div>
            </div>
          )}

          {/* Forms */}
          <AnimatePresence mode="wait">
            {authMode === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      {...loginForm.register('email')}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="w-3 h-3" />
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Senha
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...loginForm.register('password')}
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
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="w-3 h-3" />
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {loginForm.formState.errors.root && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-500 flex items-center gap-2">
                      <AlertCircleIcon className="w-4 h-4" />
                      {loginForm.formState.errors.root.message}
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
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {authMode === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Nome completo
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      {...signupForm.register('name')}
                      placeholder="Seu nome"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  </div>
                  {signupForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="w-3 h-3" />
                      {signupForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      {...signupForm.register('email')}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  </div>
                  {signupForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="w-3 h-3" />
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Senha
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...signupForm.register('password')}
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
                  {signupForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="w-3 h-3" />
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {signupForm.formState.errors.root && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-500 flex items-center gap-2">
                      <AlertCircleIcon className="w-4 h-4" />
                      {signupForm.formState.errors.root.message}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 px-4 flex items-center justify-center gap-2 btn-gradient shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar conta
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {authMode === 'forgot' && (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={forgotForm.handleSubmit(onForgotSubmit)}
                className="space-y-4"
              >
                {!emailSent ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Email
                      </label>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          {...forgotForm.register('email')}
                          placeholder="seu@email.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                      </div>
                      {forgotForm.formState.errors.email && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircleIcon className="w-3 h-3" />
                          {forgotForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {forgotForm.formState.errors.root && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-500 flex items-center gap-2">
                          <AlertCircleIcon className="w-4 h-4" />
                          {forgotForm.formState.errors.root.message}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setEmailSent(false);
                          forgotForm.reset();
                        }}
                        className="flex-1 h-11 px-4 flex items-center justify-center rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 h-11 px-4 flex items-center justify-center gap-2 btn-gradient shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                            Enviando...
                          </>
                        ) : (
                          'Enviar link'
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                      <MailIcon className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Email enviado!
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setEmailSent(false);
                        forgotForm.reset();
                      }}
                      className="w-full h-11 px-4 flex items-center justify-center gap-2 btn-gradient shadow-lg shadow-primary/20 hover:shadow-primary/40"
                    >
                      Voltar ao login
                    </button>
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-primary hover:underline">
            Termos de Serviço
          </a>{' '}
          e{' '}
          <a href="#" className="text-primary hover:underline">
            Política de Privacidade
          </a>
        </p>
      </motion.div>
    </div>
  );
};

