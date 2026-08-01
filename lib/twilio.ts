const TWILIO_API = 'https://api.twilio.com/2010-04-01';

function authHeader() {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
}

export async function sendSms(params: { from: string; to: string; body: string; mediaUrl?: string }): Promise<{ sid: string; status: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const form = new URLSearchParams({ From: params.from, To: params.to, Body: params.body });
  if (params.mediaUrl) form.append('MediaUrl', params.mediaUrl);
  const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio SMS send failed: ${errText}`);
  }
  return res.json();
}

/** Kicks off an outbound call: Twilio calls the closer first, then bridges to the lead once answered. */
export async function initiateCall(params: { from: string; to: string; twimlUrl: string; statusCallbackUrl: string }): Promise<{ sid: string; status: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Calls.json`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: params.from,
      To: params.to,
      Url: params.twimlUrl,
      StatusCallback: params.statusCallbackUrl,
      StatusCallbackEvent: 'initiated ringing answered completed',
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio call failed: ${errText}`);
  }
  return res.json();
}

/** Simple TwiML builder — enough for a bridge-call and basic voicemail-style prompts to start. */
export function twimlDial(number: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial>${number}</Dial></Response>`;
}

export function twimlSay(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${message}</Say></Response>`;
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Whisper message + "press any key to connect" prompt, played to whoever answers the outbound call. */
export function twimlWhisperGather(message: string, gatherActionUrl: string, timeoutSeconds: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>` +
    `<Gather numDigits="1" timeout="${timeoutSeconds}" action="${gatherActionUrl}" method="POST">` +
    `<Say>${escapeXml(message)}</Say>` +
    `<Say>Press any key to connect.</Say>` +
    `</Gather>` +
    `<Say>No response received. Goodbye.</Say><Hangup/>` +
    `</Response>`;
}

/** Bridges the call to the lead's number once the closer presses a key. */
export function twimlBridge(leadPhone: string, statusCallbackUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>` +
    `<Dial timeout="30" action="${statusCallbackUrl}"><Number>${leadPhone}</Number></Dial>` +
    `</Response>`;
}

/** Validates that a request actually came from Twilio, using the X-Twilio-Signature header. */
export async function verifyTwilioSignature(params: {
  url: string;
  signature: string;
  body: Record<string, string>;
}): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const crypto = await import('crypto');
  const sortedKeys = Object.keys(params.body).sort();
  const data = sortedKeys.reduce((acc, key) => acc + key + params.body[key], params.url);
  const expected = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
  return expected === params.signature;
}
