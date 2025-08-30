# Come riabilitare la funzionalità Likes

## Problema attuale
Gli errori 406 persistono anche dopo il fix delle policies RLS. La funzionalità likes è stata temporaneamente disabilitata per eliminare gli errori della console.

## Per riabilitare la funzionalità:

### 1. Verifica nel Dashboard Supabase
- Vai al Dashboard Supabase
- Controlla la tabella `portfolio_likes` nella sezione Tables
- Verifica che le policies RLS siano correttamente applicate
- Testa manualmente una query SELECT sulla tabella

### 2. Modifica il codice
Nel file `src/hooks/usePortfolioLikes.ts`, cambia:

```typescript
const LIKES_FEATURE_ENABLED = false
```

in:

```typescript
const LIKES_FEATURE_ENABLED = true
```

### 3. Alternative da provare se il problema persiste:

#### Opzione A: Controllo più dettagliato
Aggiungi logging più dettagliato per capire esattamente cosa sta causando il 406:

```typescript
const checkTableAndFetchData = async () => {
  try {
    console.log('Testing portfolio_likes access...')
    const { data, error, count } = await supabase
      .from('portfolio_likes')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log('Query result:', { data, error, count })
    // rest of the logic...
  } catch (error) {
    console.error('Detailed error:', error)
  }
}
```

#### Opzione B: Restart della connessione Supabase
Prova a creare una nuova istanza del client Supabase o riavvia l'app.

#### Opzione C: Verifica le foreign keys
Controlla che le foreign keys nella tabella `portfolio_items` e `auth.users` siano corrette.

### 4. Test
- Ricarica la pagina
- Verifica che non ci siano errori 406 nella console
- Testa il click sui bottoni "Mi piace"

## Note
Se il problema persiste, potrebbe essere necessario:
1. Ricreare completamente la tabella portfolio_likes
2. Verificare i permessi del database
3. Controllare se ci sono conflitti con altre policies RLS