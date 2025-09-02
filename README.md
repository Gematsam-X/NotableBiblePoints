# NotableBiblePoints - Salva i punti notevoli

**NotableBiblePoints** è un'app web che permette di salvare i punti notevoli che trovi durante la lettura della Bibbia, memorizzarli nel cloud e condividerli facilmente tra dispositivi.  
È progettata per chi vuole organizzare e approfondire la propria lettura, tenendo traccia di insegnamenti e versetti significativi.

---

## Caratteristiche principali

### 1. Salvataggio dei punti notevoli
- Aggiungi punti notevoli con titolo, contenuto e riferimenti al versetto.
- Organizza le note per libro, capitolo e versetto.
- Tagga le note per filtrarle facilmente.

### 2. Sincronizzazione cloud
- I dati sono memorizzati in **Backendless**, garantendo accesso sicuro da qualsiasi dispositivo.
- Tutti i dati sensibili (email, token) sono criptati durante il trasferimento.
- La sincronizzazione avviene automaticamente quando sei online.

### 3. Condivisione tra dispositivi
- Accedi alle tue note da smartphone, tablet o PC senza perdere dati.
- Condivisione di singole note tramite testo o link sicuro.

### 4. Interfaccia semplice e responsiva
- Design pulito e intuitivo, ottimizzato per desktop e mobile.
- Tabelle, modali e pulsanti accessibili e chiari.
- Funzionalità fullscreen per una lettura immersiva.

### 5. Utilizzo offline
- Tutte le note vengono salvate anche offline su **IndexedDB**.
- Appena viene ristabilita la connessione a Internet, le note offline vengono sincronizzate automaticamente con Backendless.
- Perfetto per leggere o prendere appunti in ogni circostanza.

---

## Tecnologie utilizzate

| Tecnologia | Ruolo |
|------------|-------|
| **HTML** | Struttura delle pagine |
| **CSS** | Layout e styling dell'app |
| **JavaScript** | Logica dell'app, interazioni, gestione dati |
| **Backendless** | Backend cloud: storage, autenticazione, sincronizzazione |
| **IndexedDB** | Persistenza locale offline |
| **Choices.js** | Selezione e gestione dei tag |
| **Capacitor** | Funzionalità native mobile (share, network detection) |

---

## Flusso di utilizzo

### 1. Accedi all'app
- Inserisci email e password per accedere.  
- Se non hai un account, registrati direttamente nell'app.

### 2. Seleziona il libro
- Clicca sul libro desiderato nella tabella principale.

### 3. Seleziona il capitolo
- Scegli il capitolo dalla griglia di numeri che appare dopo aver selezionato il libro.

### 4. Aggiungi punti notevoli
- Clicca sul pulsante **+** in basso a destra.
- Inserisci:
  - Titolo della nota
  - Contenuto della nota
  - Versetto di riferimento
  - Eventuali tag

### 5. Visualizza, modifica e condividi
- Modifica o elimina note tramite la modale dedicata.
- Condividi singole note come testo attraverso il plugin Capacitor Share.

### 6. Sincronizzazione
- Le modifiche vengono sincronizzate automaticamente con Backendless.
- Le note offline vengono integrate al cloud appena la connessione ritorna.

---

## Sicurezza e Privacy 🔒
- Email utente criptata durante il trasferimento.
- Cloud Code Backendless valida email e token prima di restituire le note.
- La sincronizzazione offline/online è progettata per prevenire perdita di dati e conflitti.

---

## Note aggiuntive

- L'app è ottimizzata per funzionare sia su desktop che su mobile.
- La gestione tag avanzata con Choices.js permette filtri multipli veloci.
- La combinazione IndexedDB + Backendless garantisce un'esperienza offline-first senza perdita di dati.

---

## Licenza

Distribuito sotto licenza MIT con obbligo di attribuzione all'autore originale:
*Gionatan Venturi - Gematsam X*

Vedi il file [LICENSE](LICENSE) per dettagli completi.
