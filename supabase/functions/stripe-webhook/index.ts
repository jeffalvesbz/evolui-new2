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

    // Debug logs
    console.log('=== WEBHOOK DEBUG ===')
    console.log('Webhook secret loaded:', webhookSecret ? `${webhookSecret.substring(0, 10)}...` : 'NOT FOUND')
    console.log('Signature header:', signature ? 'Present' : 'Missing')
    console.log('Body length:', body.length)

    let event: Stripe.Event

    try {
        // Usar constructEventAsync em vez de constructEvent para Deno/Edge Functions
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        console.error('Secret used:', webhookSecret ? `${webhookSecret.substring(0, 15)}...` : 'NONE')
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
    console.log('=== SUBSCRIPTION UPDATE ===')
    console.log('Subscription ID:', subscription.id)
    console.log('Customer ID:', subscription.customer)
    console.log('Metadata:', JSON.stringify(subscription.metadata))
    console.log('Status:', subscription.status)

    let userId = subscription.metadata?.user_id
    let planType = subscription.metadata?.plan_type as 'pro' | 'premium'

    // Fallback: se não tiver user_id nos metadados, buscar pelo customer_id
    if (!userId && subscription.customer) {
        console.log('User ID not in metadata, trying to find by customer_id...')
        const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, plan_type')
            .eq('stripe_customer_id', subscription.customer as string)
            .single()

        if (profile) {
            userId = profile.user_id
            console.log('Found user by customer_id:', userId)
        }
    }

    if (!userId) {
        console.error('No user ID found in subscription metadata or by customer lookup')
        return
    }

    // Se não tiver planType nos metadados, inferir do price
    if (!planType) {
        // Tentar inferir do nome do produto ou price
        planType = 'pro' // Default para pro
        console.log('Plan type not in metadata, defaulting to:', planType)
    }

    // Validar datas antes de converter
    let currentPeriodEnd: string | null = null
    let currentPeriodStart: string | null = null

    if (subscription.current_period_end && !isNaN(subscription.current_period_end)) {
        currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    }
    if (subscription.current_period_start && !isNaN(subscription.current_period_start)) {
        currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString()
    }

    console.log('Period dates - Start:', currentPeriodStart, 'End:', currentPeriodEnd)

    try {
        // Atualizar ou criar registro de assinatura
        console.log('Checking for existing subscription for user:', userId)
        const { data: existingSub, error: selectError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .single()

        if (selectError && selectError.code !== 'PGRST116') {
            console.error('Error checking existing subscription:', selectError)
        }

        if (existingSub) {
            console.log('Updating existing subscription:', existingSub.id)
            const { error: updateError } = await supabase
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

            if (updateError) {
                console.error('Error updating subscription:', updateError)
            }
        } else {
            console.log('Creating new subscription for user:', userId)
            const { error: insertError } = await supabase
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

            if (insertError) {
                console.error('Error inserting subscription:', insertError)
            }
        }

        // Atualizar perfil do usuário
        console.log('Updating profile for user:', userId)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                plan_type: planType,
                subscription_status: subscription.status,
                subscription_ends_at: currentPeriodEnd,
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
            })
            .eq('user_id', userId)

        if (profileError) {
            console.error('Error updating profile:', profileError)
        }

        console.log(`Subscription updated successfully for user ${userId}: ${subscription.status}`)
    } catch (error) {
        console.error('Unexpected error in handleSubscriptionUpdate:', error)
        throw error
    }
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
