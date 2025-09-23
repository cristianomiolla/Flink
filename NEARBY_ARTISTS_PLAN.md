# Piano implementazione "Artisti vicini"

## Obiettivo
Implementare la sezione "Artisti vicini" che mostra artisti in base alla vicinanza geografica all'utente.

## Approccio semplificato

### 1. Geolocalizzazione dell'utente
- **Hook**: `useUserLocation`
  - Ottenere coordinate (lat, lng) tramite `navigator.geolocation`
  - Gestire permessi utente e stati di errore
  - Cache della posizione in `sessionStorage`

### 2. Geocoding delle città degli artisti
- **API**: Nominatim (OpenStreetMap) - gratuito, no API key
- **Endpoint**: `https://nominatim.openstreetmap.org/search`
- **Cache**: `localStorage` per evitare chiamate ripetute
- **Formato**: `{ "Milano": { lat: 45.4642, lng: 9.1900 }, ... }`

### 3. Calcolo distanza
- **Formula Haversine**: calcolo distanza tra due coordinate
- **Soglia**: artisti entro 100km dalla posizione utente
- **Ordinamento**: per distanza crescente

### 4. Integrazione in ArtistGrid
- Modificare logica `nearbyArtists` in `useMemo`
- Filtrare e ordinare artisti in base alla distanza
- Fallback: se no geolocalizzazione → artisti casuali

## Struttura file

```
src/
├── hooks/
│   └── useUserLocation.ts          # Hook geolocalizzazione
├── services/
│   ├── geocoding.ts               # API Nominatim + cache
│   └── distance.ts                # Formula Haversine
└── components/
    └── ArtistGrid.tsx             # Logica filtro modificata
```

## Implementazione step-by-step

### Step 1: Hook geolocalizzazione
```typescript
// hooks/useUserLocation.ts
export function useUserLocation() {
  // navigator.geolocation.getCurrentPosition()
  // Gestione permessi e errori
  // Cache in sessionStorage
}
```

### Step 2: Servizio geocoding
```typescript
// services/geocoding.ts
export async function getCityCoordinates(city: string) {
  // Controllo cache localStorage
  // Chiamata API Nominatim se non in cache
  // Salvataggio risultato in cache
}
```

### Step 3: Calcolo distanza
```typescript
// services/distance.ts
export function calculateDistance(lat1, lng1, lat2, lng2) {
  // Formula Haversine
  // Ritorna distanza in km
}
```

### Step 4: Logica filtro artisti
```typescript
// components/ArtistGrid.tsx
const nearbyArtists = useMemo(async () => {
  if (!userLocation) return []

  const artistsWithDistance = await Promise.all(
    profiles.map(async (artist) => {
      const coords = await getCityCoordinates(artist.location)
      const distance = calculateDistance(userLocation, coords)
      return { artist, distance }
    })
  )

  return artistsWithDistance
    .filter(item => item.distance <= 100)
    .sort((a, b) => a.distance - b.distance)
    .map(item => item.artist)
}, [profiles, userLocation])
```

## Gestione errori e fallback

### Scenari di fallback:
1. **Utente nega geolocalizzazione** → Mostra artisti casuali
2. **Geocoding fallisce** → Escludi artista da calcolo
3. **Nessun artista entro 100km** → Espandi raggio a 200km
4. **API Nominatim non disponibile** → Mostra artisti casuali

### UX considerations:
- Loading spinner durante geolocalizzazione
- Messaggio informativo sui permessi
- Opzione per utente di impostare manualmente la città
- Indicazione "~15km" accanto al nome dell'artista

## Timeline stimata
- **Step 1-2**: 2-3 ore (geolocalizzazione + geocoding)
- **Step 3**: 30 min (formula distanza)
- **Step 4**: 1-2 ore (integrazione + testing)
- **Fallback + UX**: 1 ora

**Totale**: ~5-6 ore di sviluppo

## Note tecniche
- Nominatim ha rate limit: 1 req/sec (ok per uso normale)
- Cache persistente riduce chiamate API
- Geolocalizzazione richiede HTTPS (già presente)
- Formula Haversine accurata per distanze < 1000km