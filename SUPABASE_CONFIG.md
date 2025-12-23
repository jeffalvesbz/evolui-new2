# 🔐 Configuração Obrigatória de Autenticação (Supabase)

Para que a redefinição de senha funcione corretamente, você **PRECISA** configurar as URLs de redirecionamento no painel do Supabase. Sem isso, o usuário será sempre redirecionado para a página inicial, causando o problema de "logar sem mostrar a tela de reset".

## 🚨 Passo a Passo Crítico

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard).
2. Selecione seu projeto.
3. No menu lateral esquerdo, vá em **Authentication** -> **URL Configuration**.

### 1. Site URL

Certifique-se de que o **Site URL** é a URL principal da sua aplicação (onde o usuário deve cair por padrão).

- Produção: `https://meueleva.com`
- Desenvolvimento: `http://localhost:5173` (se estiver testando localmente)

### 2. Redirect URLs (Allow List) - IMPORTANTE

Você **DEVE** adicionar explicitamente a rota de redefinição de senha aqui. O Supabase bloqueia redirecionamentos para URLs que não estão nesta lista por segurança.

Adicione as seguintes URLs (clique em "Add URL"):

**Para Produção:**

- `https://meueleva.com/reset-password`
- `https://meueleva.com/dashboard`
- `https://meueleva.com/**` (Opcional, curinga para todas as rotas)

**Para Desenvolvimento (Localhost):**

- `http://localhost:5173/reset-password`
- `http://localhost:5173/dashboard`

---

## ❓ Por que isso é necessário?

Quando enviamos o email de redefinição, passamos o parâmetro `redirectTo` no código:

```typescript
redirectTo: `https://meueleva.com/reset-password`
```

Se essa URL **não estiver na lista "Redirect URLs"** do Supabase, ele ignora nosso pedido e usa o **Site URL** (que geralmente é a home `/`).

Isso faz com que o usuário caia na home com o token. Nosso código tenta detectar isso, mas a configuração correta no Supabase é a solução definitiva e oficial.
