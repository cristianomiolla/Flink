-- Crea una funzione per far scadere automaticamente le prenotazioni
CREATE OR REPLACE FUNCTION expire_pending_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    count_expired INTEGER;
BEGIN
    -- Aggiorna le prenotazioni scadute
    UPDATE bookings 
    SET 
        status = 'expired',
        updated_at = now()
    WHERE 
        status = 'pending' 
        AND created_at < now() - interval '15 days'
        AND appointment_date IS NULL;
    
    -- Conta quante prenotazioni sono state aggiornate
    GET DIAGNOSTICS count_expired = ROW_COUNT;
    
    -- Ritorna il conteggio
    RETURN count_expired;
END;
$$;

-- Per eseguire la funzione manualmente:
-- SELECT expire_pending_bookings();

-- Per programmare l'esecuzione automatica con pg_cron (se disponibile):
-- SELECT cron.schedule('expire-bookings', '0 2 * * *', 'SELECT expire_pending_bookings();');
-- Questo eseguirà la funzione ogni giorno alle 2:00 AM