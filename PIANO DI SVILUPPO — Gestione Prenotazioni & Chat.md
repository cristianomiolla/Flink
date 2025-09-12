Piano di sviluppo piattaforma tatuatori – Booking, Chat, Appuntamenti
1. Chat e richieste tatuaggio
Flusso principale

Cliente

In alto nella chat (class="messages-list") vede un componente pinnato “Invia una richiesta”.

Usa un modulo precompilato:

Soggetto del tatuaggio

Stile tattoo

Zona del corpo

Dimensioni

Colore

Immagini di riferimento

Significato eventuale

Budget

Dopo invio:

Componente pinnato scompare.

Comparirà uno stato di avanzamento: “richiesta inviata”.

Nella chat rimarrà una card riepilogativa della richiesta.

Se la richiesta non viene accettata entro 15 giorni:

Stato → scompare.

Card indica “Richiesta senza risposta”.

Torna disponibile il pulsante “Invia una richiesta”.

Artista

In alto nella chat vede “Fissa appuntamento”.

Dopo ricezione richiesta:

Componente pinnato scompare.

Stato di avanzamento → “Richiesta ricevuta”.

Può accettare la richiesta:

Compila un appuntamento con:

Oggetto del tatuaggio

Data

Acconto richiesto

Campo note/indicazioni

Nella chat rimane card riepilogativa dell’appuntamento.

Può modificare i dettagli dell’appuntamento:

Stato passa a “Appuntamento modificato”.

Cliente riceve notifica.

Regole generali

Se l’artista fissa un appuntamento senza richiesta:

Il pulsante “Invia richiesta” scompare.

Stato iniziale → “Appuntamento fissato”.

Dopo la data dell’appuntamento:

Stato → “Tattoo completato”.

Cliente può lasciare recensione.

Acconto non gestito in app per ora.

2. Stati degli appuntamenti
Stato	Cliente visualizza	Artista visualizza	Chi lo imposta	Note / Trigger
pending	Richiesta inviata	Richiesta ricevuta	Cliente	Invio richiesta
expired	Richiesta scaduta	Richiesta scaduta	Sistema	Nessuna risposta entro 15 giorni
rejected	Richiesta rifiutata	Richiesta rifiutata	Artista	Rifiuto richiesta
scheduled	Appuntamento fissato	Appuntamento fissato	Artista	Appuntamento creato per invio diretto o accettazione richiesta cliente
rescheduled	Appuntamento modificato	Appuntamento modificato	Artista	Modifica data/dettagli
cancelled	Appuntamento annullato	Appuntamento annullato	Artista	Cancellazione manuale
completed	Tattoo completato	Tattoo completato	Sistema	Alla data dell’appuntamento dopo 6h dall'ora fissata

Note critiche:

Solo l’artista può cancellare appuntamenti.

Lo stato completed è automatico, non richiede conferma cliente.

Richiesta e appuntamento sono un flusso unico ma con visualizzazioni separate: cliente vede “Richiesta inviata”, artista “Richiesta ricevuta”.

3. UI / Componenti
Chat

Componente pinnato in alto:

Cliente → “Invia una richiesta”

Artista → “Fissa appuntamento”

Card riepilogativa di richieste/appuntamenti

Mostra stato

Bottoni per accettare/modificare solo lato artista

Stato di avanzamento visibile sopra chat

Modulo precompilato

Cliente compila richiesta

Artista compila appuntamento (oggetto, data, acconto, note)

Layout coerente con chat, mobile-friendly

Sezione appuntamenti

Cliente:

Da Menu dropdown e mobile-profile-menu, si accede a "appuntamenti" che mostrano tutti gli appuntamenti con stato assocciato

Artista:

Gestionale con stessi dati, accessibile da desktop header e mobile navbar (quinta icona)

4. Logica di scadenza / aggiornamento

Richiesta non accettata entro 15 giorni → “Richiesta senza risposta”

Stato di avanzamento scompare

Cliente può inviare nuova richiesta

Artista può fissare nuovo appuntamento

Dopo 3 giorni da questo stato "completed	Tattoo completato	Tattoo completato	Sistema	Alla data dell’appuntamento dopo 6h dall'ora fissata" torna tutto come all'inizio e non si visualizzerà la stato di avanzamento ma: 
Cliente → “Invia una richiesta”

Artista → “Fissa appuntamento”

5. Priorità e conflitti

Se l’artista fissa appuntamento prima che il cliente invii richiesta:

Pulsante “Invia richiesta” scompare per il cliente.

Stato iniziale → “Appuntamento fissato”.

Nessuna priorità di richiesta/appuntamento: il flusso è lineare e chiuso una volta fissato l’appuntamento.

6. Notifiche

Ogni cambio stato genera notifica:

Cliente → invio richiesta, accettazione, modifica, cancellazione, completamento

Artista → nuova richiesta, conferma cliente, modifica richiesta/appuntamento

La tabella bookings ha questa struttura: 
create table public.bookings (
  id uuid not null default gen_random_uuid (),
  client_id uuid not null,
  artist_id uuid not null,
  subject text not null,
  tattoo_style text null,
  body_area text null,
  size_category text null,
  color_preferences text null,
  reference_images text[] null,
  meaning text null,
  budget_min numeric(8, 2) null,
  budget_max numeric(8, 2) null,
  appointment_date timestamp with time zone null,
  appointment_duration integer null,
  deposit_amount numeric(8, 2) null,
  artist_notes text null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone null default (now() + '15 days'::interval),
  constraint bookings_pkey primary key (id),
  constraint bookings_artist_id_fkey foreign KEY (artist_id) references auth.users (id) on delete CASCADE,
  constraint bookings_client_id_fkey foreign KEY (client_id) references auth.users (id) on delete CASCADE,
  constraint bookings_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'expired'::text,
          'rejected'::text,
          'scheduled'::text,
          'rescheduled'::text,
          'cancelled'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_bookings_client_id on public.bookings using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_artist_id on public.bookings using btree (artist_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_status on public.bookings using btree (status) TABLESPACE pg_default;

create index IF not exists idx_bookings_expires_at on public.bookings using btree (expires_at) TABLESPACE pg_default;