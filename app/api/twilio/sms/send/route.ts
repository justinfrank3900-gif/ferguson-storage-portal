import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/twilio'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { messageId, contactId, to, body, fromOverride, mediaUrl } = await request.json()
  if (!messageId || !contactId || !to || !body) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  let fromNumber = fromOverride as string | undefined
  if (!fromNumber) {
    const { data: contact } = await supabase.from('contacts').select('active_number').eq('id', contactId).maybeSingle()
    fromNumber = contact?.active_number || undefined
  }
  if (!fromNumber) {
    const { data: defaultNumber } = await supabase
      .from('comm_phone_numbers')
      .select('phone_number')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    fromNumber = defaultNumber?.phone_number
  }

  if (!fromNumber) {
    await supabase
      .from('comm_messages')
      .update({ status: 'failed', error_detail: 'No phone number available — add one in Communications → Numbers.' })
      .eq('id', messageId)
    return NextResponse.json({ error: 'no_number' }, { status: 400 })
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    await supabase
      .from('comm_messages')
      .update({ status: 'failed', error_detail: 'Twilio not connected yet — add TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN in Vercel.' })
      .eq('id', messageId)
    return NextResponse.json({ error: 'twilio_not_configured' }, { status: 400 })
  }

  try {
    const result = await sendSms({ from: fromNumber, to, body, mediaUrl: mediaUrl || undefined })
    await supabase
      .from('comm_messages')
      .update({ status: 'sent', from_number: fromNumber, to_number: to, twilio_sid: result.sid, error_detail: null })
      .eq('id', messageId)
    await supabase.from('contacts').update({ active_number: fromNumber }).eq('id', contactId)
    return NextResponse.json({ ok: true, from: fromNumber })
  } catch (err) {
    const detail = String(err).slice(0, 500)
    await supabase.from('comm_messages').update({ status: 'failed', error_detail: detail }).eq('id', messageId)
    return NextResponse.json({ error: 'send_failed', detail }, { status: 500 })
  }
}
