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
- Modifica o elimina note tramite gli appositi tasti.
- Condividi singole note come testo.

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

---

# NotableBiblePoints - Save Notable Points

**NotableBiblePoints** is a web app that lets you save notable points you find while reading the Bible, store them in the cloud, and easily share them between devices.

It is designed for those who want to organize and deepen their reading, keeping track of significant teachings and verses.

---

## Main Features

### 1. Save Notable Points
- Add notable points with title, content, and verse references.
- Organize notes by book, chapter, and verse.
- Tag notes to easily filter them.

### 2. Cloud Sync
- Data is stored in **Backendless**, ensuring secure access from any device.
- All sensitive data (email, token) is encrypted during transfer.
- Sync occurs automatically when you're online.

### 3. Sharing between Devices
- Access your notes from your smartphone, tablet, or PC without losing data.
- Share individual notes via text or secure link.

### 4. Simple and responsive interface
- Clean and intuitive design, optimized for desktop and mobile.
- Accessible and clear tables, modals, and buttons.
- Full-screen functionality for immersive reading.

### 5. Offline use
- All notes are saved offline to **IndexedDB**.
- As soon as your internet connection is re-established, offline notes are automatically synced with Backendless.
- Perfect for reading or taking notes anywhere.

---

## Technologies used

| Technology | Role |
|-----------|-------|
| **HTML** | Page structure |
| **CSS** | App layout and styling |
| **JavaScript** | App logic, interactions, data management |
| **Backendless** | Cloud backend: storage, authentication, synchronization |
| **IndexedDB** | Local offline persistence |
| **Choices.js** | Tag selection and management |
| **Capacitor** | Native mobile features (share, network detection) |

---

## Usage flow

### 1. Log in to the app
- Enter your email and password to log in.
- If you don't have an account, sign up directly in the app.

### 2. Select the book
- Click on the desired book in the main table.

### 3. Select the chapter
- Choose the chapter from the number grid that appears after selecting the book.

### 4. Add noteworthy points
- Click the **+** button at the bottom right.
- Enter:
- Note title
- Note content
- Reference verse
- Any tags

### 5. View, edit, and share
- Edit or delete notes using the appropriate buttons.

- Share individual notes as text.

### 6. Sync
- Changes are automatically synced with Backendless.
- Offline notes are integrated into the cloud as soon as the connection is restored.

---

## Security and Privacy 🔒
- User email is encrypted during transfer.
- Backendless cloud code validates email and token before returning notes.
- Offline/online sync is designed to prevent data loss and conflicts.

---

## Additional Notes

- The app is optimized for both desktop and mobile.
- Advanced tag management with Choices.js allows for fast multiple filters.
- The combination of IndexedDB and Backendless ensures an offline-first experience without data loss.

---

## License

Distributed under the MIT License with attribution to the original author:
*Gionatan Venturi - Gematsam X*

See the [LICENSE](LICENSE) file for complete details.
