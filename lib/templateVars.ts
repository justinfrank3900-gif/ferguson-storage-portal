export type TemplateVars = {
  contactName?: string | null
  senderName?: string | null
  senderEmail?: string | null
}

export function fillTemplateVars(text: string, vars: TemplateVars): string {
  return text
    .replace(/\{\{contact_name\}\}/g, vars.contactName || '')
    .replace(/\{\{sender_name\}\}/g, vars.senderName || '')
    .replace(/\{\{sender_email\}\}/g, vars.senderEmail || '')
    .replace(/\{\{company_name\}\}/g, 'Ferguson Storage')
}

export function senderNameFromEmail(email: string | null | undefined): string {
  if (!email) return ''
  const local = email.split('@')[0].replace(/[._]+/g, ' ')
  return local.replace(/\b\w/g, (c) => c.toUpperCase())
}
