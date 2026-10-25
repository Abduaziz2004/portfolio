/* ==========================================================================
   Abduaziz Tojiboyev — Portfolio | main.js
   Barcha interaktivlik shu yerda. Tarkibi:
     1. Yordamchi funksiyalar (qs, qsa, escapeHtml, toast)
     2. Mavzu (dark / light)
     3. Cursor glow
     4. Mobil menyu
     5. Typewriter effekti
     6. Ko'nikmalar filtri
     7. Loyiha modali (ma'lumot Node.js API'dan olinadi)
     8. CLI terminal
     9. Nusxalash (clipboard)
    10. Aloqa formasi (Node.js API'ga yuboriladi)
    11. Profil rasmi fallback + footer yili
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- 1. Yordamchilar ---------- */
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const toastEl = qs('#toast');
  const toastMsg = qs('#toast-message');
  const toastIcon = qs('#toast-icon');
  let toastTimer;

  function showToast(message, type = 'success') {
    toastMsg.textContent = message;
    toastIcon.className =
      type === 'error'
        ? 'fa-solid fa-circle-exclamation text-red-400'
        : 'fa-solid fa-circle-check text-emerald-400';
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3500);
  }

  /* ---------- 2. Dark / Light mavzu ---------- */
  const root = document.documentElement;
  const darkIcon = qs('#theme-toggle-dark-icon');
  const lightIcon = qs('#theme-toggle-light-icon');

  function syncThemeIcons() {
    const isDark = root.classList.contains('dark');
    darkIcon.classList.toggle('hidden', isDark);
    lightIcon.classList.toggle('hidden', !isDark);
  }
  syncThemeIcons();

  qs('#theme-toggle').addEventListener('click', () => {
    const goDark = !root.classList.contains('dark');
    root.classList.toggle('dark', goDark);
    try {
      localStorage.setItem('color-theme', goDark ? 'dark' : 'light');
    } catch (_) {}
    syncThemeIcons();
  });

  /* ---------- 3. Cursor glow ---------- */
  const cursorGlow = qs('#cursor-glow');
  window.addEventListener('pointermove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  });

  /* ---------- 4. Mobil menyu ---------- */
  const mobileMenu = qs('#mobile-menu');
  qs('#mobile-menu-btn').addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  qsa('.mobile-link').forEach((link) =>
    link.addEventListener('click', () => mobileMenu.classList.add('hidden'))
  );

  /* ---------- 5. Typewriter ---------- */
  const words = [
    'Python Dasturchiman',
    'C++ Yozaman',
    '3D Modellayman',
    'Tarmoq Injeneriman',
    'FarDTU Talabasi',
  ];
  const typewriterEl = qs('#typewriter');
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const current = words[wordIndex];
    charIndex += isDeleting ? -1 : 1;
    typewriterEl.textContent = current.substring(0, charIndex);

    let delay = isDeleting ? 40 : 80;
    if (!isDeleting && charIndex === current.length) {
      delay = 1800;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 300;
    }
    setTimeout(type, delay);
  }
  type();

  /* ---------- 6. Ko'nikmalar filtri ---------- */
  const skillButtons = qsa('.skill-btn');
  const skillCards = qsa('.skill-card');

  skillButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.filter;

      skillButtons.forEach((b) => {
        b.classList.remove('active', 'bg-brand-600', 'text-white', 'shadow-md');
        b.classList.add('glass-card', 'text-slate-600', 'dark:text-slate-300');
      });
      btn.classList.add('active', 'bg-brand-600', 'text-white', 'shadow-md');
      btn.classList.remove('glass-card', 'text-slate-600', 'dark:text-slate-300');

      skillCards.forEach((card) => {
        const visible = category === 'all' || card.dataset.category === category;
        card.style.display = visible ? '' : 'none';
      });
    });
  });

  /* ---------- 7. Loyiha modali ---------- */
  const modal = qs('#project-modal');
  const modalTitle = qs('#modal-title');
  const modalBody = qs('#modal-body');
  let projectsCache = null;

  async function loadProjects() {
    if (projectsCache) return projectsCache;
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Server javob bermadi');
    projectsCache = await res.json();
    return projectsCache;
  }

  function renderProject(project) {
    const tech = project.tech
      .map(
        (t) =>
          `<span class="px-2.5 py-1 rounded-full text-xs font-mono bg-brand-500/10 text-brand-500 border border-brand-500/20">${escapeHtml(t)}</span>`
      )
      .join(' ');
    const features = project.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('');

    modalTitle.textContent = project.title;
    modalBody.innerHTML = `
      <div class="flex flex-wrap gap-2">${tech}</div>
      <p><strong>Tavsif:</strong> ${escapeHtml(project.description)}</p>
      <ul class="list-disc pl-5 space-y-1">${features}</ul>
    `;
  }

  async function openProjectModal(key) {
    try {
      const projects = await loadProjects();
      if (!projects[key]) return;
      renderProject(projects[key]);
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      showToast("Loyiha ma'lumotini yuklab bo'lmadi. Server ishlayaptimi?", 'error');
    }
  }

  function closeProjectModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  qsa('[data-project]').forEach((card) =>
    card.addEventListener('click', () => openProjectModal(card.dataset.project))
  );
  qsa('[data-close-modal]').forEach((btn) => btn.addEventListener('click', closeProjectModal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProjectModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeProjectModal();
  });

  /* ---------- 8. CLI terminal ---------- */
  const terminalForm = qs('#terminal-form');
  const terminalInput = qs('#terminal-input');
  const terminalBody = qs('#terminal-body');
  const history = [];
  let historyIndex = 0;

  const commands = {
    help: () => `
      <p class="text-amber-400">Mavjud buyruqlar:</p>
      <p><strong>about</strong> — Abduaziz haqida qisqacha</p>
      <p><strong>skills</strong> — Asosiy ko'nikmalar ro'yxati</p>
      <p><strong>projects</strong> — Loyihalar ro'yxati</p>
      <p><strong>contact</strong> — Aloqa ma'lumotlari</p>
      <p><strong>education</strong> — Ta'lim joyi</p>
      <p><strong>clear</strong> — Konsolni tozalash</p>`,
    about: () =>
      'Abduaziz Tojiboyev — FarDTU talabasi, Python/C++ dasturchi va 3D mutaxassis.',
    skills: () => 'Python, C++, 3ds Max, Cisco Packet Tracer, HTML/CSS/JS, Node.js, Ingliz tili (B2).',
    projects: () =>
      'Smart Telegram Assistant Bot | Algoritmik Boshqaruv Tizimi | Enterprise Campus Tarmoq | Interyer 3D Vizualizatsiya',
    contact: () =>
      'Telegram: @ADD_885 | Email: abduazizt2004@gmail.com | Tel: +998935033504',
    education: () => "Farg'ona davlat texnika universiteti (FarDTU)",
  };

  function printToTerminal(command) {
    const cmdLine = document.createElement('div');
    cmdLine.innerHTML = `<span class="text-accent-cyan">abduaziz$&nbsp;</span><span class="text-white">${escapeHtml(command)}</span>`;
    terminalBody.appendChild(cmdLine);

    const response = document.createElement('div');
    response.className = 'text-slate-300 ml-2 mb-2';

    if (commands[command]) {
      response.innerHTML = commands[command]();
    } else {
      response.innerHTML = `<span class="text-red-400">Noma'lum buyruq: '${escapeHtml(command)}'. Yordam uchun 'help' deb yozing.</span>`;
    }
    terminalBody.appendChild(response);
  }

  terminalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const command = terminalInput.value.trim().toLowerCase();
    if (!command) return;

    history.push(command);
    historyIndex = history.length;
    terminalInput.value = '';

    if (command === 'clear') {
      terminalBody.innerHTML = '';
      return;
    }
    printToTerminal(command);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  });

  // Yuqoriga / pastga o'q — buyruqlar tarixi
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && historyIndex > 0) {
      e.preventDefault();
      terminalInput.value = history[--historyIndex];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      historyIndex = Math.min(historyIndex + 1, history.length);
      terminalInput.value = history[historyIndex] || '';
    }
  });

  /* ---------- 9. Nusxalash ---------- */
  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      // Eski brauzerlar uchun zaxira usul
      const tmp = document.createElement('input');
      tmp.value = text;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      tmp.remove();
    }
    showToast(`${label} nusxalandi!`);
  }

  qsa('[data-copy]').forEach((btn) =>
    btn.addEventListener('click', () => copyToClipboard(btn.dataset.copy, btn.dataset.label))
  );

  /* ---------- 10. Aloqa formasi ---------- */
  const contactForm = qs('#contact-form');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = qs('button[type="submit"]', contactForm);
    const payload = {
      name: qs('#form-name').value.trim(),
      contact: qs('#form-contact').value.trim(),
      subject: qs('#form-subject').value.trim(),
      message: qs('#form-message').value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-60', 'cursor-not-allowed');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error || 'Xabar yuborilmadi');

      showToast(`Rahmat, ${payload.name}! Xabaringiz qabul qilindi.`);
      contactForm.reset();
    } catch (err) {
      showToast(err.message || "Xatolik yuz berdi. Telegram orqali yozing: @ADD_885", 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
    }
  });

  /* ---------- 11. Profil rasmi fallback + yil ---------- */
  const avatar = qs('img[src$="profile.jpg"]');
  const fallback = qs('.fallback-avatar');
  if (avatar && fallback) {
    avatar.addEventListener('error', () => {
      avatar.classList.add('hidden');
      fallback.classList.remove('hidden');
    });
  }

  qs('#current-year').textContent = new Date().getFullYear();
})();
