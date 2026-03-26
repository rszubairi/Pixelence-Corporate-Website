// ── i18n System ──
const LANG_COUNTRY_MAP = {
    KR: 'ko',
    JP: 'ja',
    DE: 'de',
    FR: 'fr'
};

const SUPPORTED_LANGS = ['en', 'ko', 'ja', 'de', 'fr'];
const DEFAULT_LANG = 'en';

function resolveKey(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

function applyTranslations(lang) {
    if (typeof TRANSLATIONS === 'undefined') return;
    const dict = TRANSLATIONS[lang];
    if (!dict) return;

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = resolveKey(dict, key);
        if (val) el.textContent = val;
    });

    // innerHTML (for elements with inner HTML like <strong> tags)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const val = resolveKey(dict, key);
        if (val) el.innerHTML = val;
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = resolveKey(dict, key);
        if (val) el.placeholder = val;
    });

    // Page title
    const pageKey = document.documentElement.dataset.page;
    if (pageKey) {
        const titleKey = pageKey + '.pageTitle';
        const titleVal = resolveKey(dict, titleKey);
        if (titleVal) document.title = titleVal;
    }

    // Update html lang attribute
    document.documentElement.lang = lang;

    // Update active state on language switcher
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update the current language display
    const flag = document.getElementById('current-lang-flag');
    if (flag) flag.textContent = lang.toUpperCase();
}

async function detectLanguage() {
    // 1. Check localStorage first
    const saved = localStorage.getItem('pixelence_lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

    // 2. Try geolocation
    try {
        const resp = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        const data = await resp.json();
        const countryCode = data.country_code || data.country;
        const detected = LANG_COUNTRY_MAP[countryCode];
        if (detected) return detected;
    } catch (e) {
        console.warn('Geolocation detection failed, defaulting to English.', e);
    }

    // 3. Fallback to browser language
    const browserLang = navigator.language?.substring(0, 2);
    if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;

    return DEFAULT_LANG;
}

function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    localStorage.setItem('pixelence_lang', lang);
    applyTranslations(lang);
}

async function initI18n() {
    const lang = await detectLanguage();
    applyTranslations(lang);

    // Language switcher toggle
    const langBtn = document.querySelector('.lang-btn');
    const langDropdown = document.querySelector('.lang-dropdown');

    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('open');
        });

        document.addEventListener('click', () => {
            langDropdown.classList.remove('open');
        });

        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', () => {
                const newLang = option.dataset.lang;
                setLanguage(newLang);
                langDropdown.classList.remove('open');
            });
        });
    }
}

// ── Cookie Consent ──
function initCookieConsent() {
    const banner = document.getElementById('cookie-consent');
    if (!banner) return;

    const consent = localStorage.getItem('pixelence_cookie_consent');
    if (consent) return;

    banner.style.display = 'flex';

    document.getElementById('cookie-accept').addEventListener('click', () => {
        localStorage.setItem('pixelence_cookie_consent', 'accepted');
        banner.style.display = 'none';
    });

    document.getElementById('cookie-decline').addEventListener('click', () => {
        localStorage.setItem('pixelence_cookie_consent', 'declined');
        banner.style.display = 'none';
    });
}

// ── Main DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Sticky Navbar & Scroll Effects
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            if (navActions) navActions.classList.toggle('active');
        });

        // Close menu when a nav link is clicked
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                if (navActions) navActions.classList.remove('active');
            });
        });
    }

    // 3. Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = navbar.offsetHeight;
                window.scrollTo({
                    top: target.offsetTop - navHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        for (let i = 0; i < revealElements.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = revealElements[i].getBoundingClientRect().top;
            const elementVisible = 150;

            if (elementTop < windowHeight - elementVisible) {
                revealElements[i].classList.add('active');

                // Trigger counter if the reveal contains a counter
                const counters = revealElements[i].querySelectorAll('.counter');
                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const updateCount = () => {
                        const count = +counter.innerText;
                        const speed = 200;
                        const inc = target / speed;

                        if (count < target) {
                            counter.innerText = Math.ceil(count + inc);
                            setTimeout(updateCount, 15);
                        } else {
                            counter.innerText = target;
                            if (target > 1000) {
                                counter.innerText = target.toLocaleString();
                            }
                        }
                    };
                    if (counter.innerText === "0") {
                        updateCount();
                    }
                });
            }
        }
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // 5. Initialize i18n (applies translations)
    await initI18n();

    // 6. Initialize cookie consent (after i18n so banner is translated)
    initCookieConsent();
});
