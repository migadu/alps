export default {
  "settings": {
    "categories": {
      "filters": "Filtri",
      "autoReply": "Risposta automatica"
    }
  },
  "managesieve": {
    "title": "Filtri",
    "description": "Aggiungi regole personalizzate su come i messaggi vengono elaborati e archiviati.",
    "loadError": "Impossibile caricare i filtri.",
    "loadErrorRetry": "Riprova",
    "tabs": {
      "switchToRaw": "Editor grezzo"
    },
    "warningRawSwitchTitle": "Passa alla modalità grezza",
    "warningRawSwitchConfirm": "Passa",
    "warningRawSwitch": "Passare alla modalità grezza significa che lo script non sarà più modificabile visivamente. Continuare?",
    "toast": {
      "saved": "Regole salvate e attivate.",
      "deactivated": "Regole disattivate.",
      "valid": "Lo script è valido!",
      "networkError": "Si è verificato un errore di rete.",
      "autoReplyOn": "La risposta automatica è attiva. Disattivala in Risposta automatica prima che i filtri ne inviino una propria."
    },
    "visual": {
      "newRule": "Nuova regola",
      "noRules": "Nessuna regola definita.",
      "saveFilters": "Salva regole",
      "deleteRule": "Elimina regola",
      "remove": "Rimuovi",
      "add": "Aggiungi",
      "if": "SE",
      "all": "TUTTE",
      "any": "UNA QUALSIASI",
      "ofTheFollowing": "delle seguenti condizioni corrispondono",
      "then": "ALLORA",
      "value": "Valore",
      "actions": {
        "fileinto": "Sposta nella cartella",
        "discard": "Scarta (elimina)",
        "redirect": "Reindirizza all'email",
        "stop": "Interrompi la valutazione delle regole"
      },
      "fields": {
        "subject": "Oggetto",
        "from": "Da",
        "to": "A",
        "body": "Corpo",
        "size": "Dimensione",
        "emailAddress": "Indirizzo email"
      },
      "operators": {
        "contains": "Contiene",
        "not_contains": "Non contiene",
        "is": "È esattamente",
        "not_is": "Non è esattamente",
        "over": "Oltre",
        "under": "Sotto"
      }
    },
    "raw": {
      "validate": "Convalida",
      "save": "Salva",
      "script": "Script dei filtri"
    },
    "autoReply": {
      "title": "Risposta automatica",
      "description": "Rispondi automaticamente a chi ti scrive mentre sei via.",
      "enable": "Invia una risposta automatica",
      "stateActive": "I mittenti ricevono una risposta ora.",
      "stateActiveUntil": "I mittenti ricevono una risposta fino al {date}.",
      "stateScheduled": "Inizia il {date}.",
      "stateFinished": "La data di fine è passata, quindi nessuno riceve una risposta.",
      "subject": "Oggetto",
      "subjectDesc": "Facoltativo. Se resta vuoto, lo sceglie il server di posta.",
      "subjectPlaceholder": "Fuori ufficio",
      "message": "Messaggio",
      "messageDesc": "Ciò che riceve chiunque ti scriva.",
      "messagePlaceholder": "Sono via fino al 15 e risponderò al mio ritorno.",
      "dates": "Date",
      "datesDesc": "Facoltativo. Senza data di inizio la risposta vale da subito, senza data di fine fino a nuovo avviso. Un giorno va da mezzanotte a mezzanotte nel tuo fuso orario.",
      "startDate": "Data di inizio",
      "endDate": "Data di fine",
      "interval": "Rispondi di nuovo allo stesso mittente dopo",
      "intervalDesc": "Chi scrive più volte in quel periodo riceve una sola risposta. Le mailing list e i messaggi automatici non ne ricevono mai.",
      "days": {
        "one": "{count} giorno",
        "other": "{count} giorni"
      },
      "save": "Salva",
      "saved": "Risposta automatica salvata.",
      "turnedOff": "Risposta automatica disattivata.",
      "unsupported": "Questo server di posta non offre risposte automatiche.",
      "ownVacation": "I tuoi filtri inviano già una risposta automatica propria. Rimuovila nell'editor grezzo dei Filtri per configurarne una qui.",
      "errors": {
        "emptyMessage": "Scrivi il messaggio che riceveranno i mittenti, oppure disattiva la risposta automatica.",
        "invalidWindow": "La data di inizio non può essere successiva alla data di fine.",
        "loadError": "Impossibile caricare la risposta automatica.",
        "saveError": "Impossibile salvare la risposta automatica."
      }
    }
  }
};
