import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  try {
    // Inizializza il client Supabase con service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Completa gli appuntamenti passati (appointment_date < oggi)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const { error: completedError, count: completedCount } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .in('status', ['scheduled', 'rescheduled'])
      .not('appointment_date', 'is', null)
      .lt('appointment_date', today)
      .select('id', { count: 'exact' })

    // 2. Scade le richieste pending > 15 giorni senza appointment_date
    const { error: expiredError, count: expiredCount } = await supabase
      .from('bookings')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString())
      .is('appointment_date', null)
      .select('id', { count: 'exact' })

    // Controlla errori
    const error = completedError || expiredError
    const count = (completedCount || 0) + (expiredCount || 0)

    if (error) {
      console.error('Error processing bookings:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          }
        }
      )
    }

    const result = {
      success: true,
      completed_count: completedCount || 0,
      expired_count: expiredCount || 0,
      total_processed: count || 0,
      message: `Successfully completed ${completedCount || 0} appointments (scheduled/rescheduled) and expired ${expiredCount || 0} bookings`,
      timestamp: new Date().toISOString()
    }

    console.log('Booking processing result:', result)

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      }
    )

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: err.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      }
    )
  }
})