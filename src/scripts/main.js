/* ============================================================

   Eduardo Ritter — Portfolio Script
   ─────────────────────────────────
   01. Translations
   02. Language System
   03. Theme System
   04. Scroll Progress Bar
   05. Scroll Reveal (Intersection Observer)
   06. Counter Animation
   07. Mobile Navigation
   08. Smooth Scroll
   09. Init

   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {


    /* ==========================================================
       01. TRANSLATIONS
       ========================================================== */

    const T = {

        pt: {
            'nav.home':             'Início',
            'nav.about':            'Sobre',
            'nav.services':         'Serviços',
            'nav.contact':          'Contato',
            'hero.tag':             'Desenvolvedor &amp; Criativo',
            'hero.sub':             'Criando experiências digitais<br>modernas e impactantes.',
            'hero.cta':             'Vamos Conversar',
            'hero.scroll':          'Rolar',
            'about.title':          'Sobre Mim',
            'about.statement':      'Transformo ideias em interfaces <em>precisas</em>, <em>intencionais</em> e <em>premium</em>.',
            'about.bio':            'Sou um desenvolvedor apaixonado por criar interfaces limpas e com visual premium. Foco sempre na melhor experiência para o usuário — cada detalhe importa.',
            'about.stat1':          'Anos de Experiência',
            'about.stat2':          'Projetos Entregues',
            'about.stat3':          'Dedicação',
            'services.title':       'Serviços',
            'services.item1.title': 'Design &amp; UI',
            'services.item1.text':  'Interfaces modernas, responsivas e com atenção precisa aos detalhes visuais.',
            'services.item2.title': 'Desenvolvimento',
            'services.item2.text':  'HTML5, CSS3, JavaScript — código limpo, performático e bem estruturado.',
            'services.item3.title': 'Soluções Digitais',
            'services.item3.text':  'Tecnologia eficiente focada em resolver problemas reais com precisão.',
            'contact.title':        'Entre em Contato',
            'contact.headline':     'Vamos construir<br>algo excepcional.',
            'contact.sub':          'Disponível para novos projetos.',
            'footer.text':          '&copy; 2026 — Todos os direitos reservados.',
        },

        en: {
            'nav.home':             'Home',
            'nav.about':            'About',
            'nav.services':         'Services',
            'nav.contact':          'Contact',
            'hero.tag':             'Developer &amp; Creative',
            'hero.sub':             'Creating modern and<br>impactful digital experiences.',
            'hero.cta':             "Let's Talk",
            'hero.scroll':          'Scroll',
            'about.title':          'About Me',
            'about.statement':      'Transforming ideas into <em>precise</em>, <em>intentional</em>, and <em>premium</em> interfaces.',
            'about.bio':            "I'm a developer passionate about creating clean and premium interfaces. I always focus on the best user experience — every detail matters.",
            'about.stat1':          'Years of Experience',
            'about.stat2':          'Projects Delivered',
            'about.stat3':          'Dedication',
            'services.title':       'Services',
            'services.item1.title': 'Design &amp; UI',
            'services.item1.text':  'Modern, responsive interfaces with precise attention to visual detail.',
            'services.item2.title': 'Development',
            'services.item2.text':  'HTML5, CSS3, JavaScript — clean, performant and well-structured code.',
            'services.item3.title': 'Digital Solutions',
            'services.item3.text':  'Efficient technology focused on solving real problems with precision.',
            'contact.title':        'Get in Touch',
            'contact.headline':     "Let's build<br>something exceptional.",
            'contact.sub':          'Available for new projects.',
            'footer.text':          '&copy; 2026 — All rights reserved.',
        },

    };


    /* ==========================================================
       02. LANGUAGE SYSTEM
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
    }

    document.getElementById('langToggle')?.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-lang') || 'pt';
        applyLang(cur === 'pt' ? 'en' : 'pt');
    });


    /* ==========================================================
       03. THEME SYSTEM
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
       04. SCROLL PROGRESS BAR
       ========================================================== */

    const progressBar = document.getElementById('scrollProgress');

    window.addEventListener('scroll', () => {
        if (!progressBar) return;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = total > 0 ? (window.scrollY / total) * 100 + '%' : '0%';
    }, { passive: true });


    /* ==========================================================
       05. SCROLL REVEAL (Intersection Observer)
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
       06. COUNTER ANIMATION
       ========================================================== */

    function animateCounter(el) {
        const target   = parseInt(el.getAttribute('data-value'), 10) || 0;
        const suffix   = el.getAttribute('data-suffix') || '';
        const duration = 1400;
        let start      = null;

        function step(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
            el.textContent = Math.round(target * eased) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }


    /* ==========================================================
       07. MOBILE NAVIGATION
       ========================================================== */

    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const open = navLinks.classList.toggle('is-open');
            hamburger.classList.toggle('is-open', open);
            hamburger.setAttribute('aria-expanded', String(open));
        });

        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                navLinks.classList.remove('is-open');
                hamburger.classList.remove('is-open');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }


    /* ==========================================================
       08. SMOOTH SCROLL
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
       09. INIT
       ========================================================== */

    applyLang(detectLang());

});
