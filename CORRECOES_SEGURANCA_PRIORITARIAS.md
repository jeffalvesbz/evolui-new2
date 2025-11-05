# 🔧 Correções de Segurança Prioritárias

Este documento contém as correções mais críticas que devem ser implementadas imediatamente.

---

## 🚨 CRÍTICO 1: Remover Credenciais Hardcoded

### Arquivo: `services/supabaseClient.ts`

**ANTES:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ilzbcfamqkfcochldtxn.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsemJjZmFtcWtmY29jaGxkdHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTUzNTIsImV4cCI6MjA3NzE5MTM1Mn0.ywCtrjlKOIN6OYBDdvP7f5o5L7_rPUhMZXRDv2DczDk";
```

**DEPOIS:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    throw new Error(
      'CRÍTICO: Variáveis de ambiente do Supabase não configuradas em produção! ' +
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.'
    );
  } else {
    console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas!');
    console.warn('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local');
  }
}

export const supabase = createClient<Database>(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);
```

---

## 🚨 CRÍTICO 2: Remover Arquivos com Credenciais do Repositório

Se esses arquivos já foram commitados no Git:

1. **Remover do histórico do Git:**
```bash
# Remover arquivos do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch CREDENCIAIS_SUPABASE.md VERCEL_ENV_VARIABLES.txt" \
  --prune-empty --tag-name-filter cat -- --all

# Forçar push (CUIDADO: isso reescreve o histórico)
git push origin --force --all
```

2. **Ou simplesmente:**
   - Deletar os arquivos `CREDENCIAIS_SUPABASE.md` e `VERCEL_ENV_VARIABLES.txt`
   - Criar um novo arquivo `.env.example` com placeholders:
```bash
# .env.example
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
```

---

## ⚠️ ALTO 1: Melhorar Sanitização na Busca de Usuários

### Arquivo: `services/geminiService.ts` - função `searchUsers`

**ANTES:**
```typescript
const sanitizedQuery = query.trim();
```

**DEPOIS:**
```typescript
export const searchUsers = async (query: string, currentUserId: string): Promise<User[]> => {
    // Sanitizar e validar a query
    const sanitizedQuery = query
        .trim()
        .slice(0, 100) // Limitar tamanho máximo
        .replace(/[%_\\]/g, '') // Remover caracteres especiais do SQL LIKE
        .replace(/[<>]/g, ''); // Remover caracteres que podem causar problemas
    
    // Validação rigorosa
    if (!sanitizedQuery || sanitizedQuery.length < 2) {
        return [];
    }
    
    // Validar que não é apenas espaços ou caracteres especiais
    if (!/^[\w\s@.-]+$/.test(sanitizedQuery)) {
        console.warn('Query de busca contém caracteres inválidos');
        return [];
    }

    try {
        // ... resto do código existente ...
```

---

## ⚠️ MÉDIO 1: Remover Console.log em Produção

### Opção 1: Configurar Vite para remover em build

**Arquivo: `vite.config.ts`**

**ADICIONAR:**
```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // ... configurações existentes ...
      
      esbuild: {
        // Remove console.log em produção
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
      
      // ... resto da configuração ...
    };
});
```

### Opção 2: Criar utilitário de logging

**Arquivo: `utils/logger.ts` (novo arquivo)**

```typescript
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // Em produção, enviar para serviço de logging (ex: Sentry)
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
};
```

**Depois, substituir todos os `console.log` por `logger.log`**

---

## ⚠️ MÉDIO 2: Adicionar Validação Robusta de Formulários

### Instalar biblioteca de validação

```bash
npm install zod
```

### Exemplo: Validar correção de redação

**Arquivo: `components/CorretorRedacao.tsx`**

**ADICIONAR no topo:**
```typescript
import { z } from 'zod';

const redacaoSchema = z.object({
  texto: z.string()
    .min(50, 'O texto deve ter pelo menos 50 caracteres')
    .max(10000, 'O texto não pode exceder 10.000 caracteres'),
  banca: z.string().min(1, 'Selecione uma banca'),
  notaMaxima: z.number().min(0).max(1000),
});
```

**USAR na validação:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        const validated = redacaoSchema.parse({
            texto: redacao,
            banca: banca,
            notaMaxima: notaMaxima
        });
        
        // Continuar com o código existente usando validated.texto, validated.banca, etc.
    } catch (error) {
        if (error instanceof z.ZodError) {
            toast.error(error.errors[0].message);
            return;
        }
        throw error;
    }
    
    // ... resto do código
};
```

---

## ⚠️ BAIXO 1: Adicionar Content Security Policy

### Arquivo: `netlify.toml`

**ADICIONAR:**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com; font-src 'self' data:;"
```

### Arquivo: `vercel.json`

**ADICIONAR no array de headers:**
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com; font-src 'self' data:;"
}
```

---

## 📋 Checklist de Implementação

- [ ] Remover credenciais hardcoded de `supabaseClient.ts`
- [ ] Remover arquivos `CREDENCIAIS_SUPABASE.md` e `VERCEL_ENV_VARIABLES.txt` do repositório
- [ ] Criar `.env.example` com placeholders
- [ ] Melhorar sanitização em `searchUsers`
- [ ] Configurar remoção de console.log em produção
- [ ] Adicionar validação com Zod nos formulários principais
- [ ] Adicionar CSP nos arquivos de configuração
- [ ] Testar em ambiente de desenvolvimento
- [ ] Testar em ambiente de produção

---

## 🧪 Como Testar as Correções

1. **Testar credenciais:**
   - Remover variáveis de ambiente
   - Verificar se erro é lançado em produção
   - Verificar se warning aparece em desenvolvimento

2. **Testar sanitização:**
   - Tentar buscar com caracteres especiais: `%`, `_`, `\`, `<`, `>`
   - Verificar se busca funciona normalmente com texto normal
   - Verificar se query muito longa é truncada

3. **Testar validação:**
   - Tentar submeter formulários com dados inválidos
   - Verificar se mensagens de erro aparecem
   - Verificar se dados válidos são aceitos

4. **Testar CSP:**
   - Verificar console do navegador por violações de CSP
   - Testar se recursos externos são bloqueados
   - Testar se app funciona normalmente

---

## 📚 Recursos Adicionais

- [Documentação Zod](https://zod.dev/)
- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

