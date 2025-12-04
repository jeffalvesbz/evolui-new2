# 🔑 Guia de Configuração - Chaves do Stripe

## Passo 1: Obter as Chaves de API

### 1.1 Chaves Publishable e Secret

1. Acesse: <https://dashboard.stripe.com/test/apikeys>
2. Você verá duas chaves:
   - **Publishable key** (começa com `pk_test_`)
   - **Secret key** (começa com `sk_test_`) - clique em "Reveal test key"

3. Copie ambas as chaves

### 1.2 Obter os Price IDs dos Produtos

1. Acesse: <https://dashboard.stripe.com/test/products>
2. Clique no produto **PRO**
3. Na seção "Pricing", você verá dois preços:
   - **Mensal (R$ 29,00)** - copie o ID (começa com `price_`)
   - **Anual (R$ 240,00)** - copie o ID (começa com `price_`)

4. Repita para o produto **PREMIUM**:
   - **Mensal (R$ 49,90)** - copie o ID
   - **Anual (R$ 396,00)** - copie o ID

---

## Passo 2: Configurar o Arquivo .env.local

1. **Copie o arquivo `.env.example` para `.env.local`:**

   ```bash
   cp .env.example .env.local
   ```

2. **Abra o arquivo `.env.local` e preencha:**

```bash
# Chaves do Stripe (substitua pelos valores reais)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_COLE_SUA_CHAVE_AQUI
STRIPE_SECRET_KEY=sk_test_COLE_SUA_CHAVE_AQUI

# IDs dos Preços (substitua pelos IDs reais)
VITE_STRIPE_PRICE_PRO_MONTHLY=price_COLE_O_ID_AQUI
VITE_STRIPE_PRICE_PRO_YEARLY=price_COLE_O_ID_AQUI
VITE_STRIPE_PRICE_PREMIUM_MONTHLY=price_COLE_O_ID_AQUI
VITE_STRIPE_PRICE_PREMIUM_YEARLY=price_COLE_O_ID_AQUI
```

3. **Salve o arquivo**

---

## Passo 3: Configurar Trial de 3 Dias no Stripe

Para cada produto (PRO e PREMIUM):

1. Acesse: <https://dashboard.stripe.com/test/products>
2. Clique no produto
3. Clique em "Add another price" ou edite o preço existente
4. Na seção "Trial period", selecione:
   - ✅ **Enable trial period**
   - **Duration:** 3 days
5. Salve

---

## Passo 4: Verificar Configuração

Após configurar tudo, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

---

## ⚠️ IMPORTANTE

- **NUNCA** commite o arquivo `.env.local` no Git
- O arquivo `.env.example` é apenas um template
- As chaves `pk_test_` e `sk_test_` são para modo de teste
- Quando for para produção, use as chaves `pk_live_` e `sk_live_`

---

## 📋 Checklist

- [ ] Copiei `.env.example` para `.env.local`
- [ ] Adicionei a Publishable Key (`pk_test_...`)
- [ ] Adicionei a Secret Key (`sk_test_...`)
- [ ] Adicionei os 4 Price IDs (PRO mensal, PRO anual, PREMIUM mensal, PREMIUM anual)
- [ ] Configurei trial de 3 dias em cada produto no Stripe
- [ ] Reiniciei o servidor (`npm run dev`)

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas, me avise e posso ajudar a encontrar as informações no dashboard do Stripe!
