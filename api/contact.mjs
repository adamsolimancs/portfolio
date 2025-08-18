// api/contact.mjs
import { send } from '@emailjs/nodejs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { name, email, message } = req.body;

  try {
    await send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      { name, email, message },
      { publicKey: process.env.EMAILJS_PUBLIC_KEY },
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}
