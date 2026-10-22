export default {
  "settings": {
    "categories": {
      "filters": "Filtres",
      "autoReply": "Réponse automatique"
    }
  },
  "managesieve": {
    "title": "Filtres",
    "description": "Ajoutez des règles personnalisées sur la façon dont les messages sont traités et classés.",
    "loadError": "Impossible de charger les filtres.",
    "loadErrorRetry": "Réessayer",
    "tabs": {
      "switchToRaw": "Éditeur Brut"
    },
    "warningRawSwitchTitle": "Passer en mode brut",
    "warningRawSwitchConfirm": "Passer",
    "warningRawSwitch": "Passer en mode brut signifie que le script ne sera plus modifiable visuellement. Continuer ?",
    "toast": {
      "saved": "Règles enregistrées et activées.",
      "deactivated": "Règles désactivées.",
      "valid": "Le script est valide !",
      "networkError": "Une erreur réseau s'est produite.",
      "autoReplyOn": "La réponse automatique est activée. Désactivez-la dans Réponse automatique avant que les filtres n'envoient la leur."
    },
    "visual": {
      "newRule": "Nouvelle Règle",
      "noRules": "Aucune règle définie.",
      "saveFilters": "Enregistrer les Règles",
      "deleteRule": "Supprimer la Règle",
      "remove": "Supprimer",
      "add": "Ajouter",
      "if": "SI",
      "all": "TOUTES",
      "any": "N'IMPORTE QUELLE",
      "ofTheFollowing": "des conditions suivantes sont remplies",
      "then": "ALORS",
      "actions": {
        "fileinto": "Déplacer vers le dossier",
        "discard": "Rejeter (Supprimer)",
        "redirect": "Rediriger vers l'e-mail",
        "stop": "Arrêter d'évaluer les règles"
      },
      "fields": {
        "subject": "Sujet",
        "from": "De",
        "to": "À",
        "body": "Corps",
        "size": "Taille",
        "emailAddress": "Adresse e-mail"
      },
      "operators": {
        "contains": "Contient",
        "not_contains": "Ne contient pas",
        "is": "Est exactement",
        "not_is": "N'est pas exactement",
        "over": "Plus de",
        "under": "Moins de"
      }
    },
    "raw": {
      "validate": "Valider",
      "save": "Enregistrer"
    },
    "autoReply": {
      "title": "Réponse automatique",
      "description": "Répondez automatiquement aux personnes qui vous écrivent pendant votre absence.",
      "enable": "Envoyer une réponse automatique",
      "stateActive": "Les expéditeurs reçoivent une réponse en ce moment.",
      "stateActiveUntil": "Les expéditeurs reçoivent une réponse jusqu'au {date}.",
      "stateScheduled": "Commence le {date}.",
      "stateFinished": "La date de fin est passée : plus personne ne reçoit de réponse.",
      "subject": "Objet",
      "subjectDesc": "Facultatif. S'il est vide, le serveur de messagerie en choisit un.",
      "subjectPlaceholder": "Absent du bureau",
      "message": "Message",
      "messageDesc": "Ce que reçoit chaque personne qui vous écrit.",
      "messagePlaceholder": "Je suis absent jusqu'au 15 et répondrai à mon retour.",
      "dates": "Dates",
      "datesDesc": "Facultatif. Laissez une date vide pour laisser cette borne ouverte. Un jour va de minuit à minuit dans votre fuseau horaire.",
      "startDate": "Date de début",
      "endDate": "Date de fin",
      "interval": "Répondre à nouveau au même expéditeur après",
      "intervalDesc": "Une personne qui écrit plusieurs fois pendant cette période reçoit une seule réponse. Les listes de diffusion et les messages automatiques n'en reçoivent jamais.",
      "days": {
        "one": "{count} jour",
        "other": "{count} jours"
      },
      "save": "Enregistrer",
      "saved": "Réponse automatique enregistrée.",
      "turnedOff": "Réponse automatique désactivée.",
      "unsupported": "Ce serveur de messagerie ne propose pas de réponses automatiques.",
      "ownVacation": "Vos filtres envoient déjà leur propre réponse automatique. Supprimez-la dans l'éditeur brut des Filtres pour en configurer une ici.",
      "errors": {
        "emptyMessage": "Écrivez le message que recevront les expéditeurs, ou désactivez la réponse automatique.",
        "invalidWindow": "La date de début ne peut pas être postérieure à la date de fin.",
        "loadError": "Impossible de charger la réponse automatique.",
        "saveError": "Impossible d'enregistrer la réponse automatique."
      }
    }
  }
};
