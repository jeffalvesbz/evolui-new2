# 🚀 Guia de Deploy - Supabase Edge Functions

## Pré-requisitos

1. **Instalar Supabase CLI:**

```bash
# Windows (usando Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou usando npm
npm install -g supabase
```

2. **Login no Supabase:**

```bash
supabase login
```

---

## Passo 1: Linkar o Projeto

```bash
cd "c:\Users\Jefferson Alves\Downloads\evolui-new2-main (1)\evolui-new4-main"

# Linkar com seu projeto Supabase
supabase link --project-ref ilzbcfamqkfcochldtxn
```

---

## Passo 2: Configurar Secrets

As Edge Functions precisam de variáveis de ambiente secretas:

```bash
# Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_sua_chave_aqui

# Stripe Webhook Secret (obter depois de criar o webhook)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui

# Supabase Service Role Key (obter no dashboard)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**Como obter o Service Role Key:**

1. Acesse: <https://supabase.com/dashboard/project/ilzbcfamqkfcochldtxn/settings/api>
2. Copie a chave "service_role" (⚠️ NUNCA exponha essa chave no frontend!)

---

## Passo 3: Deploy das Functions

```bash
# Deploy de todas as functions de uma vez
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

Ou deploy individual:

```bash
# Deploy apenas uma function
supabase functions deploy create-checkout-session
```

---

## Passo 4: Configurar Webhook no Stripe

1. **Acesse:** <https://dashboard.stripe.com/test/webhooks>

2. **Clique em "Add endpoint"**

3. **Configure:**
   - **Endpoint URL:** `https://ilzbcfamqkfcochldtxn.supabase.co/functions/v1/stripe-webhook`
   - **Events to send:**
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`

4. **Copie o "Signing secret"** (começa com `whsec_`)

5. **Configure o secret:**

   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_copiado_aqui
   ```

---

## Passo 5: Testar as Functions

### Testar Localmente (Opcional)

```bash
# Iniciar servidor local
supabase functions serve

# Testar create-checkout-session
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"priceId":"price_xxx","userId":"user-id","planType":"pro","billingPeriod":"monthly"}'
```

### Testar em Produção

1. Abra a aplicação
2. Clique em "Fazer Upgrade"
3. Selecione um plano
4. Clique em "Começar Teste Grátis"
5. Você deve ser redirecionado para o Stripe Checkout

---

## Passo 6: Verificar Logs

```bash
# Ver logs em tempo real
supabase functions logs stripe-webhook --follow

# Ver logs de uma function específica
supabase functions logs create-checkout-session
```

Ou no dashboard:
<https://supabase.com/dashboard/project/ilzbcfamqkfcochldtxn/logs/edge-functions>

---

## 🔧 Troubleshooting

### Erro: "Function not found"

- Verifique se fez o deploy: `supabase functions list`
- Re-deploy: `supabase functions deploy nome-da-function`

### Erro: "Missing environment variable"

- Verifique os secrets: `supabase secrets list`
- Configure novamente: `supabase secrets set CHAVE=valor`

### Webhook não está funcionando

1. Verifique se o webhook está ativo no Stripe
2. Verifique se a URL está correta
3. Verifique os logs: `supabase functions logs stripe-webhook`
4. Teste o webhook no Stripe Dashboard (Send test webhook)

---

## 📋 Checklist de Deploy

- [ ] Supabase CLI instalado
- [ ] Projeto linkado (`supabase link`)
- [ ] Secrets configurados (STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Functions deployed
- [ ] Webhook criado no Stripe
- [ ] STRIPE_WEBHOOK_SECRET configurado
- [ ] Testado fluxo de checkout
- [ ] Verificado logs sem erros

---

## 🆘 Precisa de Ajuda?

Se encontrar algum erro, me avise e posso ajudar a debugar!
