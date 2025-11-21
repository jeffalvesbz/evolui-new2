import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useUiStore } from '../stores/useUiStore';
import { ClockIcon, PauseIcon, PlayIcon, StopCircleIcon, XIcon, ExpandIcon, MinimizeIcon, RefreshCwIcon, CheckIcon, SettingsIcon } from './icons';

const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const playNotificationSound = (audioContext: AudioContext | null) => {
    if (!audioContext) return;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
};

const PomodoroSettings: React.FC = () => {
    const { pomodoroSettings, updatePomodoroSettings } = useEstudosStore();
    
    const handleUpdate = (key: keyof typeof pomodoroSettings, value: string) => {
        const minutes = parseInt(value, 10);
        if (!isNaN(minutes) && minutes > 0) {
            updatePomodoroSettings({ [key]: minutes * 60 });
        }
    };

    return (
        <div className="absolute bottom-full mb-3 right-0 bg-background border border-border p-4 rounded-lg shadow-xl w-64 space-y-3">
            <h4 className="font-bold text-sm text-foreground">Configurações Pomodoro</h4>
            <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Foco (min)</label>
                <input type="number" value={pomodoroSettings.work / 60} onChange={e => handleUpdate('work', e.target.value)} className="w-16 bg-muted/50 border border-border rounded-md px-2 py-1 text-xs text-foreground"/>
            </div>
            <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Pausa Curta (min)</label>
                <input type="number" value={pomodoroSettings.shortBreak / 60} onChange={e => handleUpdate('shortBreak', e.target.value)} className="w-16 bg-muted/50 border border-border rounded-md px-2 py-1 text-xs text-foreground"/>
            </div>
            <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Pausa Longa (min)</label>
                <input type="number" value={pomodoroSettings.longBreak / 60} onChange={e => handleUpdate('longBreak', e.target.value)} className="w-16 bg-muted/50 border border-border rounded-md px-2 py-1 text-xs text-foreground"/>
            </div>
        </div>
    );
};

const CronometroInteligente: React.FC = () => {
    const { sessaoAtual, pausarSessao, retomarSessao, encerrarSessaoParaSalvar, alternarModoTimer, descartarSessao, pomodoroSettings, skipBreak } = useEstudosStore();
    const { isTimerMinimized, toggleTimerMinimized, isSaveModalOpen } = useUiStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Sound effect handling
    const audioContextRef = useRef<AudioContext | null>(null);
    const lastStageRef = useRef(sessaoAtual?.pomodoroStage);
    const lastCycleRef = useRef(sessaoAtual?.pomodoroCycle);

    useEffect(() => {
        // Initialize AudioContext on user interaction (or component mount)
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (sessaoAtual?.mode === 'pomodoro') {
            const stageChanged = sessaoAtual.pomodoroStage !== lastStageRef.current;
            // Also check if it's a new cycle starting to handle the transition from long break back to work
            const cycleChanged = sessaoAtual.pomodoroCycle !== lastCycleRef.current;

            if (stageChanged || cycleChanged) {
                 playNotificationSound(audioContextRef.current);
                 lastStageRef.current = sessaoAtual.pomodoroStage;
                 lastCycleRef.current = sessaoAtual.pomodoroCycle;
            }
        }
    }, [sessaoAtual?.pomodoroStage, sessaoAtual?.pomodoroCycle, sessaoAtual?.mode]);

    const { displayTime, progress, pomodoroStatusText } = useMemo(() => {
        if (!sessaoAtual) return { displayTime: '00:00:00', progress: 0, pomodoroStatusText: '' };

        if (sessaoAtual.mode === 'cronometro') {
            return {
                displayTime: formatTime(sessaoAtual.elapsedSeconds),
                progress: 0, // No progress bar for regular cronometro
                pomodoroStatusText: 'CRONÔMETRO EM ANDAMENTO',
            };
        }

        // Pomodoro Mode
        const stageDuration = pomodoroSettings[sessaoAtual.pomodoroStage === 'work' ? 'work' : sessaoAtual.pomodoroStage === 'short_break' ? 'shortBreak' : 'longBreak'];
        const remaining = stageDuration - sessaoAtual.elapsedSeconds;
        const display = formatTime(remaining > 0 ? remaining : 0);
        const prog = stageDuration > 0 ? (sessaoAtual.elapsedSeconds / stageDuration) * 100 : 0;
        
        let statusText = '';
        switch(sessaoAtual.pomodoroStage) {
            case 'work': statusText = `FOCO #${sessaoAtual.pomodoroCycle + 1}`; break;
            case 'short_break': statusText = 'PAUSA CURTA'; break;
            case 'long_break': statusText = 'PAUSA LONGA'; break;
        }

        return { displayTime: display, progress: prog, pomodoroStatusText: statusText };
    }, [sessaoAtual, pomodoroSettings]);

    useEffect(() => {
        if (sessaoAtual) {
            document.title = `${displayTime} - ${sessaoAtual.topico.nome}`;
        } else {
            document.title = 'Evolui: Planejador de Estudos';
        }
    }, [sessaoAtual, displayTime]);

    if (!sessaoAtual) return null;

    if (isTimerMinimized) {
        return (
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-3 h-14 px-4 rounded-full bg-secondary text-black shadow-lg shadow-secondary/40"
            >
                <button onClick={sessaoAtual.status === 'running' ? pausarSessao : retomarSessao} className="p-2 -ml-2">
                    {sessaoAtual.status === 'running' ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold -mb-1 uppercase">{pomodoroStatusText}</span>
                    <span className="font-mono text-2xl font-semibold">{displayTime}</span>
                </div>
                <button onClick={toggleTimerMinimized} className="p-2">
                    <ExpandIcon className="w-5 h-5" />
                </button>
                <button onClick={encerrarSessaoParaSalvar} className="p-2 -mr-2">
                    <StopCircleIcon className="w-5 h-5" />
                </button>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 bg-background/[0.999] backdrop-blur-md z-[90] flex items-center justify-center p-4 ${isSaveModalOpen ? 'opacity-30 pointer-events-none' : ''}`}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl text-center relative"
                >
                    <button onClick={() => descartarSessao()} className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted transition-colors z-10">
                        <XIcon className="w-5 h-5 text-muted-foreground" />
                    </button>

                    <div className="p-8">
                        <div className="inline-flex items-center gap-2 bg-muted/50 text-muted-foreground px-3 py-1 rounded-full text-sm font-semibold mb-4">
                            <ClockIcon className="w-4 h-4 text-primary" />
                            CRONÔMETRO INTELIGENTE
                        </div>
                        
                        <div className="bg-muted/30 p-1 rounded-lg inline-flex gap-1 mb-6">
                            <button onClick={sessaoAtual.mode !== 'cronometro' ? alternarModoTimer : undefined} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${sessaoAtual.mode === 'cronometro' ? 'bg-background shadow' : 'text-muted-foreground'}`}>
                                Cronômetro
                            </button>
                            <button onClick={sessaoAtual.mode !== 'pomodoro' ? alternarModoTimer : undefined} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${sessaoAtual.mode === 'pomodoro' ? 'bg-background shadow' : 'text-muted-foreground'}`}>
                                🍅 Pomodoro
                            </button>
                        </div>

                        {sessaoAtual.mode === 'pomodoro' && (
                             <div className="w-full bg-muted/50 rounded-full h-2 mb-4">
                                <div className={`h-2 rounded-full transition-all ${sessaoAtual.pomodoroStage === 'work' ? 'bg-primary' : 'bg-secondary'}`} style={{ width: `${progress}%` }}></div>
                            </div>
                        )}

                        <p className="text-foreground/80 font-semibold mb-2">{sessaoAtual.mode === 'pomodoro' ? `${pomodoroStatusText} em: ${sessaoAtual.topico.nome}` : "CRONÔMETRO EM ANDAMENTO"}</p>
                        <h1 className="text-7xl lg:text-8xl font-mono font-bold text-foreground tracking-tighter">
                            {displayTime}
                        </h1>
                        <p className="text-muted-foreground mt-4 max-w-md mx-auto">
                            {sessaoAtual.mode === 'pomodoro' ? 'Mantenha o foco. O tempo está passando.' : 'Comece, pause ou encerre quando quiser. As informações detalhadas ficam para depois.'}
                        </p>
                    </div>
                    
                    <div className="bg-muted/30 p-6 rounded-b-2xl flex flex-col sm:flex-row items-center justify-center gap-4 relative">
                       {sessaoAtual.mode === 'pomodoro' && (
                            <div className="absolute top-4 left-4">
                                <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 rounded-full text-muted-foreground hover:bg-background">
                                    <SettingsIcon className="w-5 h-5"/>
                                </button>
                                {isSettingsOpen && <PomodoroSettings/>}
                            </div>
                       )}

                        {sessaoAtual.mode === 'pomodoro' && sessaoAtual.pomodoroStage !== 'work' && (
                             <button onClick={skipBreak} className="h-12 w-32 rounded-lg font-semibold text-sm transition-colors border border-border text-foreground hover:bg-muted">
                                PULAR
                            </button>
                        )}
                        <button 
                            onClick={sessaoAtual.status === 'running' ? pausarSessao : retomarSessao}
                            className={`h-12 w-48 rounded-lg font-semibold text-lg transition-colors ${sessaoAtual.status === 'running' ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-secondary text-black hover:bg-secondary/90'}`}
                        >
                           {sessaoAtual.status === 'running' ? 'PAUSAR' : 'RETOMAR'}
                        </button>
                         <button 
                            onClick={encerrarSessaoParaSalvar}
                            className="h-12 w-48 rounded-lg bg-red-500/80 text-white font-semibold text-lg hover:bg-red-500 transition-colors"
                        >
                            ENCERRAR E SALVAR
                        </button>
                    </div>

                    <button onClick={toggleTimerMinimized} className="absolute bottom-3 left-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Minimizar painel
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CronometroInteligente;