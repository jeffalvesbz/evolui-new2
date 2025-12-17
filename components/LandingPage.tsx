import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginPage } from './LoginPage';
import {
    CheckCircle2Icon,
    BookOpenIcon,
    TrophyIcon,
    ClockIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    SparklesIcon,
    UsersIcon,
    ArrowRightIcon,
    LandmarkIcon,
    XIcon,
    TrendingUpIcon,
    TargetIcon,
    CalendarIcon,
    BrainCircuitIcon,
    BarChart3Icon,
    ShieldCheckIcon,
    ZapIcon,
    StarIcon,
    XCircleIcon
} from './icons';
import { plans, Plan } from '../src/config/plans';

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

const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

// --- Data ---
const features = [
    {
        icon: CalendarIcon,
        title: 'Planejamento inteligente',
        description: 'Monte seu plano de estudos em minutos, com base em disciplinas, metas e tempo disponível.',
        color: 'from-violet-500 to-purple-600',
        size: 'large'
    },
    {
        icon: ClockIcon,
        title: 'Cronômetro e foco',
        description: 'Cronometre seus estudos, mantenha o foco e registre o tempo real dedicado a cada matéria.',
        color: 'from-pink-500 to-rose-600',
        size: 'small'
    },
    {
        icon: BookOpenIcon,
        title: 'Flashcards inteligentes',
        description: 'Use repetição espaçada para memorizar melhor e revisar no momento certo.',
        color: 'from-cyan-500 to-blue-600',
        size: 'small'
    },
    {
        icon: BrainCircuitIcon,
        title: 'Revisões automáticas',
        description: 'Nunca mais esqueça o que estudou. O ELEVA agenda revisões de forma estratégica.',
        color: 'from-emerald-500 to-green-600',
        size: 'small'
    },
    {
        icon: BarChart3Icon,
        title: 'Dashboard de progresso',
        description: 'Veja sua evolução com métricas reais: constância, desempenho e histórico.',
        color: 'from-amber-500 to-orange-600',
        size: 'small'
    },
    {
        icon: TrendingUpIcon,
        title: 'Trilha semanal organizada',
        description: 'Saiba exatamente o que estudar em cada dia da semana, sem perder tempo decidindo.',
        color: 'from-indigo-500 to-blue-600',
        size: 'large'
    },
    {
        icon: TrophyIcon,
        title: 'Gamificação e motivação',
        description: 'Ganhe XP, mantenha streaks e acompanhe sua evolução de forma visual e motivadora.',
        color: 'from-yellow-400 to-orange-500',
        size: 'small'
    }
];

const faqs = [
    {
        question: 'O ELEVA serve para qualquer concurso?',
        answer: 'Sim. Você adapta o plano à sua realidade e ao edital que estiver estudando.'
    },
    {
        question: 'Preciso estudar muitas horas por dia?',
        answer: 'Não. O foco é constância e eficiência, não quantidade.'
    },
    {
        question: 'Funciona no celular e no computador?',
        answer: 'Sim. O ELEVA é pensado para uso diário, em qualquer dispositivo.'
    },
    {
        question: 'É melhor que planilhas?',
        answer: 'Planilhas não pensam por você. O ELEVA sim.'
    }
];

const testimonials = [
    {
        name: "Maria S.",
        role: "Concurseira - TRF",
        text: "A correção de redação IA é incrível! Me ajudou muito a melhorar.",
        rating: 5
    },
    {
        name: "João P.",
        role: "Aprovado - PRF",
        text: "O sistema de ciclos mudou completamente minha forma de estudar.",
        rating: 5
    },
    {
        name: "Ana L.",
        role: "Estudante - PF",
        text: "Vale cada centavo! Recursos essenciais para quem estuda sério.",
        rating: 5
    }
];

const galleryImages = [
    { src: "/app-shot-1.png", alt: "Dashboard Geral", title: "Dashboard Completo" },
    { src: "/app-shot-3.png", alt: "Ciclos de Estudo", title: "Ciclos de Estudo" },
    { src: "/app-shot-4.png", alt: "Corretor de Redação", title: "Corretor IA Detalhado" },
    { src: "/app-shot-5.png", alt: "Flashcards Pergunta", title: "Flashcards (Frente)" },
    { src: "/app-shot-6.png", alt: "Flashcards Resposta", title: "Flashcards (Verso)" },
    { src: "/app-shot-7.png", alt: "Quizzes Gerados", title: "Quizzes Ilimitados" },
];

const Carousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    return (
        <div className="relative max-w-5xl mx-auto px-4 mt-12">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 aspect-video bg-black/50 shadow-2xl">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                    >
                        <img
                            src={galleryImages[currentIndex].src}
                            alt={galleryImages[currentIndex].alt}
                            className="w-full h-full object-contain p-2"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-12">
                            <h3 className="text-xl md:text-2xl font-bold text-white text-center">{galleryImages[currentIndex].title}</h3>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-primary/90 border border-white/10 text-white transition-all z-10 backdrop-blur-sm -translate-x-1/2 md:-translate-x-0 group"
                aria-label="Anterior"
            >
                <ChevronDownIcon className="w-6 h-6 rotate-90 text-white group-hover:scale-110 transition-transform" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-primary/90 border border-white/10 text-white transition-all z-10 backdrop-blur-sm translate-x-1/2 md:translate-x-0 group"
                aria-label="Próximo"
            >
                <ChevronDownIcon className="w-6 h-6 -rotate-90 text-white group-hover:scale-110 transition-transform" />
            </button>

            <div className="flex justify-center gap-2 mt-6">
                {galleryImages.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all duration-300 rounded-full h-2 ${idx === currentIndex ? 'bg-primary w-8' : 'bg-white/20 w-2 hover:bg-white/40'}`}
                        aria-label={`Ir para imagem ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};


// --- Sub-Components ---

const MockDashboard = () => (
    <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative w-full max-w-[800px] mx-auto lg:mr-0 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-10"
        style={{ perspective: '1000px' }}
    >
        <video
            src="/dashboard-demo.mp4"
            loop
            playsInline
            controls
            poster="/app-shot-1.png"
            className="w-full h-auto object-cover"
        />

        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 to-secondary/10 blur-[60px] -z-10 pointer-events-none" />
    </motion.div>
);

const FeatureCard = ({ feature }: { feature: typeof features[0] }) => (
    <motion.div
        variants={scaleIn}
        className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors ${feature.size === 'large' ? 'md:col-span-2' : ''}`}
    >
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <feature.icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold font-display mb-2 text-foreground">{feature.title}</h3>
        <p className="text-muted-foreground">{feature.description}</p>

        {/* Hover Glow */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-white/5 to-white/0 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
    </motion.div>
);

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-white/10 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-4 flex items-center justify-between text-left hover:text-primary transition-colors"
            >
                <span className="font-medium text-lg">{question}</span>
                {isOpen ? <ChevronUpIcon className="w-5 h-5 text-muted-foreground" /> : <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-4 text-muted-foreground leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main Page ---

export const LandingPage: React.FC = () => {
    const [showLogin, setShowLogin] = useState(false);

    const handleCTAClick = () => setShowLogin(true);

    return (
        <div className="min-h-screen bg-background text-foreground font-body overflow-x-hidden selection:bg-primary/30">

            {/* Background Grid Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 h-16 border-b border-white/10 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <LandmarkIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight">Eleva</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleCTAClick} className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
                            Entrar
                        </button>
                        <button onClick={handleCTAClick} className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                            Começar Agora
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="text-center lg:text-left space-y-6"
                        >
                            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                                <SparklesIcon className="w-3 h-3" />
                                Estude com método
                            </motion.div>

                            <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-[1.1]">
                                Eleve seu estudo. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Eleve seus resultados.</span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                Pare de estudar no escuro. O ELEVA transforma estudo desorganizado em um plano inteligente, mensurável e eficiente.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <button onClick={handleCTAClick} className="btn-gradient px-8 py-3.5 text-lg rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                                    Comece agora gratuitamente
                                    <ArrowRightIcon className="w-5 h-5" />
                                </button>
                            </motion.div>

                        </motion.div>

                        {/* Hero Image / Mock Interface */}
                        <MockDashboard />
                    </div>
                </section>

                {/* Problem Section */}
                <section className="py-20 px-4 bg-white/5 border-y border-white/5">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-10">
                            <span className="text-red-500">❌</span> O problema não é falta de esforço. <br /> É falta de método.
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8 text-left">
                            <div className="space-y-4">
                                <p className="text-lg text-muted-foreground mb-4">Se você estuda ou já estudou para provas, provavelmente se identifica:</p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <XCircleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                        <span>Estuda muito, mas sente que não evolui</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <XCircleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                        <span>Não sabe exatamente o que estudar hoje</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <XCircleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                        <span>Se perde entre PDFs, vídeos, anotações e editais</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <p className="text-lg text-muted-foreground mb-4 opacity-0 lg:opacity-100">...</p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <XCircleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                        <span>Falta constância e motivação</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <XCircleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                        <span>Não consegue medir se está no caminho certo</span>
                                    </li>
                                </ul>
                                <div className="mt-8 p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                                    <p className="text-white font-medium">O resultado? Cansaço, frustração e a sensação de tempo perdido.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Solution Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                            <span className="text-emerald-500">✅</span> A solução: estudar com estratégia, não com improviso.
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            O ELEVA organiza seu estudo em um sistema inteligente que mostra <strong>o que estudar</strong>, <strong>quando estudar</strong>, <strong>quanto tempo estudar</strong> e <strong>como revisar</strong>.
                        </p>
                    </div>
                </section>


                {/* Features Grid ("Bento" Style) */}
                <section className="py-10 px-4 bg-gradient-to-b from-transparent to-background-dark/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">🚀 O que o <span className="text-primary">ELEVA</span> faz por você</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24 items-center">
                            <div className="order-2 lg:order-1 relative group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <img
                                    src="/app-shot-5.png"
                                    alt="Flashcards Mobile Interface"
                                    className="relative rounded-3xl border border-white/10 shadow-2xl mx-auto max-w-[300px] md:max-w-xs hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="order-1 lg:order-2 space-y-6">
                                <h3 className="text-3xl font-bold font-display">Estude em qualquer lugar</h3>
                                <p className="text-lg text-muted-foreground">
                                    Com o nosso sistema de flashcards mobile-first, você transforma qualquer tempo morto em aprendizado ativo.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                            <ZapIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Memorização acelerada</p>
                                            <p className="text-sm text-muted-foreground">Algoritmos que priorizam o que você erra.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                                            <BookOpenIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Revisão espaçada</p>
                                            <p className="text-sm text-muted-foreground">Nunca mais esqueça o que estudou ontem.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {features.map((feature, idx) => (
                                <FeatureCard key={idx} feature={feature} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Differentiation Section */}
                <section className="py-24 px-4 bg-white/[0.02]">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">💡 Por que o ELEVA é diferente?</h2>
                            <p className="text-lg text-muted-foreground mb-8">O ELEVA não é só mais um app de organização.</p>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-red-400">
                                    <XIcon className="w-5 h-5" /> Não é lista de tarefas
                                </li>
                                <li className="flex items-center gap-3 text-red-400">
                                    <XIcon className="w-5 h-5" /> Não é agenda genérica
                                </li>
                                <li className="flex items-center gap-3 text-red-400">
                                    <XIcon className="w-5 h-5" /> Não é planilha improvisada
                                </li>
                            </ul>

                            <p className="text-xl font-medium text-white p-6 bg-primary/10 rounded-2xl border border-primary/20">
                                Ele é um sistema de estudos baseado em método, pensado para quem precisa de resultado, não de mais conteúdo.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold mb-4">🎯 Para quem é o ELEVA</h3>
                            <ul className="space-y-3">
                                {[
                                    'Concurseiros (PF, PC, TCU, tribunais, fiscais, etc.)',
                                    'Estudantes universitários',
                                    'Quem estuda por conta própria',
                                    'Quem trabalha e tem pouco tempo',
                                    'Quem quer estudar com constância e estratégia'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <CheckCircle2Icon className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-8 border-t border-white/10 mt-8">
                                <h3 className="text-xl font-bold mb-4 text-red-400">❌ Para quem não é</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <XIcon className="w-5 h-5 text-red-500" /> Quem busca “atalhos milagrosos”
                                    </li>
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <XIcon className="w-5 h-5 text-red-500" /> Quem não quer se comprometer com constância
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Founder Section */}
                <section className="py-20 px-4 text-center">
                    <div className="max-w-3xl mx-auto bg-stone-900/50 p-10 rounded-3xl border border-white/5">
                        <h3 className="text-2xl font-bold mb-4">💬 Criado por quem estuda de verdade</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            O ELEVA foi criado por quem conhece na prática a pressão dos concursos, a falta de tempo e a necessidade de estudar com método. <br />
                            <span className="text-white font-medium mt-2 block">Ele nasce da realidade, não da teoria.</span>
                        </p>
                    </div>
                </section>

                {/* Gallery Section */}
                <section className="py-24 px-4 bg-white/[0.02] border-y border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Por dentro do ELEVA</h2>
                            <p className="text-muted-foreground">Interface moderna, intuitiva e focada no seu desempenho.</p>
                        </div>

                        <Carousel />
                    </div>
                </section>

                {/* Pricing Plans */}
                <section className="py-24 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Planos</h2>
                            <p className="text-muted-foreground">Escolha o seu nível de comprometimento.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {/* Free */}
                            <div className="rounded-3xl p-8 border border-white/10 bg-card hover:border-primary/30 transition-colors">
                                <div className="mb-6">
                                    <div className="font-semibold text-lg mb-2">Plano Gratuito</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">R$ 0</span>
                                        <span className="text-muted-foreground">/mês</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">Ideal para começar.</p>
                                </div>
                                <button onClick={handleCTAClick} className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 font-semibold transition-colors mb-6">
                                    Começar gratuitamente
                                </button>
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    {['Planejamento básico', 'Cronômetro', 'Organização inicial'].map(i => (
                                        <li key={i} className="flex gap-2"><CheckCircle2Icon className="w-4 h-4 text-emerald-500" /> {i}</li>
                                    ))}
                                </ul>
                            </div>

                            {plans.map((plan) => (
                                <div key={plan.name} className={`rounded-3xl p-8 border ${plan.isPremium ? 'border-primary/50 bg-primary/5 relative shadow-2xl shadow-primary/20' : 'border-white/10 bg-card'} hover:border-primary/30 transition-colors`}>
                                    {plan.tag && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
                                            {plan.tag}
                                        </div>
                                    )}
                                    <div className="mb-6">
                                        <div className={`font-semibold text-lg mb-2 ${plan.isPremium ? 'text-primary' : ''}`}>{plan.name}</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold">R$ {plan.monthlyPrice.toString().replace('.', ',')}</span>
                                            <span className="text-muted-foreground">/mês</span>
                                        </div>
                                        {plan.yearlyPrice && (
                                            <div className="text-xs text-emerald-400 mt-1">
                                                Economize R$ {(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(2).replace('.', ',')}/ano
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={handleCTAClick} className={`w-full py-3 rounded-xl font-semibold transition-colors mb-6 ${plan.ctaStyle === 'solid' ? 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25' : 'border border-primary/50 text-primary hover:bg-primary/10'}`}>
                                        {plan.cta}
                                    </button>
                                    <ul className="space-y-3 text-sm text-muted-foreground">
                                        {plan.features.map(i => (
                                            <li key={i} className="flex gap-2"><CheckCircle2Icon className={`w-4 h-4 ${plan.isPremium ? 'text-primary' : 'text-emerald-500'}`} /> {i}</li>
                                        ))}
                                    </ul>
                                    {plan.isPremium && (
                                        <div className="mt-6 pt-6 border-t border-white/10 text-center">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Sem risco</p>
                                            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                                                <span>✓ Cancele quando quiser</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-24 px-4 bg-white/[0.02]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                                O que dizem nossos <span className="text-primary">estudantes</span>
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {testimonials.map((t, idx) => (
                                <div key={idx} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <StarIcon key={i} className="w-5 h-5 text-primary fill-primary" />
                                        ))}
                                    </div>
                                    <p className="text-lg italic text-muted-foreground mb-6">"{t.text}"</p>
                                    <div>
                                        <div className="font-bold text-white">{t.name}</div>
                                        <div className="text-sm text-muted-foreground">{t.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-24 px-4 bg-white/[0.02]">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-3xl font-display font-bold mb-8 text-center">Perguntas Frequentes (FAQ)</h2>
                        <div className="space-y-2">
                            {faqs.map((faq, idx) => (
                                <FAQItem key={idx} {...faq} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 px-4 text-center">
                    <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 rounded-3xl p-12 border border-white/10 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-display font-bold mb-6">Chega de estudar sem saber se está no caminho certo.</h2>
                            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                                O ELEVA mostra o caminho. <br />
                                Você só precisa caminhar.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={handleCTAClick} className="btn-gradient px-10 py-4 text-lg rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                    Começar agora gratuitamente
                                </button>
                                <button onClick={handleCTAClick} className="px-10 py-4 text-lg rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium">
                                    Elevar meus resultados
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 px-4 border-t border-white/10 bg-background text-sm">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                                    <LandmarkIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="font-bold font-display text-lg">Eleva</span>
                            </div>
                            <p className="text-muted-foreground">Estude com método. Evolua de verdade.</p>
                        </div>
                    </div>
                    <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-center text-muted-foreground">
                        &copy; 2024 Eleva Tecnologia. Todos os direitos reservados.
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
                                onClick={() => setShowLogin(false)}
                                className="absolute inset-0 bg-background/90 backdrop-blur-md"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative z-10 w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setShowLogin(false)}
                                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-20"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                                <LoginPage />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default LandingPage;
