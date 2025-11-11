import { useEffect, useState } from 'react';
import { SyncManager } from '../lib/dashboardMocks';
import { useAuthStore } from '../stores/useAuthStore';
import { useEditalStore } from '../stores/useEditalStore';

/**
 * Hook para sincronização entre navegadores
 * Detecta mudanças e força sincronização automática
 */
export const useCrossBrowserSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [needsSync, setNeedsSync] = useState(false);
  
  const { editalAtivo } = useEditalStore();
  const { user } = useAuthStore();

  // Detectar mudanças de conectividade
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [CROSS-BROWSER] Conexão restaurada');
      setIsOnline(true);
      setNeedsSync(true);
    };

    const handleOffline = () => {
      console.log('📴 [CROSS-BROWSER] Conexão perdida');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Detectar mudanças de foco da janela (usuário voltou ao navegador)
  useEffect(() => {
    const handleFocus = () => {
      console.log('👁️ [CROSS-BROWSER] Janela em foco - verificando sincronização');
      setNeedsSync(true);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ [CROSS-BROWSER] Página visível - verificando sincronização');
        setNeedsSync(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Sincronização automática quando necessário
  useEffect(() => {
    if (!needsSync || !isOnline || !editalAtivo?.id || !user?.id) return;

    const performSync = async () => {
      try {
        console.log('🔄 [CROSS-BROWSER] Iniciando sincronização automática...');
        
        // Invalidar caches para forçar busca no Supabase
        SyncManager.getInstance().invalidateAllCaches();
        
        // Sincronizar todas as entidades
        await SyncManager.getInstance().syncAll(editalAtivo.id);
        
        setLastSync(new Date().toLocaleTimeString('pt-BR'));
        setNeedsSync(false);
        
        console.log('✅ [CROSS-BROWSER] Sincronização automática concluída');
        
        // Disparar evento para atualizar UI
        window.dispatchEvent(new CustomEvent('cross-browser:synced', {
          detail: { timestamp: Date.now(), editalId: editalAtivo.id }
        }));
        
      } catch (error) {
        console.error('❌ [CROSS-BROWSER] Erro na sincronização automática:', error);
        setNeedsSync(false);
      }
    };

    // Debounce para evitar múltiplas sincronizações
    const timeoutId = setTimeout(performSync, 1000);
    return () => clearTimeout(timeoutId);
  }, [needsSync, isOnline, editalAtivo?.id, user?.id]);

  // Sincronização manual
  const forceSync = async () => {
    if (!editalAtivo?.id || !user?.id) return;

    try {
      console.log('🔄 [CROSS-BROWSER] Forçando sincronização manual...');
      
      SyncManager.getInstance().invalidateAllCaches();
      await SyncManager.getInstance().syncAll(editalAtivo.id);
      
      setLastSync(new Date().toLocaleTimeString('pt-BR'));
      setNeedsSync(false);
      
      console.log('✅ [CROSS-BROWSER] Sincronização manual concluída');
      
      // Disparar evento para atualizar UI
      window.dispatchEvent(new CustomEvent('cross-browser:synced', {
        detail: { timestamp: Date.now(), editalId: editalAtivo.id }
      }));
      
    } catch (error) {
      console.error('❌ [CROSS-BROWSER] Erro na sincronização manual:', error);
    }
  };

  return {
    isOnline,
    lastSync,
    needsSync,
    forceSync
  };
};