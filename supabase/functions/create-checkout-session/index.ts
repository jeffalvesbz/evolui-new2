import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { priceId, userId, planType, billingPeriod } = await req.json()

        if (!priceId || !userId) {
            throw new Error('Missing required parameters')
        }

        // Criar sessão de checkout do Stripe
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${req.headers.get('origin')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/pagamento?canceled=true`,
            client_reference_id: userId,
            metadata: {
                user_id: userId,
                plan_type: planType,
                billing_period: billingPeriod,
            },
            subscription_data: {
                // Trial de 3 dias apenas para o plano Pro (evita abuso de IA no Premium)
                ...(planType === 'pro' ? { trial_period_days: 3 } : {}),
                metadata: {
                    user_id: userId,
                    plan_type: planType,
                },
            },
            allow_promotion_codes: true,
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error creating checkout session:', error)
        console.error('Error details:', {
            message: error.message,
            type: error.type,
            code: error.code,
        })
        return new Response(
            JSON.stringify({
                error: error.message,
                details: error.type || 'Unknown error type'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
