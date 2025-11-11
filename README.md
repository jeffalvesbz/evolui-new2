<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 📚 Evolui: Planejador de Estudos Inteligente

Plataforma completa de estudos com acompanhamento de progresso para concursos e vestibulares.

## ✨ Funcionalidades

- ✍️ **Corretor de Redação com IA** - Correção detalhada de redações com análise completa
- 📊 **Gamificação** - Sistema de XP, níveis, conquistas e ranking semanal
- 🎯 **Ciclos de Estudo** - Método de estudo rotativo baseado em tempo
- 📝 **Caderno de Erros** - Registre e revise seus erros
- 🔄 **Revisões Espaçadas** - Sistema SRS (Spaced Repetition System)
- 📈 **Estatísticas Detalhadas** - Acompanhe seu progresso e performance
- 👥 **Sistema Social** - Adicione amigos e compare seu progresso
- 🎨 **Interface Moderna** - Design glassmorphism com temas claro e escuro

## 🚀 Executar Localmente

**Pré-requisitos:** Node.js 18+

1. **Clone o repositório e instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` e configure suas credenciais:
   - `VITE_GEMINI_API_KEY` - Sua chave de API do Google Gemini (opcional, apenas para correção de redação)
   - `VITE_SUPABASE_URL` - URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase

3. **Execute o app em modo desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse:** http://localhost:5173

## 📦 Build de Produção

Para criar uma build de produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

Para testar a build localmente:

```bash
npm run preview
```

## 🌐 Deploy

Este projeto está pronto para deploy no **Vercel** ou **Netlify**.

### Deploy Rápido

**Vercel:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

**Netlify:**
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

### Configuração Manual

Para instruções detalhadas de deploy, consulte o arquivo **[DEPLOY.md](./DEPLOY.md)** que inclui:

- Guia passo a passo para Vercel e Netlify
- Configuração de variáveis de ambiente
- Deploy via CLI
- Troubleshooting
- Best practices

## 🔑 Obtendo Credenciais

### Google Gemini API Key (Opcional - apenas para correção de redação)
1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login e clique em "Create API Key"
3. Copie a chave gerada
4. **Nota:** Esta chave é necessária apenas se você quiser usar o corretor de redação com IA

### Supabase
1. Crie um projeto em [Supabase](https://supabase.com)
2. Vá em Settings > API
3. Copie a "Project URL" e "anon public" key
4. Execute o script SQL disponível em `supabase_rls_policies.sql` no SQL Editor

## 🛠️ Tecnologias

- **Frontend:** React 19 + TypeScript + Vite
- **Estilização:** TailwindCSS com design glassmorphism
- **Estado:** Zustand para gerenciamento de estado
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **IA:** Google Gemini API (apenas para correção de redação)
- **Gráficos:** Recharts
- **Animações:** Framer Motion
- **Formulários:** React Hook Form
- **Datas:** date-fns

## 📁 Estrutura do Projeto

```
evoluiapp-main/
├── components/          # Componentes React
├── stores/             # Stores Zustand
├── services/           # Integração com APIs (Supabase, Gemini para redação)
├── hooks/              # Custom React Hooks
├── types/              # Definições TypeScript
├── utils/              # Funções utilitárias
├── data/               # Dados mockados
├── index.html          # HTML principal
├── App.tsx             # Componente raiz
├── vite.config.ts      # Configuração Vite
├── vercel.json         # Configuração Vercel
├── netlify.toml        # Configuração Netlify
└── DEPLOY.md           # Guia completo de deploy
```

## 🔒 Segurança

- Row Level Security (RLS) habilitado no Supabase
- Variáveis de ambiente protegidas
- Autenticação via Supabase Auth
- HTTPS obrigatório em produção

## 📝 Licença

Este projeto é privado e proprietário.

## 🤝 Suporte

Para dúvidas ou problemas:
- Consulte o [DEPLOY.md](./DEPLOY.md) para questões de deploy
- Verifique a documentação do [Supabase](https://supabase.com/docs)
- Para correção de redação, consulte a documentação do [Gemini API](https://ai.google.dev/docs)

---

**Desenvolvido com ❤️ para ajudar nos seus estudos!**
