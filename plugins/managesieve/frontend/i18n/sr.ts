export default {
  "settings": {
    "categories": {
      "filters": "Filteri",
      "autoReply": "Automatski odgovor"
    }
  },
  "managesieve": {
    "title": "Filteri",
    "description": "Dodajte prilagođena pravila o tome kako se poruke obrađuju i odlažu.",
    "tabs": {
      "switchToRaw": "Sirov uređivač"
    },
    "warningRawSwitchTitle": "Prebaci u sirovi režim",
    "warningRawSwitchConfirm": "Prebaci",
    "warningRawSwitch": "Prelazak na sirovi režim znači da se skripta više neće moći vizuelno uređivati. Nastaviti?",
    "toast": {
      "saved": "Pravila su sačuvana i aktivirana.",
      "deactivated": "Pravila su deaktivirana.",
      "valid": "Skripta je validna!",
      "networkError": "Došlo je do mrežne greške.",
      "autoReplyOn": "Automatski odgovor je uključen. Isključite ga pod Automatski odgovor pre nego što filteri pošalju sopstveni."
    },
    "visual": {
      "newRule": "Novo pravilo",
      "noRules": "Nema definisanih pravila.",
      "saveFilters": "Sačuvaj pravila",
      "deleteRule": "Obriši pravilo",
      "remove": "Ukloni",
      "add": "Dodaj",
      "if": "AKO SE",
      "all": "SVI",
      "any": "BILO KOJI",
      "ofTheFollowing": "od sledećih uslova podudaraju",
      "then": "ONDA",
      "value": "Vrednost",
      "actions": {
        "fileinto": "Premesti u fasciklu",
        "discard": "Odbaci (obriši)",
        "redirect": "Prosledi na e-poštu",
        "stop": "Prestani sa procenom pravila"
      },
      "fields": {
        "subject": "Naslov",
        "from": "Od",
        "to": "Za",
        "body": "Telo",
        "size": "Veličina",
        "emailAddress": "Adresa e-pošte"
      },
      "operators": {
        "contains": "Sadrži",
        "not_contains": "Ne sadrži",
        "is": "Je tačno",
        "not_is": "Nije tačno",
        "over": "Preko",
        "under": "Ispod"
      }
    },
    "raw": {
      "validate": "Validiraj",
      "save": "Sačuvaj"
    },
    "autoReply": {
      "title": "Automatski odgovor",
      "description": "Automatski odgovorite svima koji vam pišu dok ste odsutni.",
      "enable": "Šalji automatski odgovor",
      "stateActive": "Pošiljaoci sada dobijaju odgovor.",
      "stateActiveUntil": "Pošiljaoci dobijaju odgovor do {date}.",
      "stateScheduled": "Počinje {date}.",
      "stateFinished": "Datum završetka je prošao, pa niko ne dobija odgovor.",
      "subject": "Naslov",
      "subjectDesc": "Nije obavezno. Ako ostane prazan, server pošte sam bira naslov.",
      "subjectPlaceholder": "Van kancelarije",
      "message": "Poruka",
      "messageDesc": "Ono što dobija svako ko vam piše.",
      "messagePlaceholder": "Do 15. nisam tu, odgovoriću po povratku.",
      "dates": "Datumi",
      "datesDesc": "Nije obavezno. Ostavite datum prazan da taj kraj ostane otvoren. Dan traje od ponoći do ponoći u vašoj vremenskoj zoni.",
      "startDate": "Datum početka",
      "endDate": "Datum završetka",
      "interval": "Ponovo odgovoriti istom pošiljaocu nakon",
      "intervalDesc": "Ko piše više puta u tom periodu, dobija jedan odgovor. Dopisne liste i automatske poruke ga nikada ne dobijaju.",
      "days": {
        "one": "{count} dana",
        "few": "{count} dana",
        "other": "{count} dana"
      },
      "save": "Sačuvaj",
      "saved": "Automatski odgovor je sačuvan.",
      "turnedOff": "Automatski odgovor je isključen.",
      "unsupported": "Ovaj server pošte ne nudi automatske odgovore.",
      "ownVacation": "Vaši filteri već šalju sopstveni automatski odgovor. Uklonite ga u sirovom uređivaču pod Filteri da biste ovde podesili novi.",
      "errors": {
        "emptyMessage": "Napišite poruku koju će pošiljaoci dobiti ili isključite automatski odgovor.",
        "invalidWindow": "Datum početka ne može biti posle datuma završetka.",
        "loadError": "Automatski odgovor nije mogao da se učita.",
        "saveError": "Automatski odgovor nije mogao da se sačuva."
      }
    }
  }
};
