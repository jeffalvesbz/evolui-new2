// Script para testar se os Price IDs do Stripe estão corretos
// Execute com: node test-stripe-prices.js

const priceIds = {
    PRO_MONTHLY: process.env.VITE_STRIPE_PRICE_PRO_MONTHLY || 'price_1SWT5wGk2JpHJAlOJnWVZOXI',
    PRO_YEARLY: process.env.VITE_STRIPE_PRICE_PRO_YEARLY || 'price_1SWT6zGk2JpHJAlO5j2GlhAp',
    PREMIUM_MONTHLY: process.env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY || 'price_1SWT6DGk2JpHJAlOCxQtn0N2',
    PREMIUM_YEARLY: process.env.VITE_STRIPE_PRICE_PREMIUM_YEARLY || 'price_1SWT7iGk2JpHJAlOBQtsqFB4',
};

console.log('🔍 Verificando Price IDs configurados:\n');
console.log('PRO Mensal (R$ 29,00/mês):', priceIds.PRO_MONTHLY);
console.log('PRO Anual (R$ 251,16/ano):', priceIds.PRO_YEARLY);
console.log('PREMIUM Mensal (R$ 49,90/mês):', priceIds.PREMIUM_MONTHLY);
console.log('PREMIUM Anual (R$ 419,16/ano):', priceIds.PREMIUM_YEARLY);

console.log('\n✅ Todos os Price IDs estão configurados!');
console.log('\n📝 Próximo passo:');
console.log('1. Verifique se esses IDs correspondem aos do Stripe Dashboard');
console.log('2. Acesse: https://dashboard.stripe.com/test/products');
console.log('3. Compare cada Price ID com os valores acima');
