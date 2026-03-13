import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { PricingSection } from './PricingSection';
import {
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
    MailIcon,
    BrainCircuitIcon,
    BarChart3Icon,
} from './icons';

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }
    })
};

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// ─── Marquee strip ───────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
    'ENEM', 'VESTIBULAR', 'OAB', 'MEDICINA', 'FUVEST', 'CONCURSOS FEDERAIS',
    'SPACED REPETITION', 'FLASHCARDS IA', 'CICLOS DE ESTUDOS', 'RETENÇÃO',
    'REDAÇÃO', 'SIMULADOS', 'REVISÃO INTELIGENTE', 'PROGRESSÃO REAL',
];

const MarqueeStrip: React.FC = () => {
    const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
    return (
        <div className="marquee-wrapper border-y border-amber-500/10 bg-amber-500/[0.03] py-3">
            <div className="marquee-track">
                {items.map((item, i) => (
                    <span key={i} className="flex items-center gap-5 px-5">
                        <span
                            className="text-[11px] font-mono tracking-widest uppercase whitespace-nowrap"
                            style={{ color: i % 3 === 0 ? '#F59E0B' : 'rgba(253,248,238,0.35)' }}
                        >
                            {item}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-amber-500/20 shrink-0" />
                    </span>
                ))}
            </div>
        </div>
    );
};

// ─── Animated counter ───────────────────────────────────────────────────────

const CountUp: React.FC<{ to: number; suffix?: string }> = ({ to, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const duration = 1400;
        const step = 16;
        const steps = Math.floor(duration / step);
        const increment = to / steps;
        const timer = setInterval(() => {
            start += increment;
            if (start >= to) { setCount(to); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, step);
        return () => clearInterval(timer);
    }, [inView, to]);

    return <span ref={ref}>{count}{suffix}</span>;
};

// ─── Pain item ───────────────────────────────────────────────────────────────

const PainItem: React.FC<{ text: string; index: number }> = ({ text, index }) => (
    <motion.li
        variants={fadeUp}
        custom={index * 0.06}
        className="flex items-start gap-5 group"
    >
        <span
            className="font-mono text-xs tabular-nums shrink-0 mt-[3px] w-6 text-right opacity-40"
            style={{ color: '#F59E0B' }}
        >
            0{index + 1}
        </span>
        <div className="flex-1 flex items-start gap-3 pb-5 border-b border-white/[0.06]">
            <XCircleIcon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
            <span className="text-base leading-snug" style={{ color: 'rgba(253,248,238,0.75)' }}>
                {text}
            </span>
        </div>
    </motion.li>
);

// ─── Solution card ───────────────────────────────────────────────────────────

const SolutionCard: React.FC<{
    icon: React.FC<{ className?: string }>;
    title: string;
    description: string;
    accent?: string;
    delay?: number;
}> = ({ icon: Icon, title, description, accent = '#F59E0B', delay = 0 }) => (
    <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={fadeUp}
        custom={delay}
        whileHover={{ y: -4 }}
        className="relative p-7 rounded-2xl flex flex-col gap-5 overflow-hidden transition-all duration-300"
        style={{
            background: 'rgba(22,18,8,0.7)',
            border: '1px solid rgba(245,158,11,0.10)',
        }}
    >
        {/* accent top bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl" style={{ background: accent }} />

        <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
            <Icon className="w-6 h-6" style={{ color: accent } as any} />
        </div>
        <div>
            <h3
                className="text-xl font-display font-semibold mb-2 leading-snug"
                style={{ color: '#FDF8EE' }}
            >
                {title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#A09070' }}>
                {description}
            </p>
        </div>
    </motion.div>
);

// ─── Testimonial card ────────────────────────────────────────────────────────

const TestimonialCard: React.FC<{
    name: string;
    role: string;
    text: string;
    avatar: string;
    delay?: number;
}> = ({ name, role, text, avatar, delay = 0 }) => (
    <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={fadeUp}
        custom={delay}
        className="relative p-7 rounded-2xl flex flex-col gap-5"
        style={{
            background: 'rgba(22,18,8,0.6)',
            border: '1px solid rgba(245,158,11,0.10)',
        }}
    >
        {/* Giant quotation mark */}
        <span
            className="absolute top-3 right-5 font-display text-7xl leading-none select-none pointer-events-none"
            style={{ color: 'rgba(245,158,11,0.12)' }}
        >
            "
        </span>

        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-3.5 h-3.5" style={{ color: '#F59E0B', fill: '#F59E0B' } as any} />
            ))}
        </div>

        <p
            className="text-sm leading-relaxed relative z-10 italic"
            style={{ color: 'rgba(253,248,238,0.80)' }}
        >
            "{text}"
        </p>

        <div className="flex items-center gap-3 mt-auto">
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                    background: 'linear-gradient(135deg, #F59E0B, #4ADE80)',
                    color: '#0C0A06',
                }}
            >
                {avatar}
            </div>
            <div>
                <p className="text-sm font-semibold" style={{ color: '#FDF8EE' }}>{name}</p>
                <p className="text-xs" style={{ color: '#A09070' }}>{role}</p>
            </div>
        </div>
    </motion.div>
);

// ─── FAQ item ────────────────────────────────────────────────────────────────

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div
            className="border-b transition-colors duration-200"
            style={{ borderColor: 'rgba(245,158,11,0.10)' }}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-5 flex items-center justify-between text-left gap-4 transition-colors duration-200"
                style={{ color: isOpen ? '#F59E0B' : '#FDF8EE' }}
            >
                <span className="font-medium text-base leading-snug">{question}</span>
                <ChevronDownIcon
                    className="w-4 h-4 shrink-0 transition-transform duration-300"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        color: '#F59E0B',
                    }}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <p
                            className="pb-5 text-sm leading-relaxed"
                            style={{ color: '#A09070' }}
                        >
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const LandingPage: React.FC = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'signup'>('login');
    const [isMuted, setIsMuted] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

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

    const handleSignupClick = () => navigate('/signup');
    const handleLoginClick = () => navigate('/login');
    const handleCloseModal = () => { setShowLogin(false); navigate('/'); };

    return (
        <div
            className="min-h-screen text-foreground overflow-x-hidden"
            style={{
                background: '#0C0A06',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
        >
            {/* Film grain overlay */}
            <div className="grain-overlay" />

            {/* ── NAVBAR ─────────────────────────────────────────────── */}
            <nav
                className="fixed top-0 inset-x-0 z-50 h-[68px] flex items-center"
                style={{
                    background: 'rgba(12,10,6,0.85)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(245,158,11,0.08)',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #F59E0B, #4ADE80)',
                                boxShadow: '0 0 16px rgba(245,158,11,0.25)',
                            }}
                        >
                            <LandmarkIcon className="w-5 h-5" style={{ color: '#0C0A06' }} />
                        </div>
                        <span
                            className="font-display font-bold text-xl tracking-tight"
                            style={{ color: '#FDF8EE' }}
                        >
                            Eleva
                        </span>
                    </div>

                    <button
                        onClick={handleLoginClick}
                        className="text-sm font-medium transition-colors duration-200"
                        style={{ color: '#A09070' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#FDF8EE')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#A09070')}
                    >
                        Já tenho conta
                    </button>
                </div>
            </nav>

            <main className="relative z-10">

                {/* ── HERO ───────────────────────────────────────────── */}
                <section className="relative pt-[68px] min-h-screen flex flex-col justify-center overflow-hidden">

                    {/* Amber radial glow */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            top: '-10%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '900px',
                            height: '600px',
                            background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.18) 0%, transparent 65%)',
                            zIndex: 0,
                        }}
                    />

                    {/* Giant watermark "ELEVA" */}
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                        style={{ zIndex: 0 }}
                        aria-hidden
                    >
                        <span
                            className="font-display font-bold"
                            style={{
                                fontSize: 'clamp(100px, 22vw, 280px)',
                                color: 'transparent',
                                WebkitTextStroke: '1px rgba(245,158,11,0.06)',
                                letterSpacing: '0.12em',
                                lineHeight: 1,
                                userSelect: 'none',
                            }}
                        >
                            ELEVA
                        </span>
                    </div>

                    <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={stagger}
                            className="space-y-8"
                        >
                            {/* Overline pill */}
                            <motion.div variants={fadeUp} custom={0}>
                                <span
                                    className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-full"
                                    style={{
                                        background: 'rgba(245,158,11,0.10)',
                                        border: '1px solid rgba(245,158,11,0.25)',
                                        color: '#F59E0B',
                                    }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                    Plataforma de estudos inteligente
                                </span>
                            </motion.div>

                            {/* Main headline */}
                            <motion.h1
                                variants={fadeUp}
                                custom={0.1}
                                className="font-display leading-[1.05] tracking-tight"
                                style={{
                                    fontSize: 'clamp(44px, 8.5vw, 96px)',
                                    color: '#FDF8EE',
                                }}
                            >
                                Pare de estudar<br />
                                <span style={{ color: '#F59E0B' }} className="text-amber-glow italic">
                                    sem método.
                                </span>
                            </motion.h1>

                            {/* Subtext */}
                            <motion.p
                                variants={fadeUp}
                                custom={0.2}
                                className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
                                style={{ color: '#A09070', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                                Organize seus estudos em um só lugar — flashcards inteligentes, ciclos de revisão e métricas reais para quem leva o aprendizado a sério.
                            </motion.p>

                            {/* CTA */}
                            <motion.div
                                variants={fadeUp}
                                custom={0.3}
                                className="flex flex-col items-center gap-4"
                            >
                                <button
                                    onClick={handleSignupClick}
                                    className="group relative flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold transition-all duration-300"
                                    style={{
                                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                        color: '#0C0A06',
                                        boxShadow: '0 0 0 0 rgba(245,158,11,0.4)',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(245,158,11,0.40), 0 4px 20px rgba(245,158,11,0.30)';
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.02)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 0 rgba(245,158,11,0.4)';
                                        (e.currentTarget as HTMLButtonElement).style.transform = '';
                                    }}
                                >
                                    Criar meu plano de estudos grátis
                                    <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </button>
                                <p
                                    className="text-xs font-mono"
                                    style={{ color: 'rgba(160,144,112,0.6)' }}
                                >
                                    Sem cartão. Sem compromisso.
                                </p>

                                {/* Social proof */}
                                <div
                                    className="flex items-center gap-2.5 py-2 px-4 rounded-full"
                                    style={{
                                        background: 'rgba(22,18,8,0.8)',
                                        border: '1px solid rgba(245,158,11,0.12)',
                                    }}
                                >
                                    <div className="flex -space-x-1.5">
                                        {[
                                            ['M', 'linear-gradient(135deg,#3B82F6,#2563EB)'],
                                            ['L', 'linear-gradient(135deg,#4ADE80,#16A34A)'],
                                            ['A', 'linear-gradient(135deg,#F59E0B,#D97706)'],
                                        ].map(([letter, bg], i) => (
                                            <div
                                                key={i}
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                                                style={{
                                                    background: bg,
                                                    color: '#0C0A06',
                                                    border: '2px solid #0C0A06',
                                                }}
                                            >
                                                {letter}
                                            </div>
                                        ))}
                                    </div>
                                    <span
                                        className="text-xs"
                                        style={{ color: '#A09070' }}
                                    >
                                        +500 estudantes já usam o Eleva
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* ── MARQUEE ──────────────────────────────────────────── */}
                <MarqueeStrip />

                {/* ── DEMO VIDEO ───────────────────────────────────────── */}
                <section className="py-16 px-6">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="relative rounded-2xl overflow-hidden"
                            style={{
                                border: '1px solid rgba(245,158,11,0.15)',
                                boxShadow: '0 0 80px rgba(245,158,11,0.08), 0 30px 60px rgba(0,0,0,0.5)',
                                background: '#0F0C06',
                            }}
                        >
                            {/* Browser chrome */}
                            <div
                                className="h-10 flex items-center px-4 gap-2"
                                style={{
                                    background: 'rgba(245,158,11,0.04)',
                                    borderBottom: '1px solid rgba(245,158,11,0.08)',
                                }}
                            >
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                <div
                                    className="ml-4 px-3 py-1 rounded-md text-[10px] font-mono flex items-center gap-1.5"
                                    style={{
                                        background: 'rgba(245,158,11,0.06)',
                                        color: '#A09070',
                                    }}
                                >
                                    <LockIcon className="w-2.5 h-2.5" />
                                    meueleva.com
                                </div>
                            </div>

                            {/* Video */}
                            <div className="relative aspect-video overflow-hidden group">
                                <video
                                    src="/dashboard-demo.mp4"
                                    autoPlay
                                    loop
                                    muted={isMuted}
                                    playsInline
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                                />
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="absolute bottom-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all z-20"
                                    style={{
                                        background: 'rgba(12,10,6,0.7)',
                                        border: '1px solid rgba(245,158,11,0.20)',
                                        color: 'rgba(253,248,238,0.7)',
                                    }}
                                >
                                    {isMuted ? <VolumeXIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
                                </button>
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ background: 'linear-gradient(to top, rgba(12,10,6,0.4) 0%, transparent 30%)' }}
                                />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ── STATS BAR ────────────────────────────────────────── */}
                <section className="py-12 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div
                            className="grid grid-cols-3 divide-x rounded-2xl overflow-hidden"
                            style={{
                                background: 'rgba(22,18,8,0.6)',
                                border: '1px solid rgba(245,158,11,0.10)',
                                divideColor: 'rgba(245,158,11,0.10)',
                            }}
                        >
                            {[
                                { value: 500, suffix: '+', label: 'Estudantes ativos' },
                                { value: 20, suffix: '+', label: 'Matérias disponíveis' },
                                { value: 98, suffix: '%', label: 'Taxa de satisfação' },
                            ].map(({ value, suffix, label }, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center justify-center py-8 px-4 gap-1"
                                    style={{ borderColor: 'rgba(245,158,11,0.10)' }}
                                >
                                    <span
                                        className="font-mono text-3xl sm:text-4xl font-semibold"
                                        style={{ color: '#F59E0B' }}
                                    >
                                        <CountUp to={value} suffix={suffix} />
                                    </span>
                                    <span
                                        className="text-xs text-center leading-snug"
                                        style={{ color: '#A09070' }}
                                    >
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── PAIN SECTION ─────────────────────────────────────── */}
                <section
                    className="py-24 px-6"
                    style={{ borderTop: '1px solid rgba(245,158,11,0.06)' }}
                >
                    <div className="max-w-3xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="mb-14"
                        >
                            <p
                                className="font-mono text-xs uppercase tracking-widest mb-4"
                                style={{ color: '#F59E0B' }}
                            >
                                O problema
                            </p>
                            <h2
                                className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight"
                                style={{ color: '#FDF8EE' }}
                            >
                                Esse cenário é familiar?
                            </h2>
                        </motion.div>

                        {/* Pain list */}
                        <motion.ul
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={stagger}
                            className="space-y-0 mb-14"
                        >
                            <PainItem text="Estuda muito e esquece o conteúdo em dias" index={0} />
                            <PainItem text="Não sabe exatamente o que revisar hoje" index={1} />
                            <PainItem text="Perde horas organizando planilhas que não funcionam" index={2} />
                            <PainItem text="Falta constância e sente que não está evoluindo" index={3} />
                        </motion.ul>

                        {/* Callout */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="p-8 rounded-2xl text-center"
                            style={{
                                background: 'rgba(22,18,8,0.8)',
                                border: '1px solid rgba(245,158,11,0.15)',
                            }}
                        >
                            <p
                                className="font-display text-2xl sm:text-3xl font-semibold mb-2"
                                style={{ color: '#FDF8EE' }}
                            >
                                O problema não é falta de esforço.
                            </p>
                            <p
                                className="font-display text-2xl sm:text-3xl font-bold"
                                style={{ color: '#F59E0B' }}
                            >
                                É falta de método.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* ── SOLUTION SECTION ─────────────────────────────────── */}
                <section
                    className="py-24 px-6"
                    style={{ borderTop: '1px solid rgba(245,158,11,0.06)' }}
                >
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="text-center mb-16"
                        >
                            <p
                                className="font-mono text-xs uppercase tracking-widest mb-4"
                                style={{ color: '#4ADE80' }}
                            >
                                A solução
                            </p>
                            <h2
                                className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold"
                                style={{ color: '#FDF8EE' }}
                            >
                                O Eleva resolve isso pra você
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-5">
                            <SolutionCard
                                icon={LayoutDashboardIcon}
                                title="Organização automática"
                                description="Cronograma, materiais e metas organizados automaticamente. Sem planilhas, sem bagunça."
                                accent="#F59E0B"
                                delay={0}
                            />
                            <SolutionCard
                                icon={BrainCircuitIcon}
                                title="Revisão inteligente"
                                description="Algoritmo de repetição espaçada decide o que revisar. Você só estuda o que precisa."
                                accent="#4ADE80"
                                delay={0.08}
                            />
                            <SolutionCard
                                icon={BarChart3Icon}
                                title="Progresso visível"
                                description="Métricas reais de desempenho e constância. Saiba exatamente onde você está evoluindo."
                                accent="#F59E0B"
                                delay={0.16}
                            />
                        </div>
                    </div>
                </section>

                {/* ── PROOF BANNER ─────────────────────────────────────── */}
                <section
                    className="py-20 px-6"
                    style={{
                        background: 'rgba(22,18,8,0.5)',
                        borderTop: '1px solid rgba(245,158,11,0.08)',
                        borderBottom: '1px solid rgba(245,158,11,0.08)',
                    }}
                >
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="space-y-5"
                        >
                            <div
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                                style={{
                                    background: 'rgba(245,158,11,0.08)',
                                    border: '1px solid rgba(245,158,11,0.20)',
                                }}
                            >
                                <SparklesIcon className="w-4 h-4" style={{ color: '#F59E0B' }} />
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: '#F59E0B' }}
                                >
                                    Metodologia comprovada
                                </span>
                            </div>
                            <h2
                                className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight"
                                style={{ color: '#FDF8EE' }}
                            >
                                Feito para quem leva os estudos a sério
                            </h2>
                            <p
                                className="text-lg max-w-2xl mx-auto leading-relaxed"
                                style={{ color: '#A09070' }}
                            >
                                O Eleva foi criado para estudantes e concurseiros que querem{' '}
                                <span style={{ color: '#FDF8EE', fontWeight: 600 }}>
                                    constância, clareza e evolução real
                                </span>{' '}
                                — sem perder tempo com planilhas ou métodos confusos.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* ── CTA STRONG ───────────────────────────────────────── */}
                <section className="py-32 px-6 relative overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.08) 0%, transparent 65%)',
                        }}
                    />

                    <div className="max-w-2xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="p-12 rounded-3xl"
                            style={{
                                background: 'rgba(22,18,8,0.80)',
                                border: '1px solid rgba(245,158,11,0.18)',
                                boxShadow: '0 0 80px rgba(245,158,11,0.06)',
                            }}
                        >
                            <h2
                                className="font-display text-4xl sm:text-5xl font-semibold mb-3 leading-tight"
                                style={{ color: '#FDF8EE' }}
                            >
                                Comece hoje.
                            </h2>
                            <h2
                                className="font-display text-4xl sm:text-5xl font-bold mb-8 leading-tight italic"
                                style={{ color: '#F59E0B' }}
                            >
                                É grátis.
                            </h2>

                            <button
                                onClick={handleSignupClick}
                                className="w-full sm:w-auto px-10 py-4 text-lg font-bold rounded-full transition-all duration-300"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                    color: '#0C0A06',
                                    boxShadow: '0 4px 24px rgba(245,158,11,0.30)',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)';
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 40px rgba(245,158,11,0.45)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLButtonElement).style.transform = '';
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(245,158,11,0.30)';
                                }}
                            >
                                Criar conta gratuita
                            </button>

                            <p
                                className="mt-5 text-sm flex items-center justify-center gap-2"
                                style={{ color: '#A09070' }}
                            >
                                <TimerIcon className="w-4 h-4" />
                                Leva menos de 1 minuto
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* ── URGENCY CLOSER ───────────────────────────────────── */}
                <section className="pb-8 px-6 text-center">
                    <p
                        className="text-base mb-4"
                        style={{ color: '#A09070' }}
                    >
                        Quanto mais você adia, mais tempo perde estudando do jeito errado.
                    </p>
                    <button
                        onClick={handleSignupClick}
                        className="text-sm font-medium pb-0.5 transition-all duration-200"
                        style={{
                            color: '#FDF8EE',
                            borderBottom: '1px solid rgba(245,158,11,0.40)',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = '#F59E0B';
                            (e.currentTarget as HTMLButtonElement).style.borderBottomColor = '#F59E0B';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = '#FDF8EE';
                            (e.currentTarget as HTMLButtonElement).style.borderBottomColor = 'rgba(245,158,11,0.40)';
                        }}
                    >
                        Comece agora. Criar conta no Eleva →
                    </button>
                </section>

                {/* ── TESTIMONIALS ─────────────────────────────────────── */}
                <section
                    className="py-24 px-6"
                    style={{ borderTop: '1px solid rgba(245,158,11,0.06)' }}
                >
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="text-center mb-16"
                        >
                            <p
                                className="font-mono text-xs uppercase tracking-widest mb-4"
                                style={{ color: '#F59E0B' }}
                            >
                                Depoimentos
                            </p>
                            <h2
                                className="font-display text-3xl sm:text-4xl font-semibold"
                                style={{ color: '#FDF8EE' }}
                            >
                                O que dizem sobre o Eleva
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-5">
                            <TestimonialCard
                                name="Mariana S."
                                role="Aprovada no TRF3"
                                text="Finalmente parei de esquecer o que estudava. O sistema de revisão do Eleva mudou minha rotina completamente."
                                avatar="M"
                                delay={0}
                            />
                            <TestimonialCard
                                name="Lucas P."
                                role="Estudante de Medicina"
                                text="Uso os flashcards todo dia. Em 3 meses, minha retenção de conteúdo aumentou absurdamente. Recomendo demais!"
                                avatar="L"
                                delay={0.1}
                            />
                            <TestimonialCard
                                name="Ana C."
                                role="Concurseira — Área Fiscal"
                                text="O dashboard me mostra exatamente onde preciso focar. Parei de perder tempo estudando o que já sei."
                                avatar="A"
                                delay={0.2}
                            />
                        </div>
                    </div>
                </section>

                {/* ── PRICING ──────────────────────────────────────────── */}
                <PricingSection />

                {/* ── FAQ ──────────────────────────────────────────────── */}
                <section
                    className="py-24 px-6"
                    style={{ borderTop: '1px solid rgba(245,158,11,0.06)' }}
                >
                    <div className="max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="text-center mb-16"
                        >
                            <p
                                className="font-mono text-xs uppercase tracking-widest mb-4"
                                style={{ color: '#F59E0B' }}
                            >
                                FAQ
                            </p>
                            <h2
                                className="font-display text-3xl sm:text-4xl font-semibold"
                                style={{ color: '#FDF8EE' }}
                            >
                                Perguntas frequentes
                            </h2>
                        </motion.div>

                        <div>
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

                {/* ── FOOTER ───────────────────────────────────────────── */}
                <footer
                    className="py-12 px-6"
                    style={{
                        borderTop: '1px solid rgba(245,158,11,0.08)',
                        background: 'rgba(8,6,3,0.6)',
                    }}
                >
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #F59E0B, #4ADE80)' }}
                                >
                                    <LandmarkIcon className="w-4 h-4" style={{ color: '#0C0A06' }} />
                                </div>
                                <span
                                    className="font-display font-bold text-lg"
                                    style={{ color: '#FDF8EE' }}
                                >
                                    Eleva
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                                {[
                                    { label: 'Termos de Uso', href: '#' },
                                    { label: 'Política de Privacidade', href: '#' },
                                ].map(({ label, href }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        className="transition-colors duration-200"
                                        style={{ color: '#A09070' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#FDF8EE')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#A09070')}
                                    >
                                        {label}
                                    </a>
                                ))}
                                <a
                                    href="mailto:suporte@meueleva.com"
                                    className="flex items-center gap-1.5 transition-colors duration-200"
                                    style={{ color: '#A09070' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#F59E0B')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#A09070')}
                                >
                                    <MailIcon className="w-3.5 h-3.5" />
                                    suporte@meueleva.com
                                </a>
                            </div>
                        </div>

                        <div
                            className="mt-8 pt-8 text-center text-xs font-mono"
                            style={{
                                borderTop: '1px solid rgba(245,158,11,0.06)',
                                color: 'rgba(160,144,112,0.4)',
                            }}
                        >
                            © {new Date().getFullYear()} Eleva. Todos os direitos reservados.
                        </div>
                    </div>
                </footer>

            </main>

            {/* ── LOGIN MODAL ──────────────────────────────────────── */}
            <AnimatePresence>
                {showLogin && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0"
                            style={{ background: 'rgba(8,6,3,0.90)', backdropFilter: 'blur(8px)' }}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="relative z-10 w-full max-w-md"
                        >
                            <button
                                onClick={handleCloseModal}
                                className="absolute -top-12 right-0 p-2 transition-colors duration-200"
                                style={{ color: 'rgba(253,248,238,0.4)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#FDF8EE')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(253,248,238,0.4)')}
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                            <LoginPage initialAuthMode={initialAuthMode} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
