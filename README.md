# Abduaziz Tojiboyev — Portfolio

HTML + CSS + JavaScript (frontend) va Node.js/Express (backend).

## Ishga tushirish

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # yoki: npm start
```

Brauzerda oching: http://localhost:3000

## Tuzilma

```
portfolio/
├── server.js              # Express server
├── routes/api.js          # /api/projects, /api/contact, /api/health
├── data/projects.json     # Loyihalar ma'lumoti (shu yerdan tahrirlang)
├── data/messages.json     # Kelgan xabarlar (avtomatik yaratiladi)
├── public/
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js
│   ├── js/tailwind.config.js
│   ├── js/theme-init.js
│   └── images/profile.jpg
├── .env.example
└── package.json
```
