# 🛠️ Guia de Administração: Liberar Acesso para Testers

Para liberar acesso aos recursos **Premium** ou **Pro** para usuários específicos (testers, parceiros, equipe) sem cobrar no Stripe, você deve manipular diretamente o banco de dados no Supabase.

## 🚀 Como liberar acesso por 10 dias

Criei um script pronto para uso em: `supabase/scripts/grant_premium_access.sql`.

### Passo a Passo

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard).
2. Entre no seu projeto.
3. No menu lateral esquerdo, clique em **SQL Editor** (ícone do terminal `>_`).
4. Clique em **New Query**.
5. Copie o conteúdo abaixo e cole no editor:

```sql
UPDATE public.profiles
SET 
    plan_type = 'premium',
    subscription_ends_at = NOW() + INTERVAL '10 days'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN (
        'email.do.tester@gmail.com',
        'outro.tester@hotmail.com'
    )
);
```

1. **Substitua os emails** pelos emails reais dos seus testers.
2. Clique em **Run** (botão verde).

---

## 📋 Detalhes Importantes

- **Validade:** O acesso expirará automaticamente após 10 dias (a data calculada).
- **Renovação:** Se quiser estender, basta rodar o comando novamente (os 10 dias contarão a partir do momento que rodar de novo).
- **Remoção:** Para remover o acesso imediatamente, execute:

```sql
UPDATE public.profiles
SET plan_type = 'free', subscription_ends_at = NULL
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'email@remover.com');
```

## 🔍 Como verificar quem tem acesso?

Rode este comando para listar todos os usuários Premium e a data de expiração:

```sql
SELECT u.email, p.plan_type, p.subscription_ends_at
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.plan_type = 'premium';
```
