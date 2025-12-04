# 🚀 Guia de Deploy - Evolui App

Este guia contém instruções detalhadas para fazer deploy da aplicação no **Vercel** ou **Netlify**.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com) ou [Netlify](https://netlify.com)
- Conta no [Supabase](https://supabase.com)
- API Key do [Google Gemini](https://aistudio.google.com/app/apikey)
- Git instalado
- Repositório do projeto no GitHub, GitLab ou Bitbucket

## 🔧 Configuração das Variáveis de Ambiente

Antes de fazer o deploy, você precisa configurar as seguintes variáveis de ambiente:

### Variáveis Necessárias:

1. **VITE_GEMINI_API_KEY** - Sua chave de API do Google Gemini
2. **GEMINI_API_KEY** - Mesma chave do Gemini (para compatibilidade)
3. **VITE_SUPABASE_URL** - URL do seu projeto Supabase
4. **VITE_SUPABASE_ANON_KEY** - Chave anônima do Supabase

### Como obter as credenciais:

#### Google Gemini API Key:
1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

#### Supabase Credentials:
1. Acesse seu projeto no [Supabase](https://supabase.com)
2. Vá em Settings > API
3. Copie a "Project URL" (VITE_SUPABASE_URL)
4. Copie a "anon public" key (VITE_SUPABASE_ANON_KEY)

---

## 🟢 Deploy no Vercel

### Método 1: Deploy via Dashboard (Recomendado)

1. **Acesse o Vercel Dashboard**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login ou crie uma conta

2. **Importe o Projeto**
   - Clique em "Add New..." > "Project"
   - Selecione seu repositório Git
   - O Vercel detectará automaticamente que é um projeto Vite

3. **Configure as Variáveis de Ambiente**
   - Na seção "Environment Variables", adicione:
     ```
     VITE_GEMINI_API_KEY=sua_chave_aqui
     GEMINI_API_KEY=sua_chave_aqui
     VITE_SUPABASE_URL=sua_url_supabase
     VITE_SUPABASE_ANON_KEY=sua_chave_supabase
     ```

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build finalizar (geralmente 1-2 minutos)
   - Seu app estará disponível em `https://seu-projeto.vercel.app`

### Método 2: Deploy via CLI

```bash
# Instale o Vercel CLI
npm i -g vercel

# Faça login
vercel login

# Na raiz do projeto, execute:
vercel

# Siga as instruções e adicione as variáveis de ambiente quando solicitado

# Para deploy em produção:
vercel --prod
```

### Configurar Variáveis de Ambiente no Vercel (via CLI):

```bash
vercel env add VITE_GEMINI_API_KEY
vercel env add GEMINI_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

---

## 🔵 Deploy no Netlify

### Método 1: Deploy via Dashboard (Recomendado)

1. **Acesse o Netlify Dashboard**
   - Vá para [netlify.com](https://netlify.com)
   - Faça login ou crie uma conta

2. **Importe o Projeto**
   - Clique em "Add new site" > "Import an existing project"
   - Conecte seu provedor Git (GitHub, GitLab, etc.)
   - Selecione seu repositório

3. **Configuração de Build**
   - O Netlify detectará automaticamente as configurações do `netlify.toml`
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Configure as Variáveis de Ambiente**
   - Vá em "Site settings" > "Environment variables"
   - Adicione as seguintes variáveis:
     ```
     VITE_GEMINI_API_KEY=sua_chave_aqui
     GEMINI_API_KEY=sua_chave_aqui
     VITE_SUPABASE_URL=sua_url_supabase
     VITE_SUPABASE_ANON_KEY=sua_chave_supabase
     ```

5. **Deploy**
   - Clique em "Deploy site"
   - Aguarde o build finalizar
   - Seu app estará disponível em `https://seu-projeto.netlify.app`

### Método 2: Deploy via CLI

```bash
# Instale o Netlify CLI
npm install -g netlify-cli

# Faça login
netlify login

# Na raiz do projeto, execute:
netlify init

# Siga as instruções

# Para deploy manual:
netlify deploy --prod
```

### Configurar Variáveis de Ambiente no Netlify (via CLI):

```bash
netlify env:set VITE_GEMINI_API_KEY "sua_chave_aqui"
netlify env:set GEMINI_API_KEY "sua_chave_aqui"
netlify env:set VITE_SUPABASE_URL "sua_url_aqui"
netlify env:set VITE_SUPABASE_ANON_KEY "sua_chave_aqui"
```

---

## 🔄 Deploy Automático (CI/CD)

Ambas as plataformas suportam deploy automático:

- **Vercel**: Deploy automático a cada push na branch principal
- **Netlify**: Deploy automático a cada push na branch principal

Para configurar:
1. Conecte seu repositório Git à plataforma
2. Configure as variáveis de ambiente
3. Cada commit na branch principal acionará um novo deploy automaticamente

---

## 🧪 Testar Localmente Antes do Deploy

Sempre teste localmente antes de fazer deploy:

```bash
# 1. Instale as dependências
npm install

# 2. Crie um arquivo .env com suas variáveis
cp .env.example .env
# Edite o arquivo .env com suas credenciais reais

# 3. Execute em modo desenvolvimento
npm run dev

# 4. Build de produção (teste local)
npm run build
npm run preview
```

---

## 🐛 Troubleshooting

### Erro: "VITE_ variables not found"
- Certifique-se de que todas as variáveis começam com `VITE_`
- Variáveis de ambiente devem ser configuradas na plataforma de deploy

### Erro de build: "Module not found"
- Execute `npm install` para garantir que todas as dependências estão instaladas
- Verifique se o arquivo `package.json` está correto

### Página em branco após deploy
- Verifique o console do navegador para erros
- Certifique-se de que as variáveis de ambiente estão configuradas corretamente
- Verifique se as credenciais do Supabase estão corretas

### Erro: "Failed to fetch"
- Verifique suas credenciais do Supabase
- Certifique-se de que as políticas RLS do Supabase estão configuradas corretamente

---

## 📝 Notas Importantes

1. **Segurança**: Nunca commite suas variáveis de ambiente (arquivo `.env`) no Git
2. **HTTPS**: Ambas as plataformas fornecem HTTPS automaticamente
3. **Domínio Customizado**: Você pode configurar um domínio próprio em ambas as plataformas
4. **Monitoramento**: Use as ferramentas de analytics e logs das plataformas para monitorar sua aplicação

---

## 🎯 Checklist de Deploy

- [ ] Repositório Git configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivo `.env.example` atualizado
- [ ] Build local testado com sucesso
- [ ] Credenciais Supabase obtidas
- [ ] API Key do Gemini obtida
- [ ] Deploy realizado
- [ ] Aplicação testada em produção
- [ ] Domínio customizado configurado (opcional)

---

## 🆘 Suporte

Se encontrar problemas:
- Vercel: [Documentação](https://vercel.com/docs)
- Netlify: [Documentação](https://docs.netlify.com)
- Supabase: [Documentação](https://supabase.com/docs)

---

**Desenvolvido com ❤️ para ajudar nos seus estudos!**

