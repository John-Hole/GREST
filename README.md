# Grest PSG - Sistema Gestione Torneo

Applicazione web completa per la gestione torneo con calendario, classifica live, bonus/malus e area admin.

## 🚀 Installazione e Avvio Rapido

1. Assicurati di avere **Node.js** (v18+) installato.
2. Fai doppio click su `AVVIA_SERVER.bat`.
3. Attendi il caricamento e apri **http://localhost:3000**.
4. Per chiudere, usa `TERMINA_SERVER.bat`.

## 🔑 Credenziali Accesso

| Ruolo     | Username  | Password    |
|-----------|-----------|-------------|
| **Admin** | admin     | admin123    |
| Operator  | operatore | operator123 |

## ⚙️ Funzionalità Principali

### Pubbliche
- **Homepage**: Mostra il turno corrente (intelligente) e la classifica aggiornata live.
- **Calendario**: Filtra per giorno (1-5) e visualizza tutte le partite.
- **Classifica**: Tabella completa con punti giornalieri e totali.

### Area Riservata (Admin)
- **Gestione Partite**: Clicca su una partita nel calendario per inserire il risultato.
- **Bonus/Malus**: Assegna punti extra o penalità alle squadre.
- **Configurazione**: Modifica date del torneo, nomi squadre e colori.

## 🛠 Note Tecniche
- **Stack**: Next.js App Router, SQLite, JWT Auth.
- **Database**: File locale `frontend/tournament.db` (creato al primo avvio).
- **Seed**: Se il DB non esiste, viene popolato con dati di test (6 squadre, calendario generato).
- **Modifiche Design**: Vedi `DESIGN_GUIDE.md`.

## 📱 Mobile Friendly
L'app è ottimizzata per smartphone con una barra di navigazione inferiore dedicata e layout responsive.
