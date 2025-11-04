# ✅ Checklist de Deploy - Evolui App

Use este checklist para garantir que todos os passos foram seguidos antes do deploy.

## 📋 Pré-Deploy

### 1. Configuração Local
- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Projeto roda localmente sem erros (`npm run dev`)
- [ ] Build de produção funciona (`npm run build`)
- [ ] Preview da build funciona (`npm run preview`)

### 2. Variáveis de Ambiente
- [ ] Arquivo `.env.example` está atualizado
- [ ] Todas as variáveis necessárias estão documentadas
- [ ] `.env` não está no Git (verificar `.gitignore`)

### 3. Credenciais Obtidas

#### Gemini API
- [ ] Conta Google criada
- [ ] API Key do Gemini obtida em https://aistudio.google.com/app/apikey
- [ ] API Key testada localmente
- [ ] Limite de requisições verificado

#### Supabase
- [ ] Projeto Supabase criado
- [ ] URL do projeto copiada
- [ ] Anon Key copiada
- [ ] Script SQL executado (`supabase_rls_policies.sql`)
- [ ] Tabelas criadas corretamente
- [ ] RLS (Row Level Security) habilitado
- [ ] Autenticação configurada

### 4. Código
- [ ] Código commitado no Git
- [ ] Branch principal (main/master) atualizada
- [ ] Repositório está no GitHub/GitLab/Bitbucket
- [ ] Repositório é privado (se necessário)

## 🚀 Durante o Deploy

### Vercel ou Netlify
- [ ] Conta criada na plataforma escolhida
- [ ] Repositório conectado
- [ ] Framework detectado automaticamente (Vite)
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Node version: 18

### Variáveis de Ambiente na Plataforma
- [ ] `VITE_GEMINI_API_KEY` adicionada
- [ ] `GEMINI_API_KEY` adicionada
- [ ] `VITE_SUPABASE_URL` adicionada
- [ ] `VITE_SUPABASE_ANON_KEY` adicionada
- [ ] Todas as variáveis estão corretas (sem espaços extras)

## ✨ Pós-Deploy

### 1. Testes Básicos
- [ ] Site carrega sem erros
- [ ] Página de login aparece
- [ ] Console do navegador sem erros críticos
- [ ] Assets (CSS, JS, imagens) carregam corretamente

### 2. Funcionalidades Core
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] Dashboard carrega
- [ ] Dados são salvos no Supabase
- [ ] IA responde (Gemini)
- [ ] Tema claro/escuro funciona

### 3. Performance
- [ ] Site carrega em menos de 3 segundos
- [ ] Lighthouse score > 80
- [ ] Sem memory leaks visíveis
- [ ] Mobile funciona corretamente

### 4. Segurança
- [ ] HTTPS habilitado
- [ ] Variáveis de ambiente não expostas no código
- [ ] RLS do Supabase funcionando
- [ ] Apenas usuários autenticados acessam dados

## 🎯 Otimizações Opcionais

- [ ] Domínio customizado configurado
- [ ] Analytics instalado (Google Analytics, Vercel Analytics, etc.)
- [ ] Error tracking configurado (Sentry, etc.)
- [ ] CDN configurado para assets
- [ ] Cache headers otimizados
- [ ] Imagens otimizadas
- [ ] Meta tags SEO configuradas
- [ ] Favicon customizado
- [ ] PWA configurado (opcional)

## 🐛 Troubleshooting

Se algo não funcionar:

1. **Verificar logs de build**
   - [ ] Logs da plataforma sem erros
   - [ ] Todas as dependências instaladas
   - [ ] Build completado com sucesso

2. **Verificar variáveis de ambiente**
   - [ ] Todas estão configuradas
   - [ ] Valores corretos (copiar novamente se necessário)
   - [ ] Sem espaços extras ou caracteres especiais

3. **Verificar console do navegador**
   - [ ] Sem erros 404 (arquivos não encontrados)
   - [ ] Sem erros de CORS
   - [ ] Sem erros de API

4. **Verificar Supabase**
   - [ ] RLS policies corretas
   - [ ] Tabelas criadas
   - [ ] Conexão funcionando

5. **Redeployar**
   - [ ] Fazer um novo deploy
   - [ ] Limpar cache do navegador
   - [ ] Testar em modo anônimo

## 📞 Contatos de Suporte

- **Vercel:** https://vercel.com/support
- **Netlify:** https://www.netlify.com/support
- **Supabase:** https://supabase.com/docs
- **Gemini API:** https://ai.google.dev/docs

## 🎉 Deploy Completo!

Quando todos os itens estiverem marcados:

- [ ] Deploy em produção finalizado
- [ ] Testes realizados e aprovados
- [ ] URL de produção anotada
- [ ] Documentação atualizada
- [ ] Equipe notificada

---

**Próximos Passos:**
1. Monitorar logs e erros nos primeiros dias
2. Coletar feedback dos usuários
3. Implementar melhorias contínuas
4. Manter dependências atualizadas

**Parabéns pelo deploy! 🚀**

