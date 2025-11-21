# Como Tornar um Usuário Administrador

Este documento explica como conceder permissões de administrador a um usuário no sistema.

## 📋 Pré-requisitos

1. Acesso ao Dashboard do Supabase: https://supabase.com/dashboard
2. Acesso ao SQL Editor do Supabase
3. Email do usuário que será tornado admin

## 🚀 Passos para Tornar um Usuário Admin

### Opção 1: Via SQL Editor (Recomendado)

1. Acesse o **SQL Editor** no dashboard do Supabase
2. Execute o seguinte SQL, substituindo `'email@exemplo.com'` pelo email do usuário:

```sql
-- Tornar usuário admin pelo email
UPDATE profiles
SET is_admin = true
WHERE email = 'email@exemplo.com';
```

### Opção 2: Via SQL Editor (Pelo user_id)

Se você souber o `user_id` do usuário:

```sql
-- Tornar usuário admin pelo user_id
UPDATE profiles
SET is_admin = true
WHERE user_id = 'uuid-do-usuario-aqui';
```

### Opção 3: Verificar Usuários Admin

Para ver todos os usuários que são admin:

```sql
-- Listar todos os admins
SELECT user_id, name, email, is_admin
FROM profiles
WHERE is_admin = true;
```

### Opção 4: Remover Permissões de Admin

Para remover permissões de admin de um usuário:

```sql
-- Remover permissões de admin
UPDATE profiles
SET is_admin = false
WHERE email = 'email@exemplo.com';
```

## ⚠️ Importante

- **Segurança**: Apenas usuários com `is_admin = true` podem acessar as rotas `/admin/*`
- **Primeira Execução**: Após executar a migration `20241201_add_is_admin_to_profiles.sql`, todos os usuários terão `is_admin = false` por padrão
- **Verificação**: O sistema verifica automaticamente se o usuário é admin ao acessar rotas administrativas

## 🔒 Segurança

As políticas RLS (Row Level Security) foram atualizadas para verificar se o usuário é admin antes de permitir:
- Acesso à tabela `editais_default`
- Acesso à tabela `disciplinas_default`
- Acesso à tabela `topicos_default`
- Acesso à tabela `solicitacoes_editais`
- Acesso ao bucket de storage `editais`

Mesmo que alguém tente acessar diretamente o banco de dados, as políticas RLS impedirão o acesso se o usuário não for admin.

