# 🧪 Guia de Testes - Sistema de Monetização

## ✅ Sistema Configurado

- ✅ Stripe configurado com produtos PRO e PREMIUM
- ✅ Edge Functions deployadas
- ✅ Webhook configurado e ativo
- ✅ Limitações implementadas no código

---

## 🎯 Teste 1: Fluxo Completo de Checkout

### Passo a Passo

1. **Abra a aplicação:**

   ```
   http://localhost:5173
   ```

2. **Faça login** (ou crie uma conta)

3. **Acesse a página de pagamento:**
   - Clique em "Fazer Upgrade" ou "Ver Planos"
   - Ou acesse diretamente: `http://localhost:5173/pagamento`

4. **Selecione um plano:**
   - Escolha PRO ou PREMIUM
   - Escolha mensal ou anual
   - Clique em "Começar Teste Grátis de 3 Dias"

5. **Preencha o checkout do Stripe:**
   - **Cartão de teste:** `4242 4242 4242 4242`
   - **Data:** Qualquer data futura (ex: 12/25)
   - **CVC:** Qualquer 3 dígitos (ex: 123)
   - **CEP:** Qualquer CEP válido
   - **Nome:** Seu nome

6. **Confirme o pagamento**

7. **Verifique:**
   - ✅ Você deve ser redirecionado para `/dashboard?success=true`
   - ✅ Seu plano deve aparecer como PRO ou PREMIUM
   - ✅ O trial de 3 dias deve estar ativo

---

## 🔍 Teste 2: Verificar no Banco de Dados

### No Supabase Dashboard

1. **Acesse:** <https://supabase.com/dashboard/project/ilzbcfamqkfcochldtxn/editor>

2. **Verifique a tabela `profiles`:**

   ```sql
   SELECT 
     user_id, 
     name, 
     plan_type, 
     trial_ends_at, 
     subscription_status,
     stripe_customer_id
   FROM profiles
   WHERE user_id = 'seu_user_id';
   ```

   **Deve mostrar:**
   - `plan_type`: 'pro' ou 'premium'
   - `trial_ends_at`: Data 3 dias no futuro
   - `subscription_status`: 'trialing'
   - `stripe_customer_id`: Preenchido

3. **Verifique a tabela `subscriptions`:**

   ```sql
   SELECT * FROM subscriptions
   WHERE user_id = 'seu_user_id';
   ```

   **Deve ter um registro com:**
   - `status`: 'trialing'
   - `plan_type`: 'pro' ou 'premium'
   - `current_period_end`: Data no futuro

---

## 🧪 Teste 3: Verificar Limitações

### Teste as limitações por plano

1. **Usuário FREE (sem assinatura):**
   - ❌ Não pode criar mais de 1 edital
   - ❌ Não pode criar mais de 1 ciclo
   - ❌ Não pode usar correção de redação IA
   - ❌ Não pode acessar planejamento semanal

2. **Usuário PRO (com trial ou assinatura):**
   - ✅ Pode criar até 3 editais
   - ✅ Pode criar até 3 ciclos
   - ✅ Pode usar 10 correções IA/mês
   - ✅ Pode acessar planejamento semanal
   - ❌ Não pode usar OCR

3. **Usuário PREMIUM:**
   - ✅ Editais ilimitados
   - ✅ Ciclos ilimitados
   - ✅ Correções IA ilimitadas
   - ✅ Pode usar OCR
   - ✅ Todos os recursos

---

## 📊 Teste 4: Verificar Webhook

### No Stripe Dashboard

1. **Acesse:** <https://dashboard.stripe.com/test/webhooks>

2. **Clique no webhook criado** (`sophisticated-spark`)

3. **Vá na aba "Recent deliveries"**

4. **Verifique os eventos:**
   - ✅ `checkout.session.completed` - Status 200
   - ✅ `customer.subscription.created` - Status 200
   - ✅ `invoice.payment_succeeded` - Status 200

5. **Se houver erros (status 400 ou 500):**
   - Clique no evento
   - Veja o erro na seção "Response"
   - Verifique os logs: `supabase functions logs stripe-webhook`

---

## 🔄 Teste 5: Gerenciar Assinatura

### Customer Portal

1. **Na aplicação, crie um botão para abrir o portal:**

   ```typescript
   import { createPortalSession } from '../services/stripeService';
   
   <button onClick={() => createPortalSession()}>
     Gerenciar Assinatura
   </button>
   ```

2. **Clique no botão**

3. **Você deve ser redirecionado para o Stripe Customer Portal**

4. **Teste:**
   - ✅ Cancelar assinatura
   - ✅ Atualizar método de pagamento
   - ✅ Ver histórico de faturas

---

## 🎴 Cartões de Teste do Stripe

### Sucesso

- **Cartão:** `4242 4242 4242 4242`
- **Descrição:** Pagamento bem-sucedido

### Falha

- **Cartão:** `4000 0000 0000 0002`
- **Descrição:** Cartão recusado

### 3D Secure

- **Cartão:** `4000 0025 0000 3155`
- **Descrição:** Requer autenticação 3D Secure

---

## 📋 Checklist de Testes

- [ ] Checkout completo funciona
- [ ] Usuário é redirecionado corretamente
- [ ] Dados salvos no banco (profiles e subscriptions)
- [ ] Webhook recebe eventos (status 200)
- [ ] Limitações FREE funcionam
- [ ] Limitações PRO funcionam
- [ ] Limitações PREMIUM funcionam
- [ ] Trial de 3 dias está ativo
- [ ] Customer Portal abre corretamente
- [ ] Cancelamento funciona

---

## 🐛 Troubleshooting

### Erro: "Stripe não foi carregado"

- Verifique se `VITE_STRIPE_PUBLISHABLE_KEY` está no `.env.local`
- Reinicie o servidor: `npm run dev`

### Erro: "Price ID não configurado"

- Verifique se todos os 4 Price IDs estão no `.env.local`
- Confirme que os IDs estão corretos no Stripe Dashboard

### Webhook retorna erro 400

- Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
- Re-deploy: `supabase functions deploy stripe-webhook`

### Dados não aparecem no banco

- Verifique os logs: `supabase functions logs stripe-webhook`
- Confirme que o webhook está recebendo eventos no Stripe Dashboard

---

## 🎉 Próximos Passos

Após os testes:

1. ✅ Implementar gatilhos de upgrade na UI
2. ✅ Adicionar badges de plano
3. ✅ Criar página de gerenciamento de assinatura
4. ✅ Implementar email notifications
5. ✅ Preparar para produção (chaves live)

---

**Boa sorte com os testes! 🚀**
