# 🛠️ Comandos Úteis - Evolui App

Referência rápida de todos os comandos úteis para desenvolvimento e deploy.

## 📦 NPM Scripts

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento (localhost:5173)
npm run dev

# Build de produção
npm run build

# Build de produção (modo explícito)
npm run build:production

# Testar build localmente (localhost:4173)
npm run preview

# Ou com porta customizada
npm run serve
```

## 🚀 Deploy - Vercel

### Via Dashboard
1. Acesse https://vercel.com
2. Import project → Selecione repositório
3. Configure environment variables
4. Deploy

### Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy em preview
vercel

# Deploy em produção
vercel --prod

# Configurar variável de ambiente
vercel env add VITE_GEMINI_API_KEY
vercel env add GEMINI_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Listar variáveis de ambiente
vercel env ls

# Ver logs
vercel logs

# Remover projeto
vercel remove
```

## 🌐 Deploy - Netlify

### Via Dashboard
1. Acesse https://netlify.com
2. Add new site → Import project
3. Configure environment variables
4. Deploy

### Via CLI
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Fazer login
netlify login

# Inicializar projeto
netlify init

# Deploy em preview
netlify deploy

# Deploy em produção
netlify deploy --prod

# Configurar variável de ambiente
netlify env:set VITE_GEMINI_API_KEY "sua_chave"
netlify env:set GEMINI_API_KEY "sua_chave"
netlify env:set VITE_SUPABASE_URL "sua_url"
netlify env:set VITE_SUPABASE_ANON_KEY "sua_chave"

# Listar variáveis de ambiente
netlify env:list

# Ver logs
netlify logs

# Abrir dashboard
netlify open
```

## 🗄️ Supabase

### Setup Inicial
```bash
# Instalar Supabase CLI (opcional)
npm install -g supabase

# Login
supabase login

# Inicializar projeto
supabase init

# Link com projeto remoto
supabase link --project-ref your-project-ref

# Aplicar migrações
supabase db push
```

### Comandos SQL (via Dashboard)
```sql
-- Executar o script de setup
-- Cole o conteúdo de supabase_rls_policies.sql no SQL Editor

-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 🔑 Git & GitHub

### Comandos Básicos
```bash
# Verificar status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "Preparar para deploy"

# Push para repositório
git push origin main

# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Merge branch
git checkout main
git merge feature/nova-funcionalidade

# Ver histórico
git log --oneline
```

## 🧪 Testes & Debug

### Desenvolvimento Local
```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Verificar versões
node --version
npm --version

# Build com debug
npm run build -- --debug

# Preview com porta específica
npx vite preview --port 3000
```

### Verificar Build
```bash
# Tamanho do build
du -sh dist

# Listar arquivos do build
ls -lah dist

# Ver estrutura do build
tree dist
```

## 📊 Análise & Performance

### Lighthouse (Chrome DevTools)
```bash
# Instalar Lighthouse CLI
npm install -g lighthouse

# Rodar análise
lighthouse https://seu-site.vercel.app --view

# Análise específica
lighthouse https://seu-site.vercel.app \
  --only-categories=performance,accessibility,seo \
  --output=html \
  --output-path=./lighthouse-report.html
```

### Bundle Analysis
```bash
# Instalar analisador
npm install -D rollup-plugin-visualizer

# Adicionar ao vite.config.ts:
# import { visualizer } from 'rollup-plugin-visualizer'
# plugins: [react(), visualizer()]

# Gerar análise
npm run build

# Arquivo gerado: stats.html
```

## 🔍 Monitoramento

### Vercel
```bash
# Ver deployments
vercel ls

# Ver logs de um deployment
vercel logs [deployment-url]

# Ver informações do projeto
vercel inspect

# Ver domains
vercel domains ls
```

### Netlify
```bash
# Ver sites
netlify sites:list

# Status do site
netlify status

# Ver builds
netlify builds:list

# Ver logs
netlify logs
```

## 🌍 Variáveis de Ambiente

### Criar arquivo .env local
```bash
# Copiar template
cp .env.example .env

# Editar (use seu editor preferido)
nano .env
# ou
code .env
# ou
vim .env
```

### Validar variáveis
```bash
# Ver variáveis disponíveis
cat .env

# Verificar se variáveis foram carregadas (no código)
# console.log(import.meta.env)
```

## 🐛 Troubleshooting

### Limpar tudo e recomeçar
```bash
# Limpar node_modules
rm -rf node_modules

# Limpar cache
rm -rf .cache dist

# Limpar package-lock
rm package-lock.json

# Reinstalar
npm install

# Testar
npm run dev
```

### Verificar portas em uso
```bash
# Mac/Linux
lsof -i :5173
lsof -i :4173

# Windows
netstat -ano | findstr :5173
```

### Kill processo em porta específica
```bash
# Mac/Linux
kill -9 $(lsof -t -i:5173)

# Windows
taskkill /PID [PID] /F
```

## 📚 Documentação Rápida

### Ver documentação
```bash
# README
cat README.md

# Deploy completo
cat DEPLOY.md

# Quickstart
cat QUICKSTART.md

# Checklist
cat DEPLOY_CHECKLIST.md

# Este arquivo
cat COMMANDS.md
```

## 🔐 Segurança

### Verificar secrets expostos
```bash
# Buscar por possíveis secrets no código
grep -r "API_KEY" . --exclude-dir=node_modules
grep -r "password" . --exclude-dir=node_modules
grep -r "secret" . --exclude-dir=node_modules

# Verificar .env não está no git
git ls-files | grep .env
# (Não deve retornar nada)
```

## 📱 Mobile Testing

### Testar em dispositivos móveis
```bash
# Rodar com acesso externo
npm run dev -- --host

# Acessar via IP local (ex: http://192.168.1.100:5173)
# Use seu celular na mesma rede WiFi
```

## 🎨 Produtividade

### Aliases úteis (adicione ao .bashrc ou .zshrc)
```bash
alias dev="npm run dev"
alias build="npm run build"
alias preview="npm run preview"
alias deploy="vercel --prod"
alias logs="vercel logs"
```

## 📖 Referências Externas

```bash
# Abrir documentações
open https://vercel.com/docs
open https://docs.netlify.com
open https://supabase.com/docs
open https://ai.google.dev/docs
open https://vitejs.dev/guide
```

---

## 💡 Dicas Rápidas

1. **Use aliases** para economizar tempo
2. **Sempre teste localmente** antes de fazer deploy
3. **Mantenha .env fora do Git**
4. **Use preview deployments** para testar mudanças
5. **Monitore logs** após cada deploy

---

## 🆘 Comandos de Emergência

```bash
# Rollback no Vercel
vercel rollback [deployment-url]

# Rollback no Netlify
netlify rollback

# Deletar deployment no Vercel
vercel remove [deployment-url]

# Stop build no Netlify
netlify build:stop
```

---

**Salve este arquivo para referência futura! 📌**

