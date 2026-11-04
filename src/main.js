const header = document.querySelector('[data-header]');
const hero = document.querySelector('.hero');
const heroImage = document.querySelector('[data-hero-image]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');
const themeColor = document.querySelector('meta[name="theme-color"]');

function setTheme(theme, persist = false) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  const switchTo = nextTheme === 'dark' ? 'светлую' : 'тёмную';
  document.documentElement.dataset.theme = nextTheme;
  themeToggle.setAttribute('aria-pressed', String(nextTheme === 'light'));
  themeToggle.setAttribute('aria-label', `Включить ${switchTo} тему`);
  themeLabel.textContent = nextTheme === 'dark' ? 'Светлая' : 'Тёмная';
  themeColor.content = nextTheme === 'dark' ? '#27292e' : '#e8e6e7';

  if (persist) {
    try {
      localStorage.setItem('gerbarium-theme', nextTheme);
    } catch {
      // The selected theme still applies when browser storage is unavailable.
    }
  }
}

setTheme(document.documentElement.dataset.theme);
themeToggle.addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
});

function updateHeader() {
  const threshold = Math.max(hero.offsetHeight - 88, 80);
  header.classList.toggle('is-scrolled', window.scrollY > threshold);
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader);

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  mobileMenu.hidden = true;
  header.classList.remove('menu-open');
}

function openMenu() {
  menuToggle.setAttribute('aria-expanded', 'true');
  mobileMenu.hidden = false;
  header.classList.add('menu-open');
}

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  isOpen ? closeMenu() : openMenu();
});

mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('click', (event) => {
  if (mobileMenu.hidden) return;
  if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) {
    closeMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileMenu.hidden) {
    closeMenu();
    menuToggle.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 700 && !mobileMenu.hidden) closeMenu();
});

const navLinks = [...document.querySelectorAll('[data-nav]')];
const observedSections = navLinks
  .map((link) => document.getElementById(link.dataset.nav))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.nav === entry.target.id);
    });
  });
}, { rootMargin: '-22% 0px -62% 0px', threshold: 0 });

observedSections.forEach((section) => sectionObserver.observe(section));

// A restrained, pointer- and scroll-driven camera drift keeps the key art alive.
let pointerX = 0;
let pointerY = 0;
let currentX = 0;
let currentY = 0;
let currentScroll = 0;

hero.addEventListener('pointermove', (event) => {
  if (reduceMotion.matches || event.pointerType === 'touch') return;
  const rect = hero.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
  pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
});

hero.addEventListener('pointerleave', () => {
  pointerX = 0;
  pointerY = 0;
});

function renderHero() {
  if (!reduceMotion.matches) {
    const scrollTarget = Math.min(window.scrollY / Math.max(hero.offsetHeight, 1), 1) * -24;
    currentX += (pointerX - currentX) * 0.055;
    currentY += (pointerY - currentY) * 0.055;
    currentScroll += (scrollTarget - currentScroll) * 0.08;
    heroImage.style.transform = `translate3d(${currentX.toFixed(2)}px, ${(currentY + currentScroll).toFixed(2)}px, 0) scale(1.055)`;
  }
  requestAnimationFrame(renderHero);
}

requestAnimationFrame(renderHero);

const gallery = document.querySelector('[data-gallery]');
const slides = [...gallery.querySelectorAll('[data-slide]')];
const tabs = [...gallery.querySelectorAll('[data-gallery-to]')];
const galleryCurrent = gallery.querySelector('[data-gallery-current]');
let activeSlide = 0;

function showSlide(index, moveFocus = false) {
  activeSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeSlide;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
    slide.querySelector('[data-image-open]').tabIndex = isActive ? 0 : -1;
  });

  tabs.forEach((tab, tabIndex) => {
    const isActive = tabIndex === activeSlide;
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  galleryCurrent.textContent = String(activeSlide + 1).padStart(2, '0');
  if (moveFocus) tabs[activeSlide].focus();
}

gallery.querySelector('[data-gallery-prev]').addEventListener('click', () => {
  showSlide(activeSlide - 1);
});

gallery.querySelector('[data-gallery-next]').addEventListener('click', () => {
  showSlide(activeSlide + 1);
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => showSlide(Number(tab.dataset.galleryTo)));
});

gallery.querySelector('[data-gallery-tabs]').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    showSlide(activeSlide + (event.key === 'ArrowRight' ? 1 : -1), true);
  }
  if (event.key === 'Home') {
    event.preventDefault();
    showSlide(0, true);
  }
  if (event.key === 'End') {
    event.preventDefault();
    showSlide(slides.length - 1, true);
  }
});

const imageDialog = document.getElementById('image-dialog');
const dialogImage = imageDialog.querySelector('[data-dialog-image]');
const dialogCaption = imageDialog.querySelector('[data-dialog-caption]');

gallery.querySelectorAll('[data-image-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const slide = button.closest('[data-slide]');
    const sourceImage = slide.querySelector('img');
    const title = slide.querySelector('figcaption span').textContent;
    const subtitle = slide.querySelector('figcaption small').textContent;
    dialogImage.src = sourceImage.src;
    dialogImage.alt = sourceImage.alt;
    dialogCaption.textContent = `${title} — ${subtitle}`;
    imageDialog.showModal();
  });
});

document.querySelectorAll('[data-dialog-close]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});
