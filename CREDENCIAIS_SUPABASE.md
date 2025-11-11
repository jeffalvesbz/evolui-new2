# 🔑 Credenciais do Supabase - Configuradas

## ✅ Credenciais Já Configuradas

As credenciais do Supabase já estão configuradas no projeto:

### URL do Supabase
```
https://ilzbcfamqkfcochldtxn.supabase.co
```

### Anon Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsemJjZmFtcWtmY29jaGxkdHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTUzNTIsImV4cCI6MjA3NzE5MTM1Mn0.ywCtrjlKOIN6OYBDdvP7f5o5L7_rPUhMZXRDv2DczDk
```

---

## 📋 Onde Configurar no Deploy

### Vercel ou Netlify

Adicione estas variáveis de ambiente na plataforma:

```bash
VITE_SUPABASE_URL=https://ilzbcfamqkfcochldtxn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsemJjZmFtcWtmY29jaGxkdHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTUzNTIsImV4cCI6MjA3NzE5MTM1Mn0.ywCtrjlKOIN6OYBDdvP7f5o5L7_rPUhMZXRDv2DczDk
```

---

## 🏠 Desenvolvimento Local

O arquivo `.env.local` já foi criado com essas credenciais.

Para usar localmente:
```bash
# O arquivo .env.local já está criado e configurado
npm run dev
```

---

## ⚠️ Importante

- ✅ Estas credenciais já estão configuradas no código como fallback
- ✅ O arquivo `.env.local` está no `.gitignore` (não será commitado)
- ⚠️ **NÃO compartilhe essas credenciais publicamente**
- ⚠️ A anon key é pública mas protegida por RLS (Row Level Security)

---

## 🔐 Segurança

- A anon key é segura para uso no frontend
- As políticas RLS no Supabase protegem os dados
- Nunca commite arquivos `.env` ou `.env.local` no Git
- O arquivo `.env.local` já está protegido pelo `.gitignore`

---

## ✅ Próximo Passo

Agora você só precisa:

1. **Adicionar a API Key do Gemini** (se ainda não tiver)
   - Acesse: https://aistudio.google.com/app/apikey
   - Adicione no `.env.local`:
     ```
     VITE_GEMINI_API_KEY=sua_chave_aqui
     GEMINI_API_KEY=sua_chave_aqui
     ```

2. **Configurar no Vercel/Netlify** quando for fazer deploy
   - Use as mesmas credenciais acima
   - Adicione também a chave do Gemini

---

**✅ Credenciais do Supabase configuradas com sucesso!**

