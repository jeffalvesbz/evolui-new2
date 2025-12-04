# 🔍 Diagnóstico: Erro "Failed to fetch" no Supabase

## Possíveis Causas

1. **Variáveis de ambiente não configuradas**
2. **URL do Supabase incorreta**
3. **Problema de CORS**
4. **Problema de rede/conexão**

## ✅ Verificação Rápida

### 1. Verificar se as variáveis estão configuradas

Abra o console do navegador (F12) e execute:

```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
```

### 2. Verificar arquivo .env.local

Certifique-se de que existe um arquivo `.env.local` na raiz do projeto com:

```bash
VITE_SUPABASE_URL=https://esiucveulztieutqlojh.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

**⚠️ IMPORTANTE:** A URL que você mencionou é `esiucveulztieutqlojh`, mas nos arquivos de documentação há `ilzbcfamqkfcochldtxn`. Certifique-se de usar a URL correta do seu projeto!

### 3. Reiniciar o servidor de desenvolvimento

Após criar/editar o `.env.local`:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

**⚠️ IMPORTANTE:** O Vite só carrega variáveis de ambiente na inicialização. Você precisa reiniciar o servidor após criar/editar o `.env.local`.

## 🔧 Solução Passo a Passo

### Passo 1: Verificar URL do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **Project URL** (deve ser algo como `https://xxxxx.supabase.co`)

### Passo 2: Criar/Atualizar .env.local

Na raiz do projeto, crie ou edite o arquivo `.env.local`:

```bash
VITE_SUPABASE_URL=https://esiucveulztieutqlojh.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_completa_aqui
```

### Passo 3: Verificar Anon Key

1. No mesmo lugar (Settings → API)
2. Copie a **anon/public** key
3. Cole no `.env.local`

### Passo 4: Reiniciar o servidor

```bash
# Pare o servidor
# Ctrl+C ou Cmd+C

# Inicie novamente
npm run dev
```

### Passo 5: Verificar no Console

Abra o console do navegador (F12) e verifique se não há erros de configuração.

## 🐛 Debug Avançado

Se ainda não funcionar, adicione este código temporariamente em `services/supabaseClient.ts`:

```typescript
console.log('🔍 Debug Supabase:');
console.log('URL:', supabaseUrl);
console.log('Key existe:', !!supabaseAnonKey);
console.log('Key length:', supabaseAnonKey?.length);
```

Isso ajudará a identificar se as variáveis estão sendo carregadas corretamente.

## ⚠️ Problemas Comuns

### Problema 1: Arquivo .env.local não existe
**Solução:** Crie o arquivo na raiz do projeto

### Problema 2: Variáveis não carregam após criar .env.local
**Solução:** Reinicie o servidor de desenvolvimento

### Problema 3: URL incorreta
**Solução:** Verifique no dashboard do Supabase e use a URL exata

### Problema 4: Anon Key incorreta ou incompleta
**Solução:** Copie a key completa do dashboard (deve ter ~200 caracteres)

## 📝 Checklist

- [ ] Arquivo `.env.local` existe na raiz do projeto
- [ ] `VITE_SUPABASE_URL` está configurada corretamente
- [ ] `VITE_SUPABASE_ANON_KEY` está configurada corretamente
- [ ] Servidor foi reiniciado após criar/editar `.env.local`
- [ ] URL do Supabase está acessível (teste no navegador)
- [ ] Não há erros no console do navegador



