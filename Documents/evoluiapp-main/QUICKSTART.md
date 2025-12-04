# 🚀 Guia de Início Rápido - Evolui App

Este guia ajudará você a fazer o deploy do seu app em **5 minutos**.

## 📦 Opção 1: Deploy Automático (Mais Rápido)

### Vercel (Recomendado)

1. **Acesse:** https://vercel.com
2. **Clique em:** "Add New..." → "Project"
3. **Importe:** Seu repositório Git
4. **Configure variáveis de ambiente:**
   ```
   VITE_GEMINI_API_KEY=sua_chave_gemini
   GEMINI_API_KEY=sua_chave_gemini
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_supabase
   ```
5. **Clique em:** "Deploy"
6. **Aguarde:** 1-2 minutos
7. **Pronto!** ✅

### Netlify

1. **Acesse:** https://netlify.com
2. **Clique em:** "Add new site" → "Import an existing project"
3. **Conecte:** Seu provedor Git
4. **Selecione:** Seu repositório
5. **Configure variáveis de ambiente** (mesmas acima)
6. **Clique em:** "Deploy site"
7. **Pronto!** ✅

---

## 🔑 Como Obter as Credenciais

### 1. Gemini API Key (2 minutos)

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com Google
3. Clique em "Create API Key"
4. **Copie a chave** (começa com `AI...`)

### 2. Supabase (5 minutos)

1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Crie um novo projeto
4. Aguarde a criação (2-3 min)
5. Vá em **Settings** → **API**:
   - Copie a **URL** (VITE_SUPABASE_URL)
   - Copie a **anon key** (VITE_SUPABASE_ANON_KEY)
6. Vá em **SQL Editor** → Cole e execute o conteúdo de `supabase_rls_policies.sql`
7. **Pronto!**

---

## ⚡ Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar localmente
npm run dev

# Build de produção
npm run build

# Testar build localmente
npm run preview
```

---

## 🎯 Checklist Mínimo

Antes de fazer deploy, certifique-se:

- [x] Repositório no GitHub/GitLab/Bitbucket
- [x] API Key do Gemini obtida
- [x] Projeto Supabase criado
- [x] Script SQL executado no Supabase
- [x] Variáveis de ambiente configuradas

---

## 🐛 Problemas Comuns

### "Página em branco após deploy"
→ Verifique se as variáveis de ambiente estão configuradas corretamente

### "Erro ao conectar com Supabase"
→ Verifique se executou o script SQL (`supabase_rls_policies.sql`)

### "IA não responde"
→ Verifique se a API Key do Gemini está correta e tem créditos disponíveis

### "Build falhou"
→ Execute `npm install` e `npm run build` localmente para verificar erros

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **[DEPLOY.md](./DEPLOY.md)** - Guia completo de deploy
- **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** - Checklist detalhado
- **[README.md](./README.md)** - Documentação do projeto

---

## 💡 Dicas

1. **Vercel é mais rápido** para deploy automático
2. **Netlify oferece mais controle** sobre configurações
3. **Sempre teste localmente** antes de fazer deploy
4. **Use o modo preview** para testar mudanças antes de ir para produção
5. **Configure um domínio personalizado** após o primeiro deploy

---

## 🎉 Pronto para Deploy?

Se você tem todas as credenciais, pode fazer o deploy agora mesmo!

**Tempo estimado:** 5-10 minutos

**Boa sorte! 🚀**

---

**Precisa de ajuda?** Consulte o [DEPLOY.md](./DEPLOY.md) para instruções detalhadas.

