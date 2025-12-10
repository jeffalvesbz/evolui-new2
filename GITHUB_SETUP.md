# 🚀 Como Enviar para o GitHub

Seu projeto já está inicializado como repositório Git e pronto para ser enviado ao GitHub!

## 📋 Passo a Passo

### 1. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Faça login na sua conta GitHub
3. Preencha:
   - **Repository name:** `evolui-app` (ou outro nome de sua escolha)
   - **Description:** `Plataforma de estudos inteligente com IA`
   - **Visibility:** 
     - ☑️ **Private** (recomendado - protege suas credenciais)
     - ☐ Public
4. **NÃO** marque "Initialize with README" (já temos um)
5. Clique em **"Create repository"**

### 2. Conectar ao Repositório Remoto

Copie o comando que o GitHub mostrará, ou use um destes formatos:

**Se você escolheu HTTPS:**
```bash
git remote add origin https://github.com/SEU_USUARIO/evolui-app.git
```

**Se você escolheu SSH:**
```bash
git remote add origin git@github.com:SEU_USUARIO/evolui-app.git
```

**Substitua `SEU_USUARIO` pelo seu username do GitHub!**

### 3. Enviar para o GitHub

```bash
# Enviar para o branch main
git branch -M main
git push -u origin main
```

Se pedir autenticação:
- **HTTPS:** Use um Personal Access Token (não sua senha)
- **SSH:** Certifique-se de ter a chave SSH configurada

---

## 🔐 Autenticação GitHub

### Se usar HTTPS (recomendado para iniciantes)

1. **Criar Personal Access Token:**
   - Acesse: https://github.com/settings/tokens
   - Clique em **"Generate new token (classic)"**
   - Dê um nome: `evolui-app-deploy`
   - Marque **`repo`** (acesso completo a repositórios)
   - Clique em **"Generate token"**
   - **COPIE o token** (você não verá novamente!)

2. **Ao fazer push, use o token como senha:**
   - Username: seu username do GitHub
   - Password: cole o Personal Access Token

### Se usar SSH

```bash
# Verificar se já tem chave SSH
ls -al ~/.ssh

# Se não tiver, criar uma:
ssh-keygen -t ed25519 -C "seu_email@exemplo.com"

# Adicionar ao ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub:
# https://github.com/settings/keys → New SSH key
```

---

## ✅ Comandos Completos (Copy & Paste)

```bash
# 1. Adicionar remote (SUBSTITUA pelo seu username)
git remote add origin https://github.com/SEU_USUARIO/evolui-app.git

# 2. Renomear branch para main
git branch -M main

# 3. Verificar remote
git remote -v

# 4. Enviar para GitHub
git push -u origin main
```

---

## 🔒 Segurança - Verificar Antes de Enviar

Certifique-se de que estes arquivos **NÃO** estão no Git:

```bash
# Verificar se .env está protegido
git ls-files | grep -E "\.env$|\.env\.local"

# Se aparecer algo, remova:
# git rm --cached .env.local
```

**✅ Arquivos que DEVEM estar no .gitignore:**
- `.env`
- `.env.local`
- `.env.production.local`
- `node_modules/`
- `dist/`

---

## 🎯 Próximos Passos Após Enviar

1. **Verificar no GitHub:**
   - Acesse seu repositório
   - Confirme que todos os arquivos aparecem
   - Verifique que `.env.local` NÃO está lá

2. **Conectar ao Vercel/Netlify:**
   - Vercel: https://vercel.com/new → Import Git Repository
   - Netlify: https://app.netlify.com/start → Import from Git

3. **Configurar variáveis de ambiente:**
   - Use as credenciais do arquivo `CREDENCIAIS_SUPABASE.md`
   - Adicione também a API Key do Gemini

---

## 🐛 Problemas Comuns

### "fatal: remote origin already exists"
```bash
# Remover e adicionar novamente
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/evolui-app.git
```

### "Permission denied"
- Verifique sua autenticação (Personal Token ou SSH)
- Para HTTPS: use Personal Access Token, não senha
- Para SSH: certifique-se de ter a chave adicionada no GitHub

### "Repository not found"
- Verifique se o nome do repositório está correto
- Verifique se você tem permissão (se for repositório de outro usuário)

---

## 📝 Comandos Git Úteis

```bash
# Ver status
git status

# Ver histórico
git log --oneline

# Ver diferenças
git diff

# Adicionar mudanças futuras
git add .
git commit -m "sua mensagem"
git push

# Verificar remote
git remote -v

# Mudar remote
git remote set-url origin https://github.com/NOVO_USUARIO/NOVO_REPO.git
```

---

## ✅ Checklist

- [ ] Repositório criado no GitHub
- [ ] Remote adicionado (`git remote add origin`)
- [ ] Branch renomeado para `main` (`git branch -M main`)
- [ ] Push realizado (`git push -u origin main`)
- [ ] Verificado que `.env.local` NÃO está no GitHub
- [ ] Repositório visível no GitHub
- [ ] Pronto para conectar ao Vercel/Netlify

---

**🎉 Pronto! Após seguir estes passos, seu código estará no GitHub!**

**📖 Depois disso, consulte [QUICKSTART.md](./QUICKSTART.md) para fazer o deploy!**

