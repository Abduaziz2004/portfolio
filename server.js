'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Proxy (Render, Railway, Nginx...) ortida ishlaganda haqiqiy IP ni olish uchun
app.set('trust proxy', 1);

// Xavfsizlik sarlavhalari.
// CSP o'chirilgan: Tailwind CDN va Google Fonts/FontAwesome tashqi manbalardan yuklanadi.
// Tailwind'ni build qilib (npm paket) ishlatsangiz, CSP ni yoqish tavsiya etiladi.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '10kb' }));

// Statik fayllar (index.html, css, js, images)
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isProd ? '7d' : 0,
    etag: true,
  })
);

// API
app.use('/api', apiRoutes);

// 404 — API uchun JSON, qolganlari uchun bosh sahifa
app.use('/api', (req, res) => res.status(404).json({ error: 'Topilmadi' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Markaziy xatoliklar ishlovchisi
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: "Noto'g'ri JSON format" });
  }
  console.error('[XATO]', err);
  res.status(500).json({ error: 'Serverda ichki xatolik' });
});

app.listen(PORT, () => {
  console.log(`✅ Portfolio server ishga tushdi: http://localhost:${PORT}`);
});
