export default {
  "settings": {
    "categories": {
      "filters": "Filter",
      "autoReply": "Automatische Antwort"
    }
  },
  "managesieve": {
    "title": "Filter",
    "description": "Fügen Sie benutzerdefinierte Regeln hinzu, wie Nachrichten verarbeitet und abgelegt werden.",
    "loadError": "Die Filter konnten nicht geladen werden.",
    "loadErrorRetry": "Erneut versuchen",
    "tabs": {
      "switchToRaw": "Raw-Editor"
    },
    "warningRawSwitchTitle": "In den Raw-Modus wechseln",
    "warningRawSwitchConfirm": "Wechseln",
    "warningRawSwitch": "Beim Wechsel in den Raw-Modus kann das Skript nicht mehr visuell bearbeitet werden. Fortfahren?",
    "toast": {
      "saved": "Regeln gespeichert und aktiviert.",
      "deactivated": "Regeln deaktiviert.",
      "valid": "Skript ist gültig!",
      "networkError": "Netzwerkfehler aufgetreten.",
      "autoReplyOn": "Die automatische Antwort ist eingeschaltet. Schalten Sie sie unter Automatische Antwort aus, bevor die Filter selbst eine senden."
    },
    "visual": {
      "newRule": "Neue Regel",
      "noRules": "Keine Regeln definiert.",
      "saveFilters": "Regeln speichern",
      "deleteRule": "Regel löschen",
      "remove": "Entfernen",
      "add": "Hinzufügen",
      "if": "WENN",
      "all": "ALLE",
      "any": "EINE",
      "ofTheFollowing": "der folgenden Bedingungen erfüllt sind",
      "then": "DANN",
      "value": "Wert",
      "ruleNumber": "Regel {number}",
      "conditionNumber": "Bedingung {number}",
      "actionNumber": "Aktion {number}",
      "matchMode": "Zu erfüllende Bedingungen",
      "field": "Feld",
      "operator": "Vergleich",
      "action": "Aktion",
      "folder": "Ordner",
      "actions": {
        "fileinto": "In Ordner verschieben",
        "discard": "Verwerfen (Löschen)",
        "redirect": "An E-Mail weiterleiten",
        "stop": "Regelauswertung stoppen"
      },
      "fields": {
        "subject": "Betreff",
        "from": "Von",
        "to": "An",
        "body": "Inhalt",
        "size": "Größe",
        "emailAddress": "E-Mail-Adresse"
      },
      "operators": {
        "contains": "Enthält",
        "not_contains": "Enthält nicht",
        "is": "Ist genau",
        "not_is": "Ist nicht genau",
        "over": "Über",
        "under": "Unter"
      }
    },
    "raw": {
      "validate": "Validieren",
      "save": "Speichern",
      "script": "Filterskript"
    },
    "autoReply": {
      "title": "Automatische Antwort",
      "description": "Antworten Sie automatisch allen, die Ihnen während Ihrer Abwesenheit schreiben.",
      "enable": "Automatische Antwort senden",
      "stateActive": "Absender erhalten jetzt eine Antwort.",
      "stateActiveUntil": "Absender erhalten bis {date} eine Antwort.",
      "stateScheduled": "Beginnt am {date}.",
      "stateFinished": "Das Enddatum ist vorbei, niemand erhält mehr eine Antwort.",
      "subject": "Betreff",
      "subjectDesc": "Optional. Bleibt er leer, wählt der Mailserver einen.",
      "subjectPlaceholder": "Nicht im Büro",
      "message": "Nachricht",
      "messageDesc": "Das erhält jeder, der Ihnen schreibt.",
      "messagePlaceholder": "Ich bin bis zum 15. nicht da und antworte nach meiner Rückkehr.",
      "dates": "Zeitraum",
      "datesDesc": "Optional. Ohne Startdatum gilt die Antwort ab sofort, ohne Enddatum bis auf Weiteres. Ein Tag reicht von Mitternacht bis Mitternacht in Ihrer Zeitzone.",
      "startDate": "Startdatum",
      "endDate": "Enddatum",
      "interval": "Demselben Absender erneut antworten nach",
      "intervalDesc": "Wer in dieser Zeit mehrmals schreibt, erhält eine Antwort. Mailinglisten und automatische Nachrichten erhalten nie eine.",
      "days": {
        "one": "{count} Tag",
        "other": "{count} Tagen"
      },
      "save": "Speichern",
      "saved": "Automatische Antwort gespeichert.",
      "turnedOff": "Automatische Antwort ausgeschaltet.",
      "unsupported": "Dieser Mailserver bietet keine automatischen Antworten an.",
      "ownVacation": "Ihre Filter senden bereits selbst eine automatische Antwort. Entfernen Sie diese im Raw-Editor unter Filter, um hier eine einzurichten.",
      "errors": {
        "emptyMessage": "Schreiben Sie die Nachricht, die Absender erhalten, oder schalten Sie die automatische Antwort aus.",
        "invalidWindow": "Das Startdatum darf nicht nach dem Enddatum liegen.",
        "loadError": "Die automatische Antwort konnte nicht geladen werden.",
        "saveError": "Die automatische Antwort konnte nicht gespeichert werden."
      }
    }
  }
};
