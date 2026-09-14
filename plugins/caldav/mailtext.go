package alpscaldav

import (
	"fmt"
	"strings"
	"time"

	"github.com/emersion/go-ical"
	"github.com/migadu/alps/internal/itip"
)

// The words of the readable part of a scheduling email, in the user's
// language. The recipient's calendar reads the calendar part, whose content is
// the same in any language; this is for whoever reads the mail itself.
type mailWords struct {
	// Subject prefixes.
	invitation, updated, cancelled, task     string
	accepted, tentative, declined, completed string
	// Labels of the invitation text.
	when, where, organizer string
	// Sentences, each taking the attendee's name.
	hasAccepted, mayAttend, hasDeclined, hasCompleted string
	isCancelled                                       string
}

var mailDictionaries = map[string]mailWords{
	"en": {
		invitation: "Invitation", updated: "Updated invitation", cancelled: "Cancelled", task: "Task",
		accepted: "Accepted", tentative: "Tentative", declined: "Declined", completed: "Completed",
		when: "When", where: "Where", organizer: "Organizer",
		hasAccepted: "%s has accepted.", mayAttend: "%s may attend.", hasDeclined: "%s has declined.", hasCompleted: "%s has completed the task.",
		isCancelled: "This has been cancelled.",
	},
	"da": {
		invitation: "Invitation", updated: "Opdateret invitation", cancelled: "Aflyst", task: "Opgave",
		accepted: "Accepteret", tentative: "Måske", declined: "Afvist", completed: "Udført",
		when: "Hvornår", where: "Hvor", organizer: "Arrangør",
		hasAccepted: "%s har accepteret.", mayAttend: "%s deltager måske.", hasDeclined: "%s har afvist.", hasCompleted: "%s har udført opgaven.",
		isCancelled: "Dette er blevet aflyst.",
	},
	"de": {
		invitation: "Einladung", updated: "Aktualisierte Einladung", cancelled: "Abgesagt", task: "Aufgabe",
		accepted: "Angenommen", tentative: "Vorläufig", declined: "Abgelehnt", completed: "Erledigt",
		when: "Wann", where: "Wo", organizer: "Organisator",
		hasAccepted: "%s hat zugesagt.", mayAttend: "%s nimmt vielleicht teil.", hasDeclined: "%s hat abgesagt.", hasCompleted: "%s hat die Aufgabe erledigt.",
		isCancelled: "Dies wurde abgesagt.",
	},
	"es": {
		invitation: "Invitación", updated: "Invitación actualizada", cancelled: "Cancelado", task: "Tarea",
		accepted: "Aceptado", tentative: "Provisional", declined: "Rechazado", completed: "Completado",
		when: "Cuándo", where: "Dónde", organizer: "Organizador",
		hasAccepted: "%s ha aceptado.", mayAttend: "%s quizás asista.", hasDeclined: "%s ha rechazado.", hasCompleted: "%s ha completado la tarea.",
		isCancelled: "Esto se ha cancelado.",
	},
	"fr": {
		invitation: "Invitation", updated: "Invitation mise à jour", cancelled: "Annulé", task: "Tâche",
		accepted: "Accepté", tentative: "Provisoire", declined: "Refusé", completed: "Terminé",
		when: "Quand", where: "Où", organizer: "Organisateur",
		hasAccepted: "%s a accepté.", mayAttend: "%s participera peut-être.", hasDeclined: "%s a refusé.", hasCompleted: "%s a terminé la tâche.",
		isCancelled: "Ceci a été annulé.",
	},
	"it": {
		invitation: "Invito", updated: "Invito aggiornato", cancelled: "Annullato", task: "Attività",
		accepted: "Accettato", tentative: "Provvisorio", declined: "Rifiutato", completed: "Completato",
		when: "Quando", where: "Dove", organizer: "Organizzatore",
		hasAccepted: "%s ha accettato.", mayAttend: "%s forse parteciperà.", hasDeclined: "%s ha rifiutato.", hasCompleted: "%s ha completato l'attività.",
		isCancelled: "Questo è stato annullato.",
	},
	"pt": {
		invitation: "Convite", updated: "Convite atualizado", cancelled: "Cancelado", task: "Tarefa",
		accepted: "Aceite", tentative: "Provisório", declined: "Recusado", completed: "Concluído",
		when: "Quando", where: "Onde", organizer: "Organizador",
		hasAccepted: "%s aceitou.", mayAttend: "%s talvez participe.", hasDeclined: "%s recusou.", hasCompleted: "%s concluiu a tarefa.",
		isCancelled: "Isto foi cancelado.",
	},
	"rs": {
		invitation: "Позивница", updated: "Ажурирана позивница", cancelled: "Отказано", task: "Задатак",
		accepted: "Прихваћено", tentative: "Можда", declined: "Одбијено", completed: "Завршено",
		when: "Када", where: "Где", organizer: "Организатор",
		hasAccepted: "%s прихвата.", mayAttend: "%s можда долази.", hasDeclined: "%s одбија.", hasCompleted: "%s: задатак је завршен.",
		isCancelled: "Ово је отказано.",
	},
	"sr": {
		invitation: "Pozivnica", updated: "Ažurirana pozivnica", cancelled: "Otkazano", task: "Zadatak",
		accepted: "Prihvaćeno", tentative: "Možda", declined: "Odbijeno", completed: "Završeno",
		when: "Kada", where: "Gde", organizer: "Organizator",
		hasAccepted: "%s prihvata.", mayAttend: "%s možda dolazi.", hasDeclined: "%s odbija.", hasCompleted: "%s: zadatak je završen.",
		isCancelled: "Ovo je otkazano.",
	},
}

// wordsFor returns the words for a language the frontend names ("de",
// "pt-PT"), or English.
func wordsFor(lang string) mailWords {
	lang = strings.ToLower(lang)
	if words, ok := mailDictionaries[lang]; ok {
		return words
	}
	if i := strings.IndexAny(lang, "-_"); i > 0 {
		if words, ok := mailDictionaries[lang[:i]]; ok {
			return words
		}
	}
	return mailDictionaries["en"]
}

// describe returns the subject and readable text of a scheduling message.
func (w mailWords) describe(cal *ical.Calendar, acct *schedulingAccount) (subject, text string) {
	item := itip.Master(cal)
	if item == nil {
		return "", ""
	}
	summary, _ := item.Props.Text(ical.PropSummary)

	switch itip.Method(cal) {
	case itip.MethodReply:
		prefix, sentence := w.accepted, w.hasAccepted
		name := ""
		if attendees := itip.Attendees(item); len(attendees) > 0 {
			name = attendees[0].Name
			if name == "" {
				name = attendees[0].Address
			}
			switch attendees[0].Status {
			case itip.Tentative:
				prefix, sentence = w.tentative, w.mayAttend
			case itip.Declined:
				prefix, sentence = w.declined, w.hasDeclined
			case itip.Completed:
				prefix, sentence = w.completed, w.hasCompleted
			}
		}
		return prefix + ": " + summary, fmt.Sprintf(sentence, name) + "\n\n" + summary + "\n"

	case itip.MethodCancel:
		return w.cancelled + ": " + summary, summary + "\n\n" + w.isCancelled + "\n"
	}

	prefix := w.invitation
	if item.Name == ical.CompToDo {
		prefix = w.task
	} else if itip.Sequence(item) > 0 {
		prefix = w.updated
	}
	var b strings.Builder
	b.WriteString(summary)
	b.WriteString("\n\n")
	when := item.Props.Get(ical.PropDateTimeStart)
	if item.Name == ical.CompToDo {
		when = item.Props.Get(ical.PropDue)
	}
	if when != nil {
		if t, isDate, err := itip.Time(cal, when); err == nil {
			b.WriteString(w.when + ": " + formatWhen(t, isDate, when) + "\n")
		}
	}
	if location, _ := item.Props.Text(ical.PropLocation); location != "" {
		b.WriteString(w.where + ": " + location + "\n")
	}
	if org := itip.Organizer(item); org != nil {
		name := org.Name
		if name == "" {
			name = org.Address
		} else {
			name += " <" + org.Address + ">"
		}
		b.WriteString(w.organizer + ": " + name + "\n")
	}
	return prefix + ": " + summary, b.String()
}

// formatWhen writes a time in the zone it was given in, named: the server
// does not know where the reader is.
func formatWhen(t time.Time, isDate bool, prop *ical.Prop) string {
	if isDate {
		return t.Format("2006-01-02")
	}
	if tzid := prop.Params.Get(ical.ParamTimezoneID); tzid != "" {
		return t.Format("2006-01-02 15:04") + " (" + tzid + ")"
	}
	return t.UTC().Format("2006-01-02 15:04") + " UTC"
}
