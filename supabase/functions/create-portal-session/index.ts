import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
        // Obter o usuário autenticado
        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // Buscar o stripe_customer_id do usuário
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single()

        if (profileError || !profile?.stripe_customer_id) {
            throw new Error('Customer ID not found')
        }

        // Criar sessão do Customer Portal
        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${req.headers.get('origin')}/dashboard`,
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error creating portal session:', error)

        let errorMessage = 'Erro ao criar sessão do portal'
        let errorCode = 'UNKNOWN_ERROR'

        if (error.message === 'Customer ID not found') {
            errorMessage = 'ID do cliente Stripe não encontrado. Entre em contato com o suporte: suporte@meueleva.com'
            errorCode = 'CUSTOMER_ID_NOT_FOUND'
        } else if (error.message === 'Unauthorized') {
            errorMessage = 'Usuário não autorizado'
            errorCode = 'UNAUTHORIZED'
        }

        return new Response(
            JSON.stringify({
                error: errorMessage,
                code: errorCode,
                details: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
