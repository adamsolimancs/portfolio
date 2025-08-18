// api/contact.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import emailjs from 'emailjs-com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { name, email, message } = req.body;

  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      { name, email, message },
      process.env.EMAILJS_PUBLIC_KEY!
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}
