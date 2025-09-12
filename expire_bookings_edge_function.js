// Edge Function per Supabase per far scadere le prenotazioni
// Salva questo file come edge function e programmalo per eseguire ogni giorno

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Inizializza il client Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Aggiorna le prenotazioni scadute
    const { data, error, count } = await supabase
      .from('bookings')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()) // 15 giorni fa
      .is('appointment_date', null)
      .select('id', { count: 'exact' })

    if (error) {
      console.error('Error updating bookings:', error)
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const result = {
      success: true,
      expired_count: count || 0,
      message: `Successfully expired ${count || 0} bookings`,
      timestamp: new Date().toISOString()
    }

    console.log('Booking expiry result:', result)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

// Per testare localmente:
// supabase functions serve expire-bookings
// curl -X POST http://localhost:54321/functions/v1/expire-bookings

// Per programmare l'esecuzione automatica, usa il cron di Supabase o un servizio esterno come:
// - GitHub Actions con schedule
// - Vercel Cron
// - Cron job su server