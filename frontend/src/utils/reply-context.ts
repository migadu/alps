/**
 * What a reply carries so it joins the conversation it answers: the message it
 * answers, the conversation before that message, and where the message is, so
 * the server can mark it answered once the reply is sent.
 */
export interface ReplyContext {
  inReplyTo?: string;
  references?: string[];
  replyMailbox?: string;
  replyUid?: string;
}

export function replyContext(message: any, mailbox: string): ReplyContext {
  const context: ReplyContext = {};
  const id = message?.Envelope?.MessageID || message?.Envelope?.MessageId;
  if (id) {
    context.inReplyTo = id;
    context.references = Array.isArray(message.References) ? [...message.References] : [];
  }
  if (message?.UID !== undefined && message?.UID !== null && mailbox) {
    context.replyMailbox = mailbox;
    context.replyUid = String(message.UID);
  }
  return context;
}

/** The form fields a composer sends for its reply context. */
export function appendReplyFields(formData: FormData, context: ReplyContext) {
  if (context.inReplyTo) {
    formData.append('in_reply_to', context.inReplyTo);
  }
  if (context.references?.length) {
    formData.append('references', context.references.join(' '));
  }
  if (context.replyMailbox && context.replyUid) {
    formData.append('reply_mailbox', context.replyMailbox);
    formData.append('reply_uid', context.replyUid);
  }
}
