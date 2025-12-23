import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import {
    CheckCircle2Icon,
    BrainCircuitIcon,
    BarChart3Icon,
    XCircleIcon,
    ArrowRightIcon,
    LandmarkIcon,
    XIcon,
    LayoutDashboardIcon,
    TimerIcon,
    SparklesIcon,
    LockIcon,
    Volume2Icon,
    VolumeXIcon,
    UsersIcon,
    StarIcon,
    ChevronDownIcon,
    MessageCircleIcon,
    MailIcon
} from './icons';

// --- Animations ---
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

// --- Sub-Components ---

const PainItem = ({ text }: { text: string }) => (
    <motion.li variants={fadeInUp} className="flex items-start gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
        <XCircleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <span className="text-lg text-red-100/80">{text}</span>
    </motion.li>
);

const SolutionCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300 relative overflow-hidden group"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
);

const TestimonialCard = ({ name, role, text, avatar }: { name: string, role: string, text: string, avatar: string }) => (
    <motion.div
        whileHover={{ y: -3 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/20 transition-all"
    >
        <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            ))}
        </div>
        <p className="text-muted-foreground mb-6 leading-relaxed italic">"{text}"</p>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black font-bold">
                {avatar}
            </div>
            <div>
                <p className="font-semibold text-white text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
            </div>
        </div>
    </motion.div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className="border-b border-white/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-5 flex items-center justify-between text-left hover:text-primary transition-colors"
            >
                <span className="font-medium text-lg">{question}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-5 text-muted-foreground leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const LandingPage: React.FC = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'signup'>('login');
    const [isMuted, setIsMuted] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Sincronizar URL com o estado do modal
    useEffect(() => {
        if (location.pathname === '/signup' || location.pathname === '/cadastro') {
            setInitialAuthMode('signup');
            setShowLogin(true);
        } else if (location.pathname === '/login') {
            setInitialAuthMode('login');
            setShowLogin(true);
        } else {
            setShowLogin(false);
        }
    }, [location.pathname]);

    const handleSignupClick = () => {
        navigate('/signup');
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleCloseModal = () => {
        setShowLogin(false);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-foreground font-body overflow-x-hidden selection:bg-primary/30">

            {/* Background Grid Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            {/* Navbar (Minimalist) */}
            <nav className="fixed top-0 inset-x-0 z-50 h-20 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                            <LandmarkIcon className="w-6 h-6 text-black" />
                        </div>
                        <span className="font-display font-bold text-2xl tracking-tight">Eleva</span>
                    </div>
                    {/* Login CTA only - No Menu */}
                    <button
                        onClick={handleLoginClick}
                        className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                    >
                        Já tenho conta
                    </button>
                </div>
            </nav>

            <main className="relative z-10 pt-20">

                {/* 🔵 HERO SECTION */}
                <section className="pt-24 pb-32 px-6 relative overflow-hidden">
                    {/* Glow Effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-30 -z-10" />

                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="space-y-8"
                        >
                            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-[1.1] tracking-tight">
                                Pare de estudar <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">sem método.</span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                Organize seus estudos em um só lugar com o Eleva. Flashcards inteligentes, quizzes e organização diária para quem estuda sério.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4">
                                <button
                                    onClick={handleSignupClick}
                                    className="group relative px-8 py-4 bg-white text-black text-lg font-bold rounded-full shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)] hover:scale-105 transition-all duration-300 flex items-center gap-3"
                                >
                                    👉 Criar meu plano de estudos grátis
                                    <div className="absolute inset-0 rounded-full border border-black/10" />
                                </button>
                                <p className="text-sm text-muted-foreground/60">Sem cartão. Sem compromisso.</p>

                                {/* Social Proof */}
                                <div className="flex items-center gap-2 mt-4 py-2 px-4 rounded-full bg-white/5 border border-white/10">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-[#0A0A0B] flex items-center justify-center text-[10px] font-bold text-white">M</div>
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-2 border-[#0A0A0B] flex items-center justify-center text-[10px] font-bold text-white">L</div>
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-[#0A0A0B] flex items-center justify-center text-[10px] font-bold text-white">A</div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">+500 estudantes já usam o Eleva</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* 🎥 VÍDEO DEMO */}
                <section className="py-12 px-6">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/20 bg-[#0F0F11]"
                        >
                            {/* Browser Header Mockup */}
                            <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                <div className="ml-4 px-3 py-1 bg-black/50 rounded-md text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                    <LockIcon className="w-3 h-3" />
                                    meueleva.com
                                </div>
                            </div>

                            {/* Video Container */}
                            <div className="relative aspect-video bg-black/50 overflow-hidden group">
                                <video
                                    src="/dashboard-demo.mp4"
                                    autoPlay
                                    loop
                                    muted={isMuted}
                                    playsInline
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                                />

                                {/* Sound Toggle */}
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/70 hover:text-white backdrop-blur-sm transition-all z-20"
                                >
                                    {isMuted ? <VolumeXIcon className="w-5 h-5" /> : <Volume2Icon className="w-5 h-5" />}
                                </button>

                                {/* Overlay Gradient for smoother blend */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-20 pointer-events-none" />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* 🟣 BLOCO DE DOR (Identificação) */}
                <section className="py-24 px-6 bg-gradient-to-b from-transparent to-black/40 border-y border-white/5">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                                Se você estuda, mas sente que não evolui...
                            </h2>
                            <p className="text-muted-foreground">Isso soa familiar?</p>
                        </div>

                        <ul className="space-y-4 max-w-2xl mx-auto mb-12">
                            <PainItem text="Estuda muito e esquece rápido" />
                            <PainItem text="Não sabe o que revisar hoje" />
                            <PainItem text="Perde tempo organizando planilhas" />
                            <PainItem text="Falta constância e motivação" />
                        </ul>

                        <div className="text-center p-8 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/10">
                            <p className="text-2xl font-medium text-white mb-2">O problema não é falta de esforço.</p>
                            <p className="text-xl text-primary font-bold">É falta de método.</p>
                        </div>
                    </div>
                </section>

                {/* 🟢 BLOCO DE SOLUÇÃO (O Eleva) */}
                <section className="py-32 px-6 text-center">
                    <div className="mb-16">
                        <span className="inline-block py-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
                            A SOLUÇÃO
                        </span>
                        <h2 className="text-4xl md:text-5xl font-display font-bold">
                            O Eleva resolve isso pra você
                        </h2>
                    </div>

                    <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-left">
                        <SolutionCard
                            icon={LayoutDashboardIcon}
                            title="Organização automática"
                            description="Tudo em um só lugar. Cronograma, materiais e metas organizados automaticamente, sem bagunça."
                        />
                        <SolutionCard
                            icon={BrainCircuitIcon}
                            title="Revisão inteligente"
                            description="Você revisa apenas o que precisa. Nosso algoritmo garante que você não esqueça o conteúdo."
                        />
                        <SolutionCard
                            icon={BarChart3Icon}
                            title="Progresso visível"
                            description="Saiba exatamente onde está evoluindo com métricas claras de desempenho e constância."
                        />
                    </div>
                </section>

                {/* 🟠 BLOCO DE PROVA */}
                <section className="py-24 px-6 bg-[#0F0F11] border-t border-white/5">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4">
                            <SparklesIcon className="w-6 h-6 text-yellow-500 mr-2" />
                            <span className="text-lg font-medium text-white">Metodologia comprovada</span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                            Feito para quem leva os estudos a sério
                        </h2>

                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            O Eleva foi criado para estudantes e concurseiros que querem
                            <span className="text-white font-semibold"> constância, clareza e evolução real </span>
                            — sem perder tempo com planilhas ou métodos confusos.
                        </p>
                    </div>
                </section>

                {/* 🔵 BLOCO DE CTA FORTE */}
                <section className="py-32 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />

                    <div className="max-w-3xl mx-auto text-center relative z-10 p-12 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm">
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">
                            Comece hoje. É grátis.
                        </h2>

                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={handleSignupClick}
                                className="w-full sm:w-auto px-12 py-5 bg-primary hover:bg-primary-dark text-white text-xl font-bold rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300 active:scale-95"
                            >
                                👉 Criar conta gratuita
                            </button>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <TimerIcon className="w-4 h-4" />
                                Leva menos de 1 minuto
                            </p>
                        </div>
                    </div>
                </section>

                {/* 🔴 BLOCO FINAL (Urgência Suave) */}
                <section className="pb-16 px-6 text-center">
                    <div className="max-w-2xl mx-auto">
                        <p className="text-lg text-muted-foreground mb-6">
                            Quanto mais você adia, mais tempo perde estudando do jeito errado.
                        </p>
                        <button
                            onClick={handleSignupClick}
                            className="text-white hover:text-primary font-medium border-b border-transparent hover:border-primary transition-all pb-0.5"
                        >
                            Comece agora. Criar conta no Eleva →
                        </button>
                    </div>
                </section>

                {/* ⭐ DEPOIMENTOS */}
                <section className="py-24 px-6 bg-gradient-to-b from-transparent to-black/20">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="inline-block py-1 px-3 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-bold mb-6">
                                DEPOIMENTOS
                            </span>
                            <h2 className="text-3xl md:text-4xl font-display font-bold">
                                O que dizem sobre o Eleva
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <TestimonialCard
                                name="Mariana S."
                                role="Aprovada no TRF3"
                                text="Finalmente parei de esquecer o que estudava. O sistema de revisão do Eleva mudou minha rotina completamente."
                                avatar="M"
                            />
                            <TestimonialCard
                                name="Lucas P."
                                role="Estudante de Medicina"
                                text="Uso os flashcards todo dia. Em 3 meses, minha retenção de conteúdo aumentou absurdamente. Recomendo demais!"
                                avatar="L"
                            />
                            <TestimonialCard
                                name="Ana C."
                                role="Concurseira - Área Fiscal"
                                text="O dashboard me mostra exatamente onde preciso focar. Parei de perder tempo estudando o que já sei."
                                avatar="A"
                            />
                        </div>
                    </div>
                </section>

                {/* ❓ FAQ */}
                <section className="py-24 px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-display font-bold">
                                Perguntas Frequentes
                            </h2>
                        </div>

                        <div className="space-y-2">
                            <FAQItem
                                question="É realmente grátis?"
                                answer="Sim! O plano gratuito inclui acesso ao dashboard, flashcards manuais, e organização básica. Você pode usar sem pagar nada e fazer upgrade quando quiser mais recursos."
                            />
                            <FAQItem
                                question="Funciona para qual tipo de estudo?"
                                answer="O Eleva foi feito para concurseiros, estudantes de medicina, direito, e qualquer pessoa que precisa memorizar grandes volumes de conteúdo. Funciona para qualquer área!"
                            />
                            <FAQItem
                                question="Posso cancelar a qualquer momento?"
                                answer="Com certeza! Não há fidelidade ou multa. Você pode cancelar seu plano Pro ou Premium quando quiser, sem burocracia."
                            />
                            <FAQItem
                                question="Como funciona o sistema de revisão?"
                                answer="Usamos repetição espaçada (spaced repetition), o mesmo método usado por poliglotas e aprovados em concursos difíceis. O sistema calcula automaticamente quando você deve revisar cada conteúdo."
                            />
                            <FAQItem
                                question="Meus dados estão seguros?"
                                answer="Sim! Usamos criptografia de ponta a ponta e seus dados ficam armazenados em servidores seguros. Nunca compartilhamos suas informações com terceiros."
                            />
                        </div>
                    </div>
                </section>

                {/* 🦶 FOOTER */}
                <footer className="py-12 px-6 border-t border-white/5 bg-[#0A0A0B]">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <LandmarkIcon className="w-4 h-4 text-black" />
                                </div>
                                <span className="font-display font-bold text-lg">Eleva</span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                                <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                                <a href="mailto:suporte@meueleva.com" className="hover:text-white transition-colors flex items-center gap-1">
                                    <MailIcon className="w-4 h-4" />
                                    suporte@meueleva.com
                                </a>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5 text-center text-xs text-muted-foreground">
                            © {new Date().getFullYear()} Eleva. Todos os direitos reservados.
                        </div>
                    </div>
                </footer>

                {/* Login Modal Overlay */}
                <AnimatePresence>
                    {showLogin && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleCloseModal}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative z-10 w-full max-w-md"
                            >
                                <button
                                    onClick={handleCloseModal}
                                    className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"
                                >
                                    <XIcon className="w-6 h-6" />
                                </button>
                                <LoginPage initialAuthMode={initialAuthMode} />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default LandingPage;
