export default {
  "settings": {
    "categories": {
      "filters": "Filtros",
      "autoReply": "Respuesta automática"
    }
  },
  "managesieve": {
    "title": "Filtros",
    "description": "Añada reglas personalizadas sobre cómo se procesan y archivan los mensajes.",
    "tabs": {
      "switchToRaw": "Editor Raw"
    },
    "warningRawSwitchTitle": "Cambiar a modo Raw",
    "warningRawSwitchConfirm": "Cambiar",
    "warningRawSwitch": "Cambiar al modo raw significa que el script ya no será editable visualmente. ¿Continuar?",
    "toast": {
      "saved": "Reglas guardadas y activadas.",
      "deactivated": "Reglas desactivadas.",
      "valid": "¡El script es válido!",
      "networkError": "Ocurrió un error de red.",
      "autoReplyOn": "La respuesta automática está activada. Desactívela en Respuesta automática antes de que los filtros envíen una propia."
    },
    "visual": {
      "newRule": "Nueva Regla",
      "noRules": "No hay reglas definidas.",
      "saveFilters": "Guardar Reglas",
      "deleteRule": "Eliminar Regla",
      "remove": "Eliminar",
      "add": "Añadir",
      "if": "SI",
      "all": "TODAS",
      "any": "CUALQUIERA",
      "ofTheFollowing": "de las siguientes condiciones coinciden",
      "then": "ENTONCES",
      "actions": {
        "fileinto": "Mover a la carpeta",
        "discard": "Descartar (Eliminar)",
        "redirect": "Redirigir a correo",
        "stop": "Dejar de evaluar reglas"
      },
      "fields": {
        "subject": "Asunto",
        "from": "De",
        "to": "Para",
        "body": "Cuerpo",
        "size": "Tamaño",
        "emailAddress": "Dirección de correo electrónico"
      },
      "operators": {
        "contains": "Contiene",
        "not_contains": "No contiene",
        "is": "Es exactamente",
        "not_is": "No es exactamente",
        "over": "Más de",
        "under": "Menos de"
      }
    },
    "raw": {
      "validate": "Validar",
      "save": "Guardar"
    },
    "autoReply": {
      "title": "Respuesta automática",
      "description": "Responda automáticamente a quienes le escriban mientras está fuera.",
      "enable": "Enviar una respuesta automática",
      "stateActive": "Los remitentes reciben una respuesta ahora.",
      "stateActiveUntil": "Los remitentes reciben una respuesta hasta el {date}.",
      "stateScheduled": "Empieza el {date}.",
      "stateFinished": "La fecha de fin ya pasó, así que nadie recibe respuesta.",
      "subject": "Asunto",
      "subjectDesc": "Opcional. Si se deja vacío, el servidor de correo elige uno.",
      "subjectPlaceholder": "Fuera de la oficina",
      "message": "Mensaje",
      "messageDesc": "Lo que recibe cada persona que le escribe.",
      "messagePlaceholder": "Estoy fuera hasta el día 15 y responderé a mi regreso.",
      "dates": "Fechas",
      "datesDesc": "Opcional. Deje una fecha vacía para dejar ese extremo abierto. Un día va de medianoche a medianoche en su zona horaria.",
      "startDate": "Fecha de inicio",
      "endDate": "Fecha de fin",
      "interval": "Volver a responder al mismo remitente después de",
      "intervalDesc": "Quien escriba varias veces en ese tiempo recibe una sola respuesta. Las listas de correo y los mensajes automáticos nunca reciben ninguna.",
      "days": {
        "one": "{count} día",
        "other": "{count} días"
      },
      "save": "Guardar",
      "saved": "Respuesta automática guardada.",
      "turnedOff": "Respuesta automática desactivada.",
      "unsupported": "Este servidor de correo no ofrece respuestas automáticas.",
      "ownVacation": "Sus filtros ya envían una respuesta automática propia. Elimínela en el editor raw de Filtros para configurar una aquí.",
      "errors": {
        "emptyMessage": "Escriba el mensaje que recibirán los remitentes o desactive la respuesta automática.",
        "invalidWindow": "La fecha de inicio no puede ser posterior a la fecha de fin.",
        "loadError": "No se pudo cargar la respuesta automática.",
        "saveError": "No se pudo guardar la respuesta automática."
      }
    }
  }
};
