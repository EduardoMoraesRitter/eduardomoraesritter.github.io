/* ============================================================

   Eduardo Ritter — Portfolio Script
   ─────────────────────────────────
   01. Language System
   02. Theme System
   03. Scroll Progress Bar
   04. Scroll Reveal (Intersection Observer)
   05. Counter Animation
   06. Mobile Navigation
   07. Smooth Scroll
   08. Dot Grid
   09. Init

   ============================================================ */

import pt from '../i18n/pt.json';
import en from '../i18n/en.json';

const T = { pt, en };

document.addEventListener('DOMContentLoaded', () => {


    /* ==========================================================
       01. LANGUAGE SYSTEM
       ========================================================== */

    function detectLang() {
        const stored = localStorage.getItem('lang');
        if (stored) return stored;
        return (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
    }

    function applyLang(lang) {
        const t = T[lang];
        if (!t) return;

        document.documentElement.setAttribute('data-lang', lang);
        document.documentElement.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en');
        localStorage.setItem('lang', lang);

        const label = document.getElementById('langLabel');
        if (label) label.textContent = lang === 'pt' ? 'EN' : 'PT';

        document.title = lang === 'pt'
            ? 'Eduardo Ritter — Desenvolvedor & Criativo'
            : 'Eduardo Ritter — Developer & Creative';

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key] !== undefined) el.innerHTML = t[key];
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (t[key] !== undefined) el.placeholder = t[key];
        });

        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (t[key] !== undefined) el.setAttribute('aria-label', t[key]);
        });
    }

    document.getElementById('langToggle')?.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-lang') || 'pt';
        applyLang(cur === 'pt' ? 'en' : 'pt');
    });


    /* ==========================================================
       02. THEME SYSTEM
       ========================================================== */

    const prefersColorDark = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    /* Follow OS changes only when user hasn't manually picked a theme */
    prefersColorDark.addEventListener('change', e => {
        if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
    });

    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(cur === 'dark' ? 'light' : 'dark');
    });

    if (!localStorage.getItem('theme')) {
        applyTheme(prefersColorDark.matches ? 'dark' : 'light');
    }


    /* ==========================================================
       03. SCROLL PROGRESS BAR
       ========================================================== */

    const progressBar = document.getElementById('scrollProgress');

    window.addEventListener('scroll', () => {
        if (!progressBar) return;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = total > 0 ? (window.scrollY / total) * 100 + '%' : '0%';
    }, { passive: true });


    /* ==========================================================
       04. SCROLL REVEAL (Intersection Observer)
       ========================================================== */

    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add('is-visible');

            /* Trigger counters inside newly visible sections */
            entry.target.querySelectorAll('[data-counter]').forEach(animateCounter);

            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-section').forEach(el => revealObserver.observe(el));

    /* Hero is already in view on load */
    document.querySelector('.hero')?.classList.add('is-visible');


    /* ==========================================================
       05. COUNTER ANIMATION
       ========================================================== */

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-value'), 10) || 0;
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1400;
        let start = null;

        function step(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
            el.textContent = Math.round(target * eased) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }


    /* ==========================================================
       06. MOBILE NAVIGATION
       ========================================================== */

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        function toggleMenu(open) {
            const isOpen = typeof open === 'boolean' ? open : !navLinks.classList.contains('is-open');

            navLinks.classList.toggle('is-open', isOpen);
            hamburger.classList.toggle('is-open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));

            if (isOpen) {
                document.body.style.overflow = 'hidden';
                document.body.classList.add('menu-is-open');
            } else {
                document.body.style.overflow = '';
                document.body.classList.remove('menu-is-open');
            }
        }

        hamburger.addEventListener('click', () => toggleMenu());

        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => toggleMenu(false));
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navLinks.classList.contains('is-open')) {
                toggleMenu(false);
            }
        });
    }


    /* ==========================================================
       07. SMOOTH SCROLL
       ========================================================== */

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });


    /* ==========================================================
       08. DOT GRID — EFEITO LUPA
       ========================================================== */

    const _hideGrid = document.createElement('style');
    _hideGrid.textContent = 'body::before { display: none !important; }';
    document.head.appendChild(_hideGrid);

    const dotCanvas = document.createElement('canvas');
    dotCanvas.setAttribute('aria-hidden', 'true');
    dotCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;';
    document.body.prepend(dotCanvas);

    const dCtx    = dotCanvas.getContext('2d');
    const GRID     = 30;
    const BASE_R   = 1.5;
    const GLOW_R   = 90;
    const LIGHT_R  = 160;
    const LENS_STR = 0.32;
    const LERP     = 0.08;

    const mPos    = { x: -9999, y: -9999 };
    const mTarget = { x: -9999, y: -9999 };
    let   mReady  = false;

    document.addEventListener('mousemove', e => {
        if (!mReady) { mPos.x = e.clientX; mPos.y = e.clientY; mReady = true; }
        mTarget.x = e.clientX;
        mTarget.y = e.clientY;
    }, { passive: true });

    function isDark() {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    }

    function resizeDotCanvas() {
        dotCanvas.width  = window.innerWidth;
        dotCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeDotCanvas, { passive: true });
    resizeDotCanvas();

    function drawFrame() {
        mPos.x += (mTarget.x - mPos.x) * LERP;
        mPos.y += (mTarget.y - mPos.y) * LERP;

        const w    = dotCanvas.width;
        const h    = dotCanvas.height;
        const dark = isDark();

        dCtx.clearRect(0, 0, w, h);

        if (mReady) {
            const glow = dCtx.createRadialGradient(mPos.x, mPos.y, 0, mPos.x, mPos.y, LIGHT_R);
            glow.addColorStop(0,    dark ? 'rgba(255,255,255,0.04)'  : 'rgba(0,0,0,0.03)');
            glow.addColorStop(0.55, dark ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.008)');
            glow.addColorStop(1,    'rgba(0,0,0,0)');
            dCtx.fillStyle = glow;
            dCtx.fillRect(0, 0, w, h);
        }

        const cols = Math.ceil(w / GRID) + 1;
        const rows = Math.ceil(h / GRID) + 1;

        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c <= cols; c++) {
                const gx = c * GRID;
                const gy = r * GRID;

                let px    = gx;
                let py    = gy;
                let alpha = dark ? 0.045 : 0.055;
                let dotR  = BASE_R;

                if (mReady) {
                    const dx   = gx - mPos.x;
                    const dy   = gy - mPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < GLOW_R && dist > 0.5) {
                        const n = dist / GLOW_R;
                        const z = Math.sqrt(1 - n * n);
                        const lens = (1 / z - 1) * LENS_STR;
                        px = mPos.x + dx * (1 + lens);
                        py = mPos.y + dy * (1 + lens);

                        const boost = (1 - n) * (1 - n);
                        alpha += boost * (dark ? 0.13 : 0.10);
                        dotR  += boost * 0.4;
                    }
                }

                dCtx.fillStyle = dark
                    ? `rgba(255,255,255,${alpha})`
                    : `rgba(0,0,0,${alpha})`;
                dCtx.beginPath();
                dCtx.arc(px, py, dotR, 0, Math.PI * 2);
                dCtx.fill();
            }
        }

        requestAnimationFrame(drawFrame);
    }

    drawFrame();


    /* ==========================================================
       09. INIT
       ========================================================== */

    applyLang(detectLang());

});
