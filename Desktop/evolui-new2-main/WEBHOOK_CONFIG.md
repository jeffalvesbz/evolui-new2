# ⚡ Configuração do Webhook do Stripe

## ✅ Edge Functions Deployadas

- ✅ create-checkout-session
- ✅ create-portal-session  
- ✅ stripe-webhook

---

## 🔗 Configurar Webhook no Stripe

### Passo 1: Acessar Webhooks

Acesse: <https://dashboard.stripe.com/test/webhooks>

### Passo 2: Adicionar Endpoint

1. Clique em **"Add endpoint"** ou **"+ Adicionar endpoint"**

2. **Endpoint URL:**

   ```
   https://ilzbcfamqkfcochldtxn.supabase.co/functions/v1/stripe-webhook
   ```

3. **Description (opcional):**

   ```
   Evolui - Webhook de Assinaturas
   ```

### Passo 3: Selecionar Eventos

Na seção "Select events to listen to", adicione estes eventos:

**Checkout:**

- ✅ `checkout.session.completed`

**Customer Subscription:**

- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

**Invoice:**

- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Passo 4: Salvar e Copiar o Signing Secret

1. Clique em **"Add endpoint"**
2. Na página do webhook criado, clique em **"Reveal"** no "Signing secret"
3. Copie o secret (começa com `whsec_`)

### Passo 5: Configurar o Secret no Supabase

Execute no PowerShell:

```powershell
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
```

### Passo 6: Re-deploy da Webhook Function

```powershell
supabase functions deploy stripe-webhook
```

---

## 🧪 Testar o Webhook

### Opção 1: Teste no Dashboard do Stripe

1. Na página do webhook, clique em **"Send test webhook"**
2. Selecione um evento (ex: `customer.subscription.created`)
3. Clique em **"Send test webhook"**
4. Verifique se o status é **"succeeded"** (200)

### Opção 2: Teste Real

1. Abra sua aplicação: <http://localhost:5173>
2. Faça login
3. Clique em "Fazer Upgrade" ou "Ver Planos"
4. Selecione um plano e clique em "Começar Teste Grátis"
5. Use um cartão de teste do Stripe:
   - **Número:** 4242 4242 4242 4242
   - **Data:** Qualquer data futura
   - **CVC:** Qualquer 3 dígitos
   - **CEP:** Qualquer CEP

---

## 📊 Verificar Logs

### No Supabase

```powershell
supabase functions logs stripe-webhook --follow
```

Ou acesse: <https://supabase.com/dashboard/project/ilzbcfamqkfcochldtxn/logs/edge-functions>

### No Stripe

Acesse: <https://dashboard.stripe.com/test/webhooks>

- Clique no webhook criado
- Veja a aba "Recent deliveries"

---

## ✅ Checklist Final

- [ ] Webhook criado no Stripe
- [ ] URL configurada: `https://ilzbcfamqkfcochldtxn.supabase.co/functions/v1/stripe-webhook`
- [ ] 6 eventos selecionados
- [ ] Signing secret copiado
- [ ] Secret configurado no Supabase
- [ ] Webhook function re-deployada
- [ ] Teste realizado com sucesso

---

## 🎯 Próximos Passos

Após configurar o webhook:

1. ✅ Testar fluxo completo de checkout
2. ✅ Verificar se a assinatura é criada no banco
3. ✅ Testar cancelamento de assinatura
4. ✅ Implementar gatilhos de upgrade na UI

---

**Está quase pronto! 🚀**
