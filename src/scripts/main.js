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
            'nav.home': 'Início',
            'nav.about': 'Sobre',
            'nav.services': 'Jornada',
            'nav.recognition': 'Impacto',
            'nav.expertise': 'Expertise',
            'nav.contact': 'Contato',
            'hero.tag': 'Staff AI Engineer &amp; Global NASA Winner',
            'hero.sub': 'Projetando o futuro com IA Generativa<br>e arquiteturas escaláveis.',
            'hero.cta': 'Vamos Conversar',
            'hero.scroll': 'Rolar',
            'about.title': 'Sobre Mim',
            'about.statement': 'Transformo complexidade técnica em <em>impacto real</em> com IA.',
            'about.bio': 'Sou Staff AI Engineer com mais de 15 anos de experiência projetando sistemas de alta escala. Vencedor Global do NASA Space Apps Challenge e reconhecido pela IBM como um dos Top 50 Inovadores em IA do Brasil, combino visão de produto com engenharia profunda para criar soluções que transformam indústrias.',
            'about.stat1': 'Anos de Experiência',
            'about.stat2': 'Prêmio Global NASA',
            'about.stat3': 'Top 50 AI IBM',
            'services.title': 'Expertise',
            'services.item1.title': 'Engenharia de IA &amp; LLMs',
            'services.item1.text': 'Arquiteturas de RAG, Agentes Autônomos e Prompt Engineering avançado com GPT-4 e Gemini.',
            'services.item2.title': 'Arquitetura de Sistemas',
            'services.item2.text': 'Sistemas distribuídos, Cloud (GCP/AWS) e pipelines de dados escaláveis para milhões de usuários.',
            'services.item3.title': 'Inovação de Produto',
            'services.item3.text': 'Liderança técnica focada em resultados de negócio, como o aumento de 70% em conversão na Contabilizei.',
            'experience.title': 'Jornada',
            'experience.job1.title': 'Staff AI Engineer @ Contabilizei',
            'experience.job1.date': '2024 — Presente',
            'experience.job2.title': 'Head of AI @ BrandLovrs',
            'experience.job2.date': '2023 — 2024',
            'experience.job3.title': 'Senior Data Scientist @ XP Inc.',
            'experience.job3.date': '2021 — 2023',
            'recognition.title': 'Impacto & Mídia',
            'recognition.nasa.title': 'NASA Space Apps Global Winner',
            'recognition.nasa.text': 'Vencedor mundial com o projeto Poseidon, uma solução de IA que utiliza Redes Neurais Convolucionais (Deep Learning) e imagens de satélite do tipo SAR (Radar de Abertura Sintética) para identificar manchas de óleo nos oceanos mesmo através de nuvens ou à noite. Desenvolvido em resposta ao desastre ambiental de 2019 no Brasil, o sistema automatiza o monitoramento marítimo global, reduzindo drasticamente o tempo de resposta para mitigar impactos ecológicos e econômicos.',
            'recognition.ibm.title': 'C0D3RS Championship',
            'recognition.ibm.text': 'Finalista representando o Brasil na minissérie exclusiva da IBM e Prime Video. Uma competição épica entre os melhores desenvolvedores da América Latina, utilizando IBM Cloud e IA para resolver problemas reais da sociedade em um formato de reality show tecnológico.',
            'recognition.media.title': 'Talks & Podcast',
            'recognition.media.text': 'Discussões na Alura, Brazil Journal e outros canais sobre IA aplicada ao ambiente e tecnologia de ponta.',
            'recognition.talk.title': 'Jornada até a NASA',
            'recognition.talk.text': 'Palestra completa no EducaXperience sobre tecnologia, inovação e os bastidores da vitória global.',
            'recognition.media.video2.title': 'Inovação na Prática',
            'recognition.media.video2.text': 'Entrevista técnica e insights sobre o desenvolvimento de produtos digitais e o ecossistema de tecnologia.',
            'contact.title': 'Entre em Contato',
            'contact.headline': 'Vamos construir<br>o próximo nível.',
            'contact.sub': 'Disponível para parcerias e projetos de alto impacto.',
            'experience.cv': 'Ver Currículo Completo (PDF)',
            'footer.text': '&copy; 2026 — Eduardo Moraes Ritter. Todos os direitos reservados.',
        },

        en: {
            'nav.home': 'Home',
            'nav.about': 'About',
            'nav.services': 'Journey',
            'nav.recognition': 'Impact',
            'nav.expertise': 'Expertise',
            'nav.contact': 'Contact',
            'hero.tag': 'Staff AI Engineer &amp; Global NASA Winner',
            'hero.sub': 'Designing the future with Generative AI<br>and scalable architectures.',
            'hero.cta': "Let's Talk",
            'hero.scroll': 'Scroll',
            'about.title': 'About Me',
            'about.statement': 'Transforming technical complexity into <em>real impact</em> with AI.',
            'about.bio': "I'm a Staff AI Engineer with over 15 years of experience designing high-scale systems. Global Winner of the NASA Space Apps Challenge and recognized by IBM as one of the Top 50 AI Innovators in Brazil, I combine product vision with deep engineering to create solutions that transform industries.",
            'about.stat1': 'Years of Experience',
            'about.stat2': 'NASA Global Award',
            'about.stat3': 'Top 50 AI IBM',
            'services.title': 'Expertise',
            'services.item1.title': 'AI Engineering &amp; LLMs',
            'services.item1.text': 'RAG architectures, Autonomous Agents, and advanced Prompt Engineering with GPT-4 and Gemini.',
            'services.item2.title': 'System Architecture',
            'services.item2.text': 'Distributed systems, Cloud (GCP/AWS), and scalable data pipelines for millions of users.',
            'services.item3.title': 'Product Innovation',
            'services.item3.text': 'Technical leadership focused on business results, such as the 70% conversion increase at Contabilizei.',
            'experience.title': 'Journey',
            'experience.job1.title': 'Staff AI Engineer @ Contabilizei',
            'experience.job1.date': '2024 — Present',
            'experience.job2.title': 'Head of AI @ BrandLovrs',
            'experience.job2.date': '2023 — 2024',
            'experience.job3.title': 'Senior Data Scientist @ XP Inc.',
            'experience.job3.date': '2021 — 2023',
            'recognition.title': 'Impact & Media',
            'recognition.nasa.title': 'NASA Space Apps Global Winner',
            'recognition.nasa.text': 'Global winner with Project Poseidon, an AI solution using Convolutional Neural Networks (Deep Learning) and SAR (Synthetic Aperture Radar) satellite imagery to identify ocean oil spills even through clouds or at night. Developed in response to the 2019 environmental disaster in Brazil, the system automates global maritime monitoring, drastically reducing response time to mitigate ecological and economic impacts.',
            'recognition.ibm.title': 'C0D3RS Championship',
            'recognition.ibm.text': 'Finalist representing Brazil in the exclusive IBM and Prime Video miniseries. An epic competition among the best developers in Latin America, using IBM Cloud and AI to solve real-world problems in a tech reality show format.',
            'recognition.media.title': 'Talks & Podcasts',
            'recognition.media.text': 'Deep dives on Alura, Brazil Journal, and other media outlets about applied AI and cutting-edge tech.',
            'recognition.talk.title': 'Journey to NASA',
            'recognition.talk.text': 'Full keynote at EducaXperience about technology, innovation, and the behind-the-scenes of the global victory.',
            'recognition.media.video2.title': 'Innovation in Practice',
            'recognition.media.video2.text': 'Technical interview and insights on digital product development and the technology ecosystem.',
            'contact.title': 'Get in Touch',
            'contact.headline': "Let's build<br>the next level.",
            'contact.sub': 'Available for partnerships and high-impact projects.',
            'experience.cv': 'View Full Resume (PDF)',
            'footer.text': '&copy; 2026 — Eduardo Moraes Ritter. All rights reserved.',
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
       07. MOBILE NAVIGATION
       ========================================================== */

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        function toggleMenu(open) {
            const isOpen = typeof open === 'boolean' ? open : !navLinks.classList.contains('is-open');
            
            navLinks.classList.toggle('is-open', isOpen);
            hamburger.classList.toggle('is-open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
            
            // Lock body scroll and add class for CSS styling
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
        
        // Close menu on resize if screen becomes wide
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navLinks.classList.contains('is-open')) {
                toggleMenu(false);
            }
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
       09. DOT GRID — EFEITO LUPA
       ========================================================== */

    // Canvas substitui o grid CSS estático
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
    const GLOW_R   = 90;  // raio da distorção dos pontos
    const LIGHT_R  = 160; // raio do pool de luz
    const LENS_STR = 0.32; // força do fisheye (suave)
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

        const w     = dotCanvas.width;
        const h     = dotCanvas.height;
        const dark  = isDark();

        dCtx.clearRect(0, 0, w, h);

        // Pool de luz suave (mais fraco)
        if (mReady) {
            const glow = dCtx.createRadialGradient(mPos.x, mPos.y, 0, mPos.x, mPos.y, LIGHT_R);
            glow.addColorStop(0,   dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)');
            glow.addColorStop(0.55, dark ? 'rgba(255,255,255,0.012)': 'rgba(0,0,0,0.008)');
            glow.addColorStop(1,    'rgba(0,0,0,0)');
            dCtx.fillStyle = glow;
            dCtx.fillRect(0, 0, w, h);
        }

        // Pontos com fisheye suave + brilho leve perto do cursor
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

                        // Fisheye: empurra pontos radialmente pra fora
                        const lens = (1 / z - 1) * LENS_STR;
                        px = mPos.x + dx * (1 + lens);
                        py = mPos.y + dy * (1 + lens);

                        // Leve brilho extra baseado na distância original
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
       10. CUSTOM CURSOR
       ========================================================== */

    const cursorDot  = document.createElement('div');
    const cursorRing = document.createElement('div');
    cursorDot.className  = 'cursor-dot';
    cursorRing.className = 'cursor-ring';
    document.body.append(cursorDot, cursorRing);

    let cursorX = -200, cursorY = -200;
    let ringX   = -200, ringY   = -200;
    const RING_LERP = 0.12;

    document.addEventListener('mousemove', e => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        cursorDot.style.left = cursorX + 'px';
        cursorDot.style.top  = cursorY + 'px';
    }, { passive: true });

    (function animateCursorRing() {
        ringX += (cursorX - ringX) * RING_LERP;
        ringY += (cursorY - ringY) * RING_LERP;
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top  = ringY + 'px';
        requestAnimationFrame(animateCursorRing);
    })();

    // Hover state on interactive elements
    const HOVER_SELECTORS = 'a, button, [role="button"], .service-item, .recognition-card, .stat, input, textarea';
    document.querySelectorAll(HOVER_SELECTORS).forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
    document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-click'));

    // Hide cursor when it leaves the window
    document.addEventListener('mouseleave', () => {
        cursorDot.style.opacity  = '0';
        cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursorDot.style.opacity  = '1';
        cursorRing.style.opacity = '1';
    });


    /* ==========================================================
       11. INIT
       ========================================================== */

    applyLang(detectLang());

});
