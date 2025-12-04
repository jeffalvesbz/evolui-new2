import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
    const signature = req.headers.get('stripe-signature')!
    const body = await req.text()

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), {
            status: 400,
        })
    }

    console.log('Processing event:', event.type)

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
                break

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
                break

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
                break

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
                break

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.Invoice)
                break

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
        })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        })
    }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id || session.metadata?.user_id

    if (!userId) {
        console.error('No user ID found in checkout session')
        return
    }

    // Atualizar perfil com stripe_customer_id
    await supabase
        .from('profiles')
        .update({
            stripe_customer_id: session.customer as string,
        })
        .eq('user_id', userId)

    console.log(`Checkout completed for user ${userId}`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.user_id
    const planType = subscription.metadata.plan_type as 'pro' | 'premium'

    if (!userId) {
        console.error('No user ID found in subscription metadata')
        return
    }

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString()

    // Atualizar ou criar registro de assinatura
    const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single()

    if (existingSub) {
        // Atualizar assinatura existente
        await supabase
            .from('subscriptions')
            .update({
                plan_type: planType,
                status: subscription.status,
                current_period_start: currentPeriodStart,
                current_period_end: currentPeriodEnd,
                cancel_at_period_end: subscription.cancel_at_period_end,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer as string,
            })
            .eq('id', existingSub.id)
    } else {
        // Criar nova assinatura
        await supabase
            .from('subscriptions')
            .insert({
                user_id: userId,
                plan_type: planType,
                status: subscription.status,
                current_period_start: currentPeriodStart,
                current_period_end: currentPeriodEnd,
                cancel_at_period_end: subscription.cancel_at_period_end,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer as string,
            })
    }

    // Atualizar perfil do usuário
    await supabase
        .from('profiles')
        .update({
            plan_type: planType,
            subscription_status: subscription.status,
            subscription_ends_at: currentPeriodEnd,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
        })
        .eq('user_id', userId)

    console.log(`Subscription updated for user ${userId}: ${subscription.status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.user_id

    if (!userId) {
        console.error('No user ID found in subscription metadata')
        return
    }

    // Atualizar status da assinatura
    await supabase
        .from('subscriptions')
        .update({
            status: 'canceled',
        })
        .eq('stripe_subscription_id', subscription.id)

    // Reverter usuário para plano FREE
    await supabase
        .from('profiles')
        .update({
            plan_type: 'free',
            subscription_status: 'inactive',
            subscription_ends_at: null,
        })
        .eq('user_id', userId)

    console.log(`Subscription canceled for user ${userId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string
    const userId = invoice.subscription_details?.metadata?.user_id

    if (!userId) {
        console.error('No user ID found in invoice')
        return
    }

    // Buscar subscription_id do banco
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

    // Registrar pagamento no histórico
    await supabase
        .from('payment_history')
        .insert({
            user_id: userId,
            subscription_id: subscription?.id,
            amount: (invoice.amount_paid / 100).toFixed(2),
            currency: invoice.currency.toUpperCase(),
            status: 'succeeded',
            payment_method: invoice.payment_intent ? 'card' : 'other',
            stripe_payment_intent_id: invoice.payment_intent as string,
            metadata: {
                invoice_id: invoice.id,
                invoice_number: invoice.number,
            },
        })

    console.log(`Payment succeeded for user ${userId}: ${invoice.amount_paid / 100}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const userId = invoice.subscription_details?.metadata?.user_id

    if (!userId) {
        console.error('No user ID found in invoice')
        return
    }

    // Registrar falha no histórico
    await supabase
        .from('payment_history')
        .insert({
            user_id: userId,
            amount: (invoice.amount_due / 100).toFixed(2),
            currency: invoice.currency.toUpperCase(),
            status: 'failed',
            metadata: {
                invoice_id: invoice.id,
                attempt_count: invoice.attempt_count,
            },
        })

    // Atualizar status da assinatura para past_due
    await supabase
        .from('profiles')
        .update({
            subscription_status: 'past_due',
        })
        .eq('user_id', userId)

    console.log(`Payment failed for user ${userId}`)
}
