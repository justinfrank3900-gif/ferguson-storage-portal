import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTwilioSignature } from '@/lib/twilio'

export async function POST(request: Request) {
  const formData = await request.formData()
  const body: Record<string, string> = {}
  formData.forEach((value, key) => {
    body[key] = String(value)
  })

  const signature = request.headers.get('x-twilio-signature') || ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms/inbound`
  const verified = await verifyTwilioSignature({ url, signature, body })
  if (!verified) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const from = body.From
  const to = body.To
  const text = body.Body || ''
  const twilioSid = body.MessageSid

  const supabase = createAdminClient()

  const { data: contact } = await supabase.from('contacts').select('id').eq('phone', from).limit(1).maybeSingle()

  if (contact) {
    await supabase.from('comm_messages').insert({
      contact_id: contact.id,
      channel: 'sms',
      direction: 'inbound',
      body: text,
      status: 'received',
      from_number: from,
      to_number: to,
      twilio_sid: twilioSid,
    })
    await supabase.from('contacts').update({ active_number: to }).eq('id', contact.id)
  }

  return new NextResponse('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } })
}
