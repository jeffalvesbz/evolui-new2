# Configuração de Variáveis de Ambiente

Este documento explica como configurar as variáveis de ambiente para a aplicação.

## 📋 Criar arquivo .env

1. Crie um arquivo `.env` na raiz do projeto
2. Adicione sua chave da API do Gemini

```bash
# Criar o arquivo .env
touch .env
```

## 🔑 Conteúdo do arquivo .env

Adicione o seguinte conteúdo ao arquivo `.env`:

```env
# Gemini AI API Key
# Obtenha sua chave em: https://aistudio.google.com/apikey
GEMINI_API_KEY=sua_chave_aqui
```

**Ou use com prefixo VITE_** (para acesso no cliente):

```env
VITE_GEMINI_API_KEY=sua_chave_aqui
```

## 🎯 Como obter a chave da API

1. Acesse: https://aistudio.google.com/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada
5. Cole no arquivo `.env`

## 🔒 Segurança

**IMPORTANTE:**
- ✅ O arquivo `.env` está no `.gitignore` (não será commitado)
- ❌ NUNCA commite chaves de API no Git
- ✅ Use `.env` apenas para desenvolvimento local
- ✅ Em produção, use variáveis de ambiente do servidor

## 🚀 Como usar na aplicação

O Vite automaticamente carrega as variáveis do `.env`:

```typescript
// No código TypeScript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// ou
const apiKey = process.env.GEMINI_API_KEY;
```

Já está configurado em `services/geminiService.ts`.

## ✅ Verificar se está funcionando

Após criar o `.env`:

1. Reinicie o servidor de desenvolvimento
2. As funcionalidades de IA devem funcionar:
   - Correção de redação
   - Geração de mensagens motivacionais
   - Sugestão de ciclos de estudo

## 📝 Exemplo completo do arquivo .env

```env
# ===========================================
# VARIÁVEIS DE AMBIENTE
# ===========================================

# Gemini AI API Key (obrigatória para funcionalidades de IA)
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase (já configurado no código, mas pode sobrescrever aqui)
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# ===========================================
# NOTAS:
# - Variáveis com prefixo VITE_ são acessíveis no cliente
# - Variáveis sem prefixo são apenas server-side
# - Nunca commite este arquivo no Git
# ===========================================
```

## 🔄 Reiniciar após mudanças

Sempre que alterar o `.env`, reinicie o servidor:

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

## ⚠️ Problemas comuns

### Erro: "An API Key must be set when running in a browser"

**Solução:**
1. Verifique se o arquivo `.env` existe
2. Verifique se a variável `GEMINI_API_KEY` está definida
3. Reinicie o servidor de desenvolvimento

### A API Key não está sendo lida

**Solução:**
1. Use `VITE_GEMINI_API_KEY` (com prefixo) para acesso no cliente
2. Ou use `GEMINI_API_KEY` (sem prefixo) - já configurado no `vite.config.ts`

## 📚 Mais informações

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google AI Studio](https://aistudio.google.com)

