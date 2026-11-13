const header = document.querySelector('[data-header]');
const hero = document.querySelector('.hero');
const heroLayers = [...document.querySelectorAll('[data-parallax-layer]')];
const heroContent = document.querySelector('[data-hero-content]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');
const themeColor = document.querySelector('meta[name="theme-color"]');
const parallaxStrength = 2;

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

// Факты: прокручиваем — блоки сменяют друг друга на одном месте
const factStack = document.querySelector('[data-fact-stack]');
const factPanels = factStack ? [...factStack.querySelectorAll('[data-fact-panel]')] : [];
let factActive = -1;
let factTick = false;

function updateFactStack() {
  if (!factStack) return;
  const rect = factStack.getBoundingClientRect();
  const scrollable = rect.height - window.innerHeight;
  if (scrollable <= 0) return;

  const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
  const idx = Math.min(Math.floor(progress * factPanels.length), factPanels.length - 1);

  if (idx !== factActive) {
    factActive = idx;
    factPanels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === idx);
      panel.classList.toggle('is-past', i < idx);
    });
  }
}

function onFactScroll() {
  if (factTick) return;
  factTick = true;
  requestAnimationFrame(() => {
    updateFactStack();
    factTick = false;
  });
}

window.addEventListener('scroll', onFactScroll, { passive: true });
window.addEventListener('resize', onFactScroll);
updateFactStack();

// Семь плоскостей создают 2.5D-глубину без WebGL и тяжёлых библиотек.
let pointerX = 0;
let pointerY = 0;
let currentX = 0;
let currentY = 0;
let currentScroll = 0;
let heroFrame = 0;

hero.addEventListener('pointermove', (event) => {
  if (reduceMotion.matches || event.pointerType === 'touch') return;
  const rect = hero.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
});

hero.addEventListener('pointerleave', () => {
  pointerX = 0;
  pointerY = 0;
});

function renderHero() {
  if (reduceMotion.matches) {
    heroLayers.forEach((layer) => { layer.style.transform = ''; });
    heroContent.style.transform = '';
    heroFrame = 0;
    return;
  }

  const scrollTarget = Math.min(Math.max(window.scrollY / Math.max(hero.offsetHeight, 1), 0), 1);
  currentX += (pointerX - currentX) * 0.075;
  currentY += (pointerY - currentY) * 0.075;
  currentScroll += (scrollTarget - currentScroll) * 0.09;

  heroLayers.forEach((layer) => {
    const depth = Number(layer.dataset.depth);
    const scrollDepth = Number(layer.dataset.scroll);

    const x = -currentX * depth * 25 * parallaxStrength;
    const y = (
      -currentY * depth * 16
      + currentScroll * scrollDepth
    ) * parallaxStrength;

    layer.style.transform =
      `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  });

  const titleX = -currentX * 5 * parallaxStrength;
  const titleY = (
    -currentY * 3
    + currentScroll * 8
  ) * parallaxStrength;
  heroContent.style.transform = `translate(-50%, -50%) translate3d(${titleX.toFixed(2)}px, ${titleY.toFixed(2)}px, 0)`;
  heroFrame = requestAnimationFrame(renderHero);
}

function startHeroMotion() {
  if (!heroFrame) heroFrame = requestAnimationFrame(renderHero);
}

startHeroMotion();
reduceMotion.addEventListener('change', startHeroMotion);

// Слайдер сцен: переключение слайдов
const scene = document.querySelector('[data-scene]');
const slides = scene ? [...scene.querySelectorAll('[data-slide]')] : [];
const prevSlideBtn = scene ? scene.querySelector('[data-slide-prev]') : null;
const nextSlideBtn = scene ? scene.querySelector('[data-slide-next]') : null;
const slideCurrentEl = scene ? scene.querySelector('[data-slide-current]') : null;
let slideIndex = 0;
let scenePointerX = 0;
let scenePointerY = 0;
let sceneCurrentX = 0;
let sceneCurrentY = 0;
let sceneFrame = 0;

function activeSceneLayers() {
  return [...slides[slideIndex].querySelectorAll('[data-scene-layer]')];
}

function showSlide(nextIndex) {
  slideIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));

  slides.forEach((slide, i) => {
    const isActive = i === slideIndex;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
  });

  // Стрелок может не быть — слайдер листается скроллом
  if (prevSlideBtn) prevSlideBtn.disabled = slideIndex === 0;
  if (nextSlideBtn) nextSlideBtn.disabled = slideIndex === slides.length - 1;
  if (slideCurrentEl) slideCurrentEl.textContent = String(slideIndex + 1).padStart(2, '0');

  // Сброс накопленного смещения, чтобы новая сцена не «дёргалась» с места
  sceneCurrentX = 0;
  sceneCurrentY = 0;
}

if (scene && slides.length) {
  if (prevSlideBtn) prevSlideBtn.addEventListener('click', () => showSlide(slideIndex - 1));
  if (nextSlideBtn) nextSlideBtn.addEventListener('click', () => showSlide(slideIndex + 1));

  scene.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showSlide(slideIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showSlide(slideIndex + 1);
    }
  });

  showSlide(0);

  scene.addEventListener('pointermove', (event) => {
    if (reduceMotion.matches || event.pointerType === 'touch') return;
    const rect = scene.getBoundingClientRect();
    scenePointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    scenePointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  scene.addEventListener('pointerleave', () => {
    scenePointerX = 0;
    scenePointerY = 0;
  });
}

function renderScene() {
  if (reduceMotion.matches) {
    if (slides.length) activeSceneLayers().forEach((layer) => { layer.style.transform = ''; });
    sceneCurrentX = 0;
    sceneCurrentY = 0;
    sceneFrame = 0;
    return;
  }

  const rect = scene.getBoundingClientRect();

  // За пределами видимости цикл останавливается и ждёт IntersectionObserver.
  if (rect.bottom < 0 || rect.top > window.innerHeight) {
    sceneFrame = 0;
    return;
  }

  sceneCurrentX += (scenePointerX - sceneCurrentX) * 0.075;
  sceneCurrentY += (scenePointerY - sceneCurrentY) * 0.075;

  activeSceneLayers().forEach((layer) => {
    const depth = Number(layer.dataset.depth);
    const x = -sceneCurrentX * depth * 1.1 * parallaxStrength;
    const y = -sceneCurrentY * depth * 1.0 * parallaxStrength;
    layer.style.transform = `translate3d(${x.toFixed(3)}%, ${y.toFixed(3)}%, 0)`;
  });

  sceneFrame = requestAnimationFrame(renderScene);
}

function startSceneMotion() {
  if (!scene || sceneFrame) return;
  const rect = scene.getBoundingClientRect();
  const nearViewport = rect.bottom > -window.innerHeight * 0.2
    && rect.top < window.innerHeight * 1.2;
  if (nearViewport) {
    sceneFrame = requestAnimationFrame(renderScene);
  }
}

window.addEventListener('scroll', startSceneMotion, { passive: true });
window.addEventListener('resize', startSceneMotion);

if (scene) {
  reduceMotion.addEventListener('change', startSceneMotion);
}

// Сцена островов: слова загораются -> текст растворяется -> слайдер листается скроллом
const isleStage = document.querySelector('[data-isle-stage]');

if (isleStage && !reduceMotion.matches && slides.length) {
  const leadText = isleStage.querySelector('[data-isle-lead-text]');
  const sliderBox = isleStage.querySelector('[data-isle-slider]');

  function wrapWords(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) {
            fragment.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'isle-stage__word';
            span.textContent = part;
            fragment.appendChild(span);
          }
        });
        node.replaceChild(fragment, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrapWords(child);
      }
    });
  }

  wrapWords(leadText);
  const leadWords = [...isleStage.querySelectorAll('.isle-stage__word')];

  // высота сцены: 1 экран на слова + 0.6 на кросс-фейд + по экрану на слайд
  isleStage.style.height = `${(1.6 + slides.length) * 100}vh`;

  const WORDS_END = 0.4;
  const FADE_END = 0.55;
  let stageTick = false;
  let stageSlideShown = -1;

  function updateIsleStage() {
    const rect = isleStage.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return;

    const p = Math.min(Math.max(-rect.top / scrollable, 0), 1);

    if (p < WORDS_END) {
      // фаза 1: слова зажигаются
      const lit = Math.floor((p / WORDS_END) * leadWords.length);
      leadWords.forEach((word, i) => word.classList.toggle('is-on', i < lit));
      leadText.style.opacity = '1';
      leadText.style.filter = 'none';
      sliderBox.style.opacity = '0';
      sliderBox.style.pointerEvents = 'none';
    } else if (p < FADE_END) {
      // фаза 2: текст растворяется, слайдер проявляется на его месте
      const t = (p - WORDS_END) / (FADE_END - WORDS_END);
      leadText.style.opacity = String(1 - t);
      leadText.style.filter = `blur(${(t * 10).toFixed(1)}px) brightness(${(1 - t * 0.55).toFixed(2)})`;
      sliderBox.style.opacity = String(t);
      sliderBox.style.pointerEvents = t > 0.6 ? 'auto' : 'none';
    } else {
      // фаза 3: скролл листает слайды
      leadText.style.opacity = '0';
      sliderBox.style.opacity = '1';
      sliderBox.style.pointerEvents = 'auto';
      leadWords.forEach((word) => word.classList.add('is-on'));

      const sp = (p - FADE_END) / (1 - FADE_END);
      const idx = Math.min(Math.floor(sp * slides.length), slides.length - 1);
      if (idx !== stageSlideShown) {
        stageSlideShown = idx;
        showSlide(idx);
      }
    }
  }

  window.addEventListener('scroll', () => {
    if (stageTick) return;
    stageTick = true;
    requestAnimationFrame(() => {
      updateIsleStage();
      stageTick = false;
    });
  }, { passive: true });

  window.addEventListener('resize', updateIsleStage);
  updateIsleStage();
}