# 🗄️ Setup Completo do Banco de Dados

Este documento explica como recriar o banco de dados do zero usando o script SQL completo.

## 📋 Pré-requisitos

1. Acesso ao Dashboard do Supabase: https://supabase.com/dashboard
2. Projeto Supabase criado e configurado
3. Permissões de administrador no projeto

## 🚀 Como Executar

### Opção 1: Recriar do Zero (Recomendado para desenvolvimento)

**⚠️ ATENÇÃO: Isso apagará TODOS os dados existentes!**

1. Abra o arquivo `database_schema_complete.sql`
2. Descomente a seção de limpeza no início do arquivo (linhas 11-16):
   ```sql
   DROP SCHEMA IF EXISTS public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```
3. Acesse o SQL Editor no Supabase Dashboard
4. Copie TODO o conteúdo do arquivo `database_schema_complete.sql`
5. Cole no SQL Editor
6. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### Opção 2: Aplicar em Banco Existente (Sem perder dados)

Se você já tem dados e quer apenas garantir que a estrutura está correta:

1. Abra o arquivo `database_schema_complete.sql`
2. **NÃO descomente** a seção de limpeza
3. Execute o script normalmente
4. O script usará `CREATE TABLE IF NOT EXISTS` e `DROP POLICY IF EXISTS`, então é seguro executar múltiplas vezes

## ✅ O que o Script Cria

### 1. Enums (Tipos Enumerados)
- `xp_log_event` - Eventos que geram XP
- `revisao_status` - Status das revisões
- `nivel_dificuldade` - Níveis de dificuldade
- `origem_revisao` - Origem das revisões
- `friendship_status` - Status de amizades
- `estilo_flashcard` - Estilos de flashcards

### 2. Tabelas (16 tabelas)
- `profiles` - Perfis de usuários
- `badges` - Badges/conquistas
- `user_badges` - Badges desbloqueados
- `xp_log` - Log de eventos de XP
- `study_plans` - Planos de estudo
- `disciplinas` - Disciplinas
- `topicos` - Tópicos
- `sessoes_estudo` - Sessões de estudo
- `revisoes` - Revisões agendadas
- `flashcards` - Flashcards
- `caderno_erros` - Caderno de erros
- `simulados` - Simulados
- `redacoes_corrigidas` - Redações corrigidas
- `ciclos` - Ciclos de estudos
- `sessoes_ciclo` - Sessões de ciclo
- `friendships` - Amizades

### 3. Índices
- Índices otimizados para consultas frequentes
- Índices parciais para filtros comuns

### 4. Segurança (RLS)
- Row Level Security habilitado em todas as tabelas
- Políticas de segurança configuradas
- Usuários só acessam seus próprios dados

## 🔍 Verificação

Após executar o script, verifique se tudo foi criado corretamente:

### 1. Verificar Tabelas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Verificar Enums
```sql
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
ORDER BY typname;
```

### 3. Verificar Políticas RLS
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 4. Verificar Índices
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 🔄 Gerar Tipos TypeScript

Após criar o banco, gere os tipos TypeScript:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Vincular projeto
supabase link --project-ref <seu-project-ref>

# Gerar tipos
supabase gen types typescript --linked > types/supabase.ts
```

## 📝 Estrutura do Schema

```
profiles (usuários)
├── study_plans (planos de estudo)
│   ├── disciplinas
│   │   └── topicos
│   │       ├── sessoes_estudo
│   │       ├── revisoes
│   │       └── flashcards
│   ├── caderno_erros
│   ├── simulados
│   ├── redacoes_corrigidas
│   └── ciclos
│       └── sessoes_ciclo
├── user_badges
├── xp_log
└── friendships
```

## ⚠️ Resolução de Problemas

### Erro: "relation already exists"
- Isso é normal se as tabelas já existirem
- O script usa `IF NOT EXISTS`, então é seguro executar novamente
- Se quiser recriar tudo, descomente a seção de limpeza

### Erro: "permission denied"
- Verifique se você tem permissões de administrador
- Certifique-se de estar executando no SQL Editor do Supabase

### Erro: "enum already exists"
- O script usa `DROP TYPE IF EXISTS`, então deve funcionar
- Se persistir, execute manualmente: `DROP TYPE xp_log_event CASCADE;`

### Políticas RLS não funcionando
- Verifique se RLS está habilitado: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- Verifique se o usuário está autenticado antes de fazer queries

## 📚 Documentação Adicional

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase TypeScript Types](https://supabase.com/docs/reference/javascript/typescript-support)

## 🎯 Próximos Passos

1. ✅ Executar o script de criação
2. ✅ Verificar se todas as tabelas foram criadas
3. ✅ Testar as políticas RLS
4. ✅ Gerar tipos TypeScript
5. ✅ Testar a aplicação com o novo schema

---

**Criado em:** 2024  
**Versão do Schema:** 1.0.0  
**Última atualização:** Recriação completa do zero

