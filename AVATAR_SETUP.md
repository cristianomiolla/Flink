# Setup Avatar Storage

Questo documento spiega come configurare il bucket storage per gli avatar degli utenti.

## Problemi Comuni

### 1. "Bucket not found"
Se quando carichi un avatar vedi l'errore:
```
Error uploading avatar: StorageApiError: Bucket not found
```

### 2. "Row-level security policy violation"
Se vedi l'errore:
```
new row violates row-level security policy
```

## Soluzione Completa

1. **Apri il Supabase Dashboard**
   - Vai su [supabase.com](https://supabase.com)
   - Accedi al tuo progetto `shzouqqrxebzrqtkynqg`

2. **Vai alla sezione SQL Editor**
   - Nel menu laterale, clicca su "SQL Editor"

3. **Esegui lo script di fix completo**
   - Copia il contenuto del file `fix-avatars-policies.sql`
   - Incollalo nell'editor SQL
   - Clicca su "Run" per eseguire lo script

4. **Verifica la configurazione**
   - Vai alla sezione "Storage" nel dashboard
   - Dovresti vedere il bucket `avatars` creato
   - Il bucket dovrebbe essere configurato come pubblico

## Cosa fa lo script

Lo script `fix-avatars-policies.sql` configura:

- ✅ **Bucket avatars**: Crea il bucket per memorizzare le immagini avatar
- ✅ **Politiche RLS semplificate**: Rimuove le policy problematiche e ne crea di nuove
- ✅ **Accesso pubblico**: Permette la visualizzazione pubblica degli avatar
- ✅ **Upload per cartelle utente**: Solo utenti autenticati possono caricare nella propria cartella
- ✅ **Limiti di dimensione**: Limite di 5MB per file
- ✅ **Formati supportati**: JPG, JPEG, PNG, WEBP

## Test

Dopo aver eseguito lo script:

1. Accedi all'app
2. Vai al tuo profilo
3. Prova a caricare un'immagine avatar
4. Non dovrebbe più apparire l'errore "Bucket not found"

## Struttura file avatar

Gli avatar vengono salvati con questa struttura (AGGIORNATA):
```
avatars/
  └── {user_id}/
      └── avatar_{timestamp}.{estensione}
```

Esempio: `avatars/ac4d2878-b75b-44a6-96de-3b9d63c8b3c8/avatar_1756667875627.png`

## Changelog

- **v2**: Modificata struttura path da `{user_id}_avatar_{timestamp}.ext` a `{user_id}/avatar_{timestamp}.ext` per compatibilità RLS
- **v2**: Policy RLS semplificate con pattern matching `LIKE`
- **v2**: Migliore gestione errori con messaggi specifici