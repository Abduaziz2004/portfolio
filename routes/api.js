'use strict';

const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

/* ---------- Yordamchilar ---------- */

// Bir vaqtda kelgan xabarlar faylni buzmasligi uchun navbat
let writeQueue = Promise.resolve();

function saveMessage(entry) {
  writeQueue = writeQueue.then(async () => {
    let list = [];
    try {
      list = JSON.parse(await fs.readFile(MESSAGES_FILE, 'utf-8'));
    } catch (_) {
      /* fayl hali yo'q — bo'sh ro'yxatdan boshlaymiz */
    }
    list.push(entry);
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(list, null, 2), 'utf-8');
  });
  return writeQueue;
}

function escapeTelegramHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Ixtiyoriy: .env da TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID bo'lsa, xabar Telegramga ham keladi
async function notifyTelegram({ name, contact, subject, message }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `📩 <b>Portfolio'dan yangi xabar</b>\n\n` +
    `👤 <b>Ism:</b> ${escapeTelegramHtml(name)}\n` +
    `📞 <b>Aloqa:</b> ${escapeTelegramHtml(contact)}\n` +
    `📝 <b>Mavzu:</b> ${escapeTelegramHtml(subject)}\n\n` +
    `${escapeTelegramHtml(message)}`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  if (!res.ok) throw new Error(`Telegram API xatosi: ${res.status}`);
}

function validateContact(body = {}) {
  const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const data = {
    name: clean(body.name, 80),
    contact: clean(body.contact, 120),
    subject: clean(body.subject, 150),
    message: clean(body.message, 2000),
  };

  if (!data.name || !data.contact || !data.subject || !data.message) {
    return { error: "Barcha maydonlarni to'ldiring." };
  }
  if (data.message.length < 10) {
    return { error: "Xabar kamida 10 ta belgidan iborat bo'lsin." };
  }
  return { data };
}

/* ---------- Rate limit: spamdan himoya ---------- */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  limit: 5, // har bir IP uchun 5 ta xabar
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Juda ko'p urinish. Iltimos, keyinroq qayta urinib ko'ring." },
});

/* ---------- Routelar ---------- */

// GET /api/health — server ishlayaptimi?
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// GET /api/projects — loyihalar (data/projects.json dan)
router.get('/projects', async (req, res, next) => {
  try {
    const raw = await fs.readFile(PROJECTS_FILE, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    next(err);
  }
});

// POST /api/contact — aloqa formasi
router.post('/contact', contactLimiter, async (req, res, next) => {
  try {
    const { data, error } = validateContact(req.body);
    if (error) return res.status(400).json({ error });

    await saveMessage({
      ...data,
      ip: req.ip,
      createdAt: new Date().toISOString(),
    });

    // Telegram xatosi foydalanuvchiga xato ko'rsatmasligi kerak (xabar baribir saqlandi)
    notifyTelegram(data).catch((e) => console.error('[Telegram]', e.message));

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
