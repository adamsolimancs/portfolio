// api/contact.mjs
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

  const { name, email, message } = body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

  const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PRIVATE_KEY } = process.env;
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PRIVATE_KEY) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${EMAILJS_PRIVATE_KEY.trim()}`,
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: { name, email, message },
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('EmailJS REST failed:', r.status, text);
      return res.status(502).json({ error: 'Send failed', details: text });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}
