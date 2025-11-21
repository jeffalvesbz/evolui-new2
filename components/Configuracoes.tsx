import React, { useState } from 'react';
import { SettingsIcon, SunIcon, MoonIcon, BellIcon, ClockIcon, TargetIcon, UserIcon, LogOutIcon } from './icons';
import { useAuthStore } from '../stores/useAuthStore';
import { useDailyGoalStore } from '../stores/useDailyGoalStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { Theme } from '../types';
import { toast } from './Sonner';

interface ConfiguracoesProps {
  theme: Theme;
  toggleTheme: () => void;
}

const Configuracoes: React.FC<ConfiguracoesProps> = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuthStore();
  const { goalMinutes, weeklyGoalHours, setGoalMinutes, setWeeklyGoalHours } = useDailyGoalStore();
  const { pomodoroSettings, updatePomodoroSettings } = useEstudosStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
  };

  const handlePomodoroUpdate = (key: keyof typeof pomodoroSettings, value: string) => {
    const minutes = parseInt(value, 10);
    if (!isNaN(minutes) && minutes > 0) {
      updatePomodoroSettings({ [key]: minutes * 60 });
      toast.success('Configuração do Pomodoro atualizada!');
    }
  };

  const handleGoalChange = (type: 'daily' | 'weekly', value: number) => {
    if (type === 'daily') {
      if (value > 720) {
        toast.error('A meta diária não pode ser maior que 12 horas (720 minutos)');
        return;
      }
      setGoalMinutes(value);
      toast.success('Meta diária atualizada!');
    } else {
      setWeeklyGoalHours(value);
      toast.success('Meta semanal atualizada!');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          </div>
          <p className="text-muted-foreground">Gerencie suas preferências e configurações da aplicação</p>
        </div>

        <div className="space-y-6">
          {/* Seção: Aparência */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              {theme === 'light' ? (
                <SunIcon className="w-6 h-6 text-primary" />
              ) : (
                <MoonIcon className="w-6 h-6 text-primary" />
              )}
              <h2 className="text-xl font-semibold text-foreground">Aparência</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h3 className="font-medium text-foreground mb-1">Tema</h3>
                  <p className="text-sm text-muted-foreground">
                    Escolha entre tema claro ou escuro
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                </button>
              </div>
            </div>
          </section>

          {/* Seção: Notificações */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <BellIcon className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Notificações</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h3 className="font-medium text-foreground mb-1">Notificações do Sistema</h3>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações sobre revisões, metas e lembretes
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h3 className="font-medium text-foreground mb-1">Sons de Notificação</h3>
                  <p className="text-sm text-muted-foreground">
                    Ative sons para transições do Pomodoro
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Seção: Pomodoro */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <ClockIcon className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Pomodoro</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tempo de Foco (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={pomodoroSettings.work / 60}
                  onChange={(e) => handlePomodoroUpdate('work', e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pausa Curta (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={pomodoroSettings.shortBreak / 60}
                  onChange={(e) => handlePomodoroUpdate('shortBreak', e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pausa Longa (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={pomodoroSettings.longBreak / 60}
                  onChange={(e) => handlePomodoroUpdate('longBreak', e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ciclos antes da Pausa Longa
                </label>
                <input
                  type="number"
                  min="1"
                  value={pomodoroSettings.cyclesBeforeLongBreak}
                  onChange={(e) => {
                    const cycles = parseInt(e.target.value, 10);
                    if (!isNaN(cycles) && cycles > 0) {
                      updatePomodoroSettings({ cyclesBeforeLongBreak: cycles });
                      toast.success('Configuração do Pomodoro atualizada!');
                    }
                  }}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </section>

          {/* Seção: Metas */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <TargetIcon className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Metas de Estudo</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Diária (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={goalMinutes}
                  onChange={(e) => handleGoalChange('daily', parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: 720 minutos (12 horas)
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Semanal (horas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={weeklyGoalHours}
                  onChange={(e) => handleGoalChange('weekly', parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </section>

          {/* Seção: Conta */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Conta</h2>
            </div>
            
            <div className="space-y-4">
              {user && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-1">Nome</p>
                    <p className="font-medium text-foreground">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium text-foreground">{user.email}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-semibold"
              >
                <LogOutIcon className="w-5 h-5" />
                Sair da Conta
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;

