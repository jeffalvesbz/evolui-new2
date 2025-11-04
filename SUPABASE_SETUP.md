# Configuração do Supabase - Políticas RLS

Este documento explica como configurar as políticas de segurança (RLS) no Supabase para o projeto Evolui.

## 📋 Pré-requisitos

1. Acesso ao Dashboard do Supabase: https://supabase.com/dashboard
2. Projeto Supabase criado e configurado
3. URL e chave anon do projeto já configuradas no código

## 🚀 Como Aplicar as Políticas RLS

### Passo 1: Acessar o SQL Editor

1. Acesse o dashboard do Supabase
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### Passo 2: Executar o Script

1. Abra o arquivo `supabase_rls_policies.sql` neste projeto
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### Passo 3: Verificar se as Políticas Foram Criadas

1. No menu lateral, vá em **Authentication** > **Policies**
2. Ou vá em **Table Editor** e clique em qualquer tabela
3. Verifique se há políticas RLS ativas (ícone de escudo)

## 🔒 O que as Políticas Fazem?

As políticas RLS garantem que:

- ✅ Usuários só podem ver e editar seus próprios dados
- ✅ Badges são públicos (todos podem ver)
- ✅ Amigos podem ver perfis e XP para ranking
- ✅ Todas as operações requerem autenticação

## ⚠️ Resolução de Problemas

### Erro: "permission denied"

Se ainda receber erros 400 ou "permission denied":

1. **Verifique se RLS está habilitado:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Verifique se as políticas foram criadas:**
   ```sql
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Verifique se o usuário está autenticado:**
   - Certifique-se de que o usuário fez login antes de fazer queries
   - Verifique o token de autenticação no Supabase

### Erro: "relation does not exist"

Se uma tabela não existir:

1. Verifique se todas as tabelas foram criadas no banco
2. Execute o script de criação de tabelas primeiro (se houver)

### Limpar e Recriar Políticas

Se precisar recriar todas as políticas:

```sql
-- Remover todas as políticas existentes (CUIDADO!)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;
```

Depois execute novamente o script `supabase_rls_policies.sql`.

## 📝 Notas Importantes

1. **Autenticação é obrigatória**: Todas as queries requerem usuário autenticado
2. **Isolamento de dados**: Cada usuário só vê seus próprios dados
3. **Performance**: As políticas são avaliadas em cada query, mas são otimizadas pelo PostgreSQL

## 🔗 Recursos

- [Documentação RLS do Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Guia de Políticas RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)


