import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTwilioSignature } from '@/lib/twilio';

export async function POST(request: Request) {
  const formData = await request.formData();
  const body: Record<string, string> = {};
  formData.forEach((value, key) => { body[key] = String(value); });

  const signature = request.headers.get('x-twilio-signature') || '';
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms/status`;
  const verified = await verifyTwilioSignature({ url, signature, body });
  if (!verified) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const twilioSid = body.MessageSid;
  const status = body.MessageStatus; // queued | sent | delivered | undelivered | failed
  const errorMessage = body.ErrorMessage;

  const supabase = createAdminClient();
  await supabase.from('comm_messages').update({
    status,
    error_detail: (status === 'failed' || status === 'undelivered') ? (errorMessage || 'Delivery failed') : null,
  }).eq('twilio_sid', twilioSid);

  return new NextResponse('', { status: 200 });
}
