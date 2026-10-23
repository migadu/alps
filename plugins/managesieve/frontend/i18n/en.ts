export default {
  "settings": {
    "categories": {
      "filters": "Filters",
      "autoReply": "Auto-reply"
    }
  },
  "managesieve": {
    "title": "Filters",
    "description": "Add custom rules on how messages are processed and filed.",
    "loadError": "Could not load the filters.",
    "loadErrorRetry": "Try again",
    "tabs": {
      "switchToRaw": "Raw Editor"
    },
    "warningRawSwitchTitle": "Switch to Raw Mode",
    "warningRawSwitchConfirm": "Switch",
    "warningRawSwitch": "Switching to raw mode means the script will no longer be editable visually. Continue?",
    "toast": {
      "saved": "Rules saved and activated.",
      "deactivated": "Rules deactivated.",
      "valid": "Script is valid!",
      "networkError": "Network error occurred.",
      "autoReplyOn": "The auto-reply is on. Switch it off under Auto-reply before the filters send a vacation reply of their own."
    },
    "visual": {
      "newRule": "New Rule",
      "noRules": "No rules defined.",
      "saveFilters": "Save",
      "deleteRule": "Delete Rule",
      "remove": "Remove",
      "add": "Add",
      "if": "IF",
      "all": "ALL",
      "any": "ANY",
      "ofTheFollowing": "of the following conditions match",
      "then": "THEN",
      "value": "Value",
      "actions": {
        "fileinto": "Move to folder",
        "discard": "Discard (Delete)",
        "redirect": "Redirect to email",
        "stop": "Stop evaluating rules"
      },
      "fields": {
        "subject": "Subject",
        "from": "From",
        "to": "To",
        "body": "Body",
        "size": "Size",
        "emailAddress": "Email Address"
      },
      "operators": {
        "contains": "Contains",
        "not_contains": "Does not contain",
        "is": "Is exactly",
        "not_is": "Is not exactly",
        "over": "Over",
        "under": "Under"
      }
    },
    "raw": {
      "validate": "Validate",
      "save": "Save",
      "script": "Filter script"
    },
    "autoReply": {
      "title": "Auto-reply",
      "description": "Reply automatically to people who write to you while you are away.",
      "enable": "Send an auto-reply",
      "stateActive": "Replying to senders now.",
      "stateActiveUntil": "Replying to senders until {date}.",
      "stateScheduled": "Scheduled to start on {date}.",
      "stateFinished": "The end date has passed, so nobody is being replied to.",
      "subject": "Subject",
      "subjectDesc": "Optional. Left empty, the mail server chooses one.",
      "subjectPlaceholder": "Out of office",
      "message": "Message",
      "messageDesc": "What everyone who writes to you receives.",
      "messagePlaceholder": "I am away until the 15th and will reply when I am back.",
      "dates": "Dates",
      "datesDesc": "Optional. Leave a date empty to leave that end open. A day runs from midnight to midnight in your time zone.",
      "startDate": "Start date",
      "endDate": "End date",
      "interval": "Answer the same sender again after",
      "intervalDesc": "Someone who writes several times within that time gets one reply. Mailing lists and automated mail never get one.",
      "days": {
        "one": "{count} day",
        "other": "{count} days"
      },
      "save": "Save",
      "saved": "Auto-reply saved.",
      "turnedOff": "Auto-reply turned off.",
      "unsupported": "This mail server does not offer automatic replies.",
      "ownVacation": "Your filters already send an automatic reply of their own. Remove it in the raw editor under Filters to set one up here.",
      "errors": {
        "emptyMessage": "Write the message senders will receive, or switch the auto-reply off.",
        "invalidWindow": "The start date cannot be after the end date.",
        "loadError": "Could not load the auto-reply.",
        "saveError": "Could not save the auto-reply."
      }
    }
  }
};
