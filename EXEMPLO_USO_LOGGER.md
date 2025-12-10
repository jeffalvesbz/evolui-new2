# 📝 Exemplo de Uso do Logger

Este documento mostra como usar o sistema de logging estruturado em toda a aplicação.

## Importação

```typescript
import { logger } from '@/utils/logger';
```

## Uso Básico

### Debug (apenas em desenvolvimento)
```typescript
logger.debug('Carregando dados do usuário', { userId: user.id });
```

### Info (informações gerais)
```typescript
logger.info('Usuário autenticado com sucesso', { userId: user.id });
```

### Warn (avisos)
```typescript
logger.warn('Tentativa de acesso negado', { 
  userId: user.id,
  resource: '/admin' 
});
```

### Error (erros)
```typescript
try {
  await fetchData();
} catch (error) {
  logger.error('Falha ao carregar dados', error as Error, {
    component: 'Dashboard',
    userId: user.id
  });
}
```

## Helpers Específicos

### Ações do Usuário
```typescript
logger.userAction('flashcard_answered', {
  flashcardId: '123',
  correct: true,
  userId: user.id
});
```

### Erros de API
```typescript
try {
  await supabase.from('sessions').insert(data);
} catch (error) {
  logger.apiError('/api/sessions', error as Error, {
    method: 'POST',
    userId: user.id
  });
}
```

### Performance
```typescript
const startTime = performance.now();
await heavyOperation();
const duration = performance.now() - startTime;

logger.performance('heavy_operation', duration, {
  operation: 'data_processing',
  itemsProcessed: 1000
});
```

## Substituindo console.log

### ❌ ANTES
```typescript
console.log('Usuário logado:', user);
console.error('Erro ao salvar:', error);
```

### ✅ DEPOIS
```typescript
logger.info('Usuário logado', { userId: user.id, email: user.email });
logger.error('Erro ao salvar', error, { component: 'SaveModal' });
```

## Exemplo Completo em um Store

```typescript
import { logger } from '@/utils/logger';

export const useEstudosStore = create<EstudosState>((set, get) => ({
  sessoes: [],
  loading: false,

  fetchSessoes: async (studyPlanId: string) => {
    set({ loading: true });
    logger.info('Iniciando busca de sessões', { studyPlanId });
    
    try {
      const sessoes = await getSessoes(studyPlanId);
      set({ sessoes, loading: false });
      logger.info('Sessões carregadas com sucesso', { 
        count: sessoes.length,
        studyPlanId 
      });
    } catch (error) {
      logger.error('Falha ao buscar sessões', error as Error, {
        studyPlanId,
        component: 'useEstudosStore'
      });
      toast.error("Não foi possível carregar as sessões.");
      set({ loading: false });
    }
  },
}));
```

## Benefícios

1. **Automático**: Logs removidos automaticamente em produção
2. **Estruturado**: Contexto sempre incluído
3. **Pronto para integração**: Fácil adicionar Sentry, LogRocket, etc.
4. **Performance**: Zero overhead em produção




