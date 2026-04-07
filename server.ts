import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // SendGrid Setup
  sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

  // API Routes
  app.post('/api/send-email', async (req, res) => {
    const { to, subject, text, html } = req.body;

    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: 'SendGrid API key not configured' });
    }

    const msg = {
      to,
      from: process.env.SENDGRID_VERIFIED_SENDER || '',
      subject,
      text,
      html: html || text,
    };

    try {
      await sgMail.send(msg);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error sending email:', error.response?.body || error.message);
      res.status(500).json({ error: 'Failed to send email', details: error.response?.body || error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
