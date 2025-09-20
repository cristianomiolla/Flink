# Piano di Implementazione: Integrazione Google Calendar per Tatuatori

## Analisi Sistema Attuale

**Sistema di Appuntamenti Esistente:**
- Database: Tabella `bookings` con campi `appointment_date`, `appointment_duration`, `status`
- Workflow: `pending` → `scheduled` → `completed`/`cancelled`
- Form: `ArtistAppointmentForm.tsx` per creazione appuntamenti
- Hook: `useAppointments.ts` per gestione dati

## Architettura Proposta

### 1. **Backend Integration (Supabase Edge Functions)**
```
🔄 Edge Function: `google-calendar-sync`
├── 📅 Create Calendar Events (one-way write)
├── 🔐 OAuth2 Token Management
├── ⚡ Automatic Sync on Booking Status Changes
└── 🔒 Secure Token Storage
```

### 2. **Frontend Components**
```
🎨 Frontend Integration
├── 📱 Google Calendar Settings Panel
├── ⚙️ OAuth2 Authorization Flow
├── 🔗 Calendar Connection Status
└── 🎛️ Sync Preferences
```

### 3. **Database Schema Extensions**
```sql
-- Add to profiles table
google_calendar_connected BOOLEAN DEFAULT false,
google_refresh_token TEXT ENCRYPTED,
calendar_sync_enabled BOOLEAN DEFAULT true,

-- Add to bookings table
google_calendar_event_id TEXT,
synced_to_calendar BOOLEAN DEFAULT false
```

## Fasi di Implementazione

### **FASE 1: Setup & Dependencies**
```bash
# Frontend packages
npm install googleapis@105 @google-cloud/local-auth@2.1.0

# Backend (Supabase Edge Function)
npm install --save-dev supabase
```

### **FASE 2: Supabase Edge Function**
```typescript
// functions/google-calendar-sync/index.ts
import { google } from 'googleapis'

export default async function handler(req: Request) {
  // OAuth2 client setup
  // Event creation logic
  // Token refresh handling
}
```

### **FASE 3: Database Migration**
```sql
-- Add Google Calendar fields
ALTER TABLE profiles ADD COLUMN google_calendar_connected BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN calendar_sync_enabled BOOLEAN DEFAULT true;
ALTER TABLE bookings ADD COLUMN google_calendar_event_id TEXT;
ALTER TABLE bookings ADD COLUMN synced_to_calendar BOOLEAN DEFAULT false;
```

### **FASE 4: Frontend Components**
```typescript
// src/components/GoogleCalendarSettings.tsx
// src/hooks/useGoogleCalendar.ts
// src/lib/googleCalendar.ts
```

### **FASE 5: Integration Points**
- **Trigger**: Modifica di `ArtistAppointmentForm.tsx`
- **Hook**: Estensione di `useAppointments.ts`
- **Sync**: Chiamata automatica all'Edge Function

## Sicurezza & Privacy

### **🔐 OAuth2 Flow**
1. Frontend redirect a Google OAuth
2. Backend riceve authorization code
3. Exchange per refresh_token (encrypted storage)
4. Access token gestito server-side

### **🔒 Token Management**
- Refresh tokens criptati in Supabase
- Access tokens temporanei (1h TTL)
- Automatic token refresh

### **⚠️ Error Handling**
- Fallback su errore API Google
- Retry logic per rate limiting
- User notification per connection issues

## File Structure Proposta

```
📁 Project Structure
├── 📂 supabase/functions/
│   └── 📂 google-calendar-sync/
│       ├── index.ts
│       └── google-auth.ts
├── 📂 src/components/
│   ├── GoogleCalendarSettings.tsx
│   └── CalendarSyncStatus.tsx
├── 📂 src/hooks/
│   └── useGoogleCalendar.ts
├── 📂 src/lib/
│   └── googleCalendar.ts
└── 📂 src/types/
    └── calendar.ts
```

## Benefici dell'Integrazione

### **🎯 Per i Tatuatori**
- ✅ Sincronizzazione automatica appuntamenti
- ✅ Gestione calendario centralizzata
- ✅ Riduzione errori double-booking
- ✅ Notifiche mobile/desktop Google Calendar

### **🔧 Tecnici**
- ✅ Integrazione one-way (write-only) - più semplice
- ✅ Utilizzo Edge Functions Supabase
- ✅ OAuth2 standard Google
- ✅ Scalabile e mantenibile

## Considerazioni Implementative

### **📋 Priorità**
1. **High**: Edge Function + Database Schema
2. **Medium**: Frontend OAuth Flow
3. **Low**: Advanced Settings & Preferences

### **⏱️ Timeline Stimato**
- **Setup**: 1-2 giorni
- **Backend**: 2-3 giorni
- **Frontend**: 2-3 giorni
- **Testing**: 1-2 giorni
- **Total**: ~1 settimana

### **🧪 Testing Strategy**
- Unit tests per Edge Function
- Integration tests OAuth flow
- End-to-end appointment sync testing
- Error handling validation

## Note Tecniche

### **Google Calendar API Requirements**
- API v3 con OAuth2 authentication
- Scope: `https://www.googleapis.com/auth/calendar`
- Packages: `googleapis@105`, `@google-cloud/local-auth@2.1.0`

### **Supabase Integration**
- Edge Functions per backend logic
- Encrypted storage per refresh tokens
- RLS policies per accesso sicuro ai dati

### **Workflow di Sincronizzazione**
1. Artista crea appuntamento in `ArtistAppointmentForm`
2. Booking salvato con `status: 'scheduled'`
3. Trigger automatico all'Edge Function
4. Creazione evento Google Calendar
5. Update booking con `google_calendar_event_id`

Il piano mantiene la semplicità del sistema esistente aggiungendo solo la sincronizzazione unidirezionale verso Google Calendar, senza complicare il workflow attuale degli appuntamenti.