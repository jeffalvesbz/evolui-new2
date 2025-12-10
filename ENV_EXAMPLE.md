# 📋 Exemplo de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```bash
# ============================================
# Variáveis de Ambiente - Evolui App
# ============================================

# ============================================
# SUPABASE (OBRIGATÓRIO)
# ============================================
# Obtenha estas credenciais no dashboard do Supabase:
# https://supabase.com/dashboard/project/_/settings/api

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui

# ============================================
# GEMINI AI (OPCIONAL)
# ============================================
# Obtenha a chave em: https://aistudio.google.com/app/apikey
# Necessário apenas se usar recursos de IA (correção de redação, etc.)

VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
GEMINI_API_KEY=sua_chave_gemini_aqui
```

## 📝 Instruções

### Para Desenvolvimento Local:

1. **Copie o template acima** para um arquivo `.env.local` na raiz do projeto
2. **Preencha as variáveis** com suas credenciais reais
3. **Nunca commite** o arquivo `.env.local` no Git (já está no .gitignore)

### Para Produção (Vercel/Netlify):

1. Acesse o painel da plataforma (Vercel/Netlify)
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável uma por uma:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY` (opcional)
   - `GEMINI_API_KEY` (opcional)
4. Selecione os ambientes (Production, Preview, Development)
5. Faça um novo deploy após adicionar as variáveis

## ⚠️ Importante

- **Nunca compartilhe** suas credenciais publicamente
- **Nunca commite** arquivos `.env` ou `.env.local` no Git
- A **Anon Key** do Supabase é pública por design, mas protegida por RLS
- Sem as variáveis de ambiente, o app **não funcionará** em produção




