-- Script per far scadere automaticamente le prenotazioni dopo 15 giorni
-- Cambia status da 'pending' a 'expired' se:
-- 1. Status è 'pending'
-- 2. Sono passati più di 15 giorni da created_at
-- 3. Non c'è una data in appointment_date (NULL)

UPDATE bookings 
SET 
    status = 'expired',
    updated_at = now()
WHERE 
    status = 'pending' 
    AND created_at < now() - interval '15 days'
    AND appointment_date IS NULL;

-- Query per verificare quante prenotazioni sono state aggiornate
-- (esegui separatamente dopo l'UPDATE per vedere i risultati)
-- SELECT COUNT(*) as bookings_expired 
-- FROM bookings 
-- WHERE status = 'expired' 
-- AND updated_at >= now() - interval '1 minute';