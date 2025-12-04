# 🚀 Enviar para GitHub - Guia Rápido

## ⚡ Método Rápido (Recomendado)

### 1. Execute o script automatizado:

```bash
bash enviar-github.sh
```

O script vai perguntar:
- Seu username do GitHub
- Nome do repositório
- E fazer tudo automaticamente!

---

## 📋 Método Manual (Passo a Passo)

### Passo 1: Criar Repositório no GitHub

1. Acesse: **https://github.com/new**
2. Preencha:
   - **Repository name:** `evolui-app` (ou outro nome)
   - **Description:** `Plataforma de estudos inteligente com IA`
   - **Visibility:** ☑️ **Private** (recomendado)
3. **NÃO** marque "Initialize with README"
4. Clique em **"Create repository"**

### Passo 2: Copiar a URL do Repositório

O GitHub mostrará uma URL assim:
```
https://github.com/SEU_USUARIO/evolui-app.git
```

### Passo 3: Executar Comandos

```bash
# Adicionar remote (COLE A URL DO PASSO 2)
git remote add origin https://github.com/SEU_USUARIO/evolui-app.git

# Renomear branch
git branch -M main

# Enviar para GitHub
git push -u origin main
```

---

## 🔐 Autenticação

### Se pedir usuário/senha:

**⚠️ IMPORTANTE:** Não use sua senha do GitHub!

Use um **Personal Access Token**:

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token (classic)"**
3. Nome: `evolui-app-deploy`
4. Marque: **`repo`** (acesso completo)
5. Clique em **"Generate token"**
6. **COPIE o token** (você não verá novamente!)
7. Use o token como senha ao fazer push

---

## ✅ Verificar se Funcionou

Após o push, acesse:
```
https://github.com/SEU_USUARIO/evolui-app
```

Você deve ver todos os arquivos do projeto!

---

## 🐛 Problemas?

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/evolui-app.git
```

### "Permission denied"
- Use Personal Access Token, não senha
- Verifique se o token tem permissão `repo`

### "Repository not found"
- Verifique se o repositório existe no GitHub
- Verifique se o nome está correto

---

## 📚 Mais Detalhes

Para instruções mais detalhadas, consulte:
- **[GITHUB_SETUP.md](./GITHUB_SETUP.md)** - Guia completo

---

**🎉 Pronto! Após enviar, conecte ao Vercel/Netlify para fazer deploy!**

