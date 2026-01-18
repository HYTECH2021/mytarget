# Setup Admin Dashboard

## 1. Esegui la Migration

La migration `20260118000000_add_admin_role_support.sql` aggiunge il supporto per il ruolo 'admin' nella tabella `profiles`.

Esegui la migration dal Supabase Dashboard:
1. Vai su Supabase Dashboard → SQL Editor
2. Copia e incolla il contenuto di `supabase/migrations/20260118000000_add_admin_role_support.sql`
3. Esegui la query

## 2. Imposta il Primo Admin

### Metodo 1: Via SQL (Consigliato)

Esegui questa query nel SQL Editor di Supabase, sostituendo `'tua-email@example.com'` con la tua email:

```sql
-- Imposta te stesso come admin
SELECT set_user_as_admin('tua-email@example.com');
```

Questa funzione:
- Trova il tuo profilo tramite email
- Imposta `role = 'admin'` nella tabella `profiles`
- Aggiunge il tuo user_id alla tabella `admin_users` con tutti i permessi

### Metodo 2: Via Dashboard Supabase

1. Vai su **Table Editor** → **profiles**
2. Trova il tuo profilo (cerca per email)
3. Modifica il campo `role` e imposta a `'admin'`
4. Salva

Poi vai su **Table Editor** → **admin_users**:
1. Click su **Insert** → **Insert row**
2. Inserisci il tuo `user_id` (lo trovi nella tabella profiles)
3. Inserisci i permessi: `["manage_categories", "view_analytics", "manage_users", "manage_targets", "view_chats"]`
4. Salva

## 3. Accedi alla Dashboard Admin

Una volta impostato come admin:

1. Accedi al sito con il tuo account
2. Vai su `/admin` o `/admin/dashboard`
3. La dashboard si aprirà automaticamente se sei admin

## 4. Funzionalità Admin Dashboard

La dashboard admin include:

### Tab Richieste (Targets)
- Visualizza tutte le richieste dei buyer
- Modifica lo status (active/closed/archived)
- Elimina richieste

### Tab Utenti
- Visualizza tutti gli utenti registrati
- Modifica il ruolo utente (buyer/seller/admin)
- Gestisci permessi

### Tab Categorie Pending
- Visualizza categorie suggerite dagli utenti
- Approva o rifiuta categorie
- Le categorie approvate diventano disponibili per tutti

### Tab Chat Monitor
- Visualizza tutte le conversazioni (sola lettura)
- Monitora le chat tra buyer e seller
- Vedi dettagli buyer/seller per ogni conversazione

## 5. Protezione Route

La route `/admin` è protetta:
- Verifica autenticazione utente
- Verifica che l'utente sia admin (controlla sia `admin_users` che `profiles.role`)
- Reindirizza alla home se non autorizzato

## 6. Permessi Admin

Gli admin hanno accesso completo a:
- ✅ Visualizzare tutti i profili utenti
- ✅ Modificare ruoli utenti
- ✅ Visualizzare tutte le richieste (targets)
- ✅ Modificare/eliminare richieste
- ✅ Approvare/rifiutare categorie
- ✅ Visualizzare tutte le conversazioni (sola lettura)
- ✅ Visualizzare tutti i messaggi (sola lettura)

## Note di Sicurezza

- Gli admin possono vedere tutti i dati ma non possono modificare i messaggi (sola lettura per monitoraggio)
- Le modifiche ai ruoli utenti sono tracciate nel database
- La funzione `set_user_as_admin` è `SECURITY DEFINER` per permettere l'esecuzione anche senza permessi diretti
