# 📋 Variáveis de Ambiente para Vercel - Copy & Paste

## 🔑 Variáveis para Copiar e Colar

### ✅ Supabase (Já Configurado)

**Variável 1:**
```
VITE_SUPABASE_URL
```
**Valor:**
```
https://ilzbcfamqkfcochldtxn.supabase.co
```

**Variável 2:**
```
VITE_SUPABASE_ANON_KEY
```
**Valor:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsemJjZmFtcWtmY29jaGxkdHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTUzNTIsImV4cCI6MjA3NzE5MTM1Mn0.ywCtrjlKOIN6OYBDdvP7f5o5L7_rPUhMZXRDv2DczDk
```

---

### ⚠️ Gemini AI (Você precisa adicionar)

**Variável 3:**
```
VITE_GEMINI_API_KEY
```
**Valor:** (Cole sua chave do Gemini aqui)
```
SUA_CHAVE_GEMINI_AQUI
```

**Variável 4:**
```
GEMINI_API_KEY
```
**Valor:** (Mesma chave do Gemini)
```
SUA_CHAVE_GEMINI_AQUI
```

**Como obter a chave do Gemini:**
1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login
3. Clique em "Create API Key"
4. Copie a chave gerada

---

## 📝 Como Adicionar no Vercel

### Passo a Passo:

1. **Acesse o Vercel Dashboard:**
   - Vá para: https://vercel.com/dashboard
   - Selecione seu projeto (ou crie um novo)

2. **Abra as Configurações:**
   - Clique em **"Settings"** (no topo)
   - Clique em **"Environment Variables"** (menu lateral)

3. **Adicione cada variável:**
   
   Para cada variável acima:
   - Clique em **"Add New"**
   - **Key:** Cole o nome da variável (ex: `VITE_SUPABASE_URL`)
   - **Value:** Cole o valor correspondente
   - **Environments:** Marque todas as opções:
     - ☑️ Production
     - ☑️ Preview  
     - ☑️ Development
   - Clique em **"Save"**

4. **Repita para todas as 4 variáveis**

5. **Fazer novo deploy:**
   - Vá em **"Deployments"**
   - Clique nos 3 pontos (...) do último deployment
   - Clique em **"Redeploy"**
   - Ou faça um novo commit para trigger automático

---

## ✅ Checklist

- [ ] Variável `VITE_SUPABASE_URL` adicionada
- [ ] Variável `VITE_SUPABASE_ANON_KEY` adicionada
- [ ] API Key do Gemini obtida
- [ ] Variável `VITE_GEMINI_API_KEY` adicionada
- [ ] Variável `GEMINI_API_KEY` adicionada
- [ ] Todas marcadas para Production, Preview e Development
- [ ] Novo deploy realizado

---

## 🎯 Formato para Copiar (Tudo de uma vez)

Se preferir, você pode copiar tudo abaixo e colar em um editor de texto para referência:

```
VITE_SUPABASE_URL=https://ilzbcfamqkfcochldtxn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsemJjZmFtcWtmY29jaGxkdHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTUzNTIsImV4cCI6MjA3NzE5MTM1Mn0.ywCtrjlKOIN6OYBDdvP7f5o5L7_rPUhMZXRDv2DczDk
VITE_GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI
GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI
```

**⚠️ Lembre-se:** Substitua `SUA_CHAVE_GEMINI_AQUI` pela chave real do Gemini!

---

## 🚀 Após Configurar

Após adicionar todas as variáveis:

1. Faça um novo deploy (ou aguarde o próximo commit)
2. Verifique os logs do deploy no Vercel
3. Teste a aplicação no URL fornecido
4. Verifique se o Supabase está conectado
5. Teste uma funcionalidade que usa IA (Gemini)

---

**✅ Pronto! Todas as variáveis estão formatadas para copiar e colar no Vercel!**




