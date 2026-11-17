const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const easeOut = value => 1 - Math.pow(1 - clamp(value), 3);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile = window.matchMedia('(max-width: 767px)');

/* Header and accessible mobile navigation */
const header = document.querySelector('[data-header]');
const menu = document.querySelector('[data-mobile-menu]');
const menuOpen = document.querySelector('[data-menu-open]');
const menuCloseButtons = [...document.querySelectorAll('[data-menu-close]')];
let menuReturnFocus = null;

function setMenu(open) {
  if (!menu || !menuOpen) return;
  if (!open && menuReturnFocus) menuReturnFocus.focus();
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  menuOpen.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
  if (open) {
    menuReturnFocus = document.activeElement;
    menu.querySelector('.mobile-menu__panel button, .mobile-menu__panel a')?.focus();
  }
}
menuOpen?.addEventListener('click', () => setMenu(true));
menuCloseButtons.forEach(button => button.addEventListener('click', () => setMenu(false)));
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.classList.contains('is-open')) setMenu(false);
  if (event.key === 'Tab' && menu?.classList.contains('is-open')) {
    const focusable = [...menu.querySelectorAll('.mobile-menu__panel a, .mobile-menu__panel button')].filter(el => el.offsetParent !== null);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
});

const themeSections = [...document.querySelectorAll('[data-theme]')];
function updateHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > 18);
  let light = false;
  for (const section of themeSections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 36 && rect.bottom > 36) { light = section.dataset.theme === 'light'; break; }
  }
  header?.classList.toggle('is-light', light);
}

/* Hero: original pointer parallax + exploded-layer scroll transition */
const heroShell = document.querySelector('[data-hero-shell]');
const heroSticky = heroShell?.querySelector('.hero-sticky');
const heroStage = document.querySelector('[data-hero-stage]');
const heroLayers = [...document.querySelectorAll('[data-parallax-layer]')];
const heroContent = document.querySelector('[data-hero-content]');
const heroTransition = document.querySelector('[data-hero-transition]');
const heroLight = document.querySelector('[data-hero-light]');
const scrollCue = document.querySelector('[data-scroll-cue]');
let heroProgress = 0;
let pointerX = 0, pointerY = 0, currentX = 0, currentY = 0;
let heroInView = true;

heroSticky?.addEventListener('pointermove', event => {
  if (reduceMotion.matches || event.pointerType === 'touch' || heroProgress > .005) {
    pointerX = 0;
    pointerY = 0;
    return;
  }
  const rect = heroSticky.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2;
  pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2;
});
heroSticky?.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });

function updateHero() {
  if (!heroShell || !heroStage) return;
  const rect = heroShell.getBoundingClientRect();
  heroInView = rect.bottom > 0 && rect.top < window.innerHeight;
  const distance = Math.max(1, heroShell.offsetHeight - window.innerHeight);
  heroProgress = reduceMotion.matches ? 0 : clamp(-rect.top / distance);
  const p = heroProgress;

  if (reduceMotion.matches) {
    heroStage.style.cssText = '';
    heroLayers.forEach(layer => { layer.style.cssText = ''; });
    heroContent.style.cssText = '';
    if (heroTransition) heroTransition.style.cssText = '';
    if (heroLight) heroLight.style.cssText = '';
    if (scrollCue) scrollCue.style.opacity = '1';
    return;
  }

  if (p > .005) { pointerX = 0; pointerY = 0; }
  const scene = easeOut(clamp((p - .08) / .44));
  const stageOpacity = 1 - clamp((p - .57) / .12);
  const initialAnchor = mobile.matches ? -6.1 : -10.4;
  const finalAnchor = mobile.matches ? -4 : -9.75;
  const anchorOffset = initialAnchor + (finalAnchor - initialAnchor) * scene;
  const heroStartScale = mobile.matches ? .74 : .7;
  const heroEndScale = mobile.matches ? .42 : .5;
  const heroScale = heroStartScale - scene * (heroStartScale - heroEndScale);
  heroStage.style.transform = `translate3d(0,${anchorOffset}vh,0) rotateX(${scene * 23}deg) rotateY(${-scene * 13}deg) scale(${heroScale})`;
  heroStage.style.opacity = stageOpacity.toFixed(3);

  const titleFade = 1 - clamp(p / .19);
  if (heroContent) {
    heroContent.style.opacity = titleFade.toFixed(3);
    heroContent.style.transform = `translate(-50%,-50%) translate3d(${-currentX * 10}px,${-currentY * 6 - p * 130}px,0) scale(${1 + p * .35})`;
  }
  if (scrollCue) scrollCue.style.opacity = (1 - clamp(p / .1)).toFixed(3);

  if (heroTransition) {
    const copyIn = clamp((p - .2) / .12);
    const copyOut = 1 - clamp((p - .48) / .08);
    heroTransition.style.opacity = (copyIn * copyOut).toFixed(3);
    heroTransition.style.transform = `translate3d(0,${(1 - copyIn) * 24}px,0)`;
  }
  if (heroLight) {
    const reveal = easeOut(clamp((p - .58) / .24));
    heroLight.style.clipPath = `inset(${100 - reveal * 100}% 0 0)`;
  }
  renderHeroLayers();
}

function renderHeroLayers() {
  if (!heroInView || reduceMotion.matches || !heroLayers.length) return;
  const p = heroProgress;
  const scene = easeOut(clamp((p - .08) / .44));
  const pointerStrength = 1 - clamp(p / .08);
  heroLayers.forEach((layer, index) => {
    const depth = Number(layer.dataset.depth);
    const x = -currentX * depth * 42 * pointerStrength;
    const y = -currentY * depth * 26 * pointerStrength;
    const splitY = (index - 2) * 46 * scene;
    const splitZ = (index - 2) * 145 * scene;
    layer.style.transform = `translate3d(${x.toFixed(2)}px,${(y + splitY).toFixed(2)}px,${splitZ.toFixed(2)}px) scale(${1 + scene * .045})`;
  });
}

function heroFrame() {
  if (heroInView && !reduceMotion.matches) {
    currentX += (pointerX - currentX) * .075;
    currentY += (pointerY - currentY) * .075;
    renderHeroLayers();
  }
  requestAnimationFrame(heroFrame);
}
requestAnimationFrame(heroFrame);

/* Launcher: diagonal hover flip and tap equivalent */
const launcherCard = document.querySelector('[data-launcher-card]');
const launcherFlip = document.querySelector('[data-launcher-flip]');
launcherFlip?.addEventListener('click', () => {
  const flipped = !launcherCard.classList.contains('is-flipped');
  launcherCard.classList.toggle('is-flipped', flipped);
  launcherFlip.setAttribute('aria-pressed', String(flipped));
});

/* Arrow-driven islands with rotating information cards */
const islandShowcase = document.querySelector('[data-island-showcase]');
const islandImage = document.querySelector('[data-island-image]');
const islandDots = [...document.querySelectorAll('[data-island-dot]')];
const islands = [
  {
    id: 'winter', name: 'Зима', image: './assets/images/island-winter.webp',
    alt: 'Левитирующий зимний Minecraft-остров с тайгой и кузницей',
    description: 'Заснеженная тайга, ледяные пики и тёплый свет кузниц. Суровый край, где ремесло начинается с огня.',
    biome: 'Тайга', level: 'Высокая сложность', craft: 'Металлургия<br>и ковка',
    perk: 'Редкие руды, сложные сплавы и кузницы позволяют создавать особенно прочное снаряжение.',
  },
  {
    id: 'desert', name: 'Пустыня', image: './assets/images/island-desert.webp',
    alt: 'Левитирующий пустынный Minecraft-остров с базаром, рудами и оазисом',
    description: 'Золотые дюны, караванные пути и шумные рынки. Богатство здесь всегда соседствует с риском.',
    biome: 'Пески и оазисы', level: 'Средняя сложность', craft: 'Драгоценные металлы<br>и торговля',
    perk: 'Золото и редкие минералы поддерживают экономику, караваны и выгодный обмен между игроками.',
  },
  {
    id: 'plains', name: 'Равнины', image: './assets/images/island-plains.webp',
    alt: 'Левитирующий равнинный Minecraft-остров с фермами и ветряной мельницей',
    description: 'Плодородные поля, фермы и тихие деревни. Остров для тех, кто хочет построить устойчивый живой мир.',
    biome: 'Луга', level: 'Мягкий старт', craft: 'Сельскохозяйственное<br>ремесло',
    perk: 'Развитые фермы, животноводство и переработка урожая создают ресурсы для всего архипелага.',
  },
  {
    id: 'jungle', name: 'Джунгли', image: './assets/images/island-jungle.webp',
    alt: 'Левитирующий Minecraft-остров джунглей с алхимическими руинами и зельями',
    description: 'Влажные тропики, древние руины и редкие растения. Здесь природа может стать лекарством или оружием.',
    biome: 'Тропики', level: 'Средняя сложность', craft: 'Яды, зелья<br>и болезни',
    perk: 'Необычные ингредиенты открывают алхимию, цепочки заболеваний, лечения и опасных отравлений.',
  },
];
let activeIsland = 0;
let islandBusy = false;
let islandShowingBack = false;
const islandFaces = {
  identityFront: document.querySelector('[data-island-card="identity"] .island-card__front'),
  identityBack: document.querySelector('[data-island-card="identity"] .island-card__back'),
  advantageFront: document.querySelector('[data-island-card="advantage"] .island-card__front'),
  advantageBack: document.querySelector('[data-island-card="advantage"] .island-card__back'),
};
const identityMarkup = (island, index) => `
  <div class="island-card__content">
    <p class="island-kicker" data-island-kicker>Остров ${String(index + 1).padStart(2, '0')} / 04</p>
    <h3 data-island-name>${island.name}</h3>
    <p class="island-description" data-island-description>${island.description}</p>
    <div class="island-tags"><span data-island-biome>${island.biome}</span><span data-island-level>${island.level}</span></div>
  </div>`;
const advantageMarkup = island => `
  <div class="island-card__content">
    <p>Особенность острова</p>
    <strong data-island-craft>${island.craft}</strong>
    <span data-island-perk>${island.perk}</span>
  </div>`;
islands.forEach(island => { const preload = new Image(); preload.src = island.image; });

function renderIsland(index, { preserveBack = false, updateImage = true } = {}) {
  const island = islands[index];
  if (!islandShowcase || !island) return;
  islandShowcase.dataset.island = island.id;
  if (updateImage && islandImage) {
    islandImage.src = island.image;
    islandImage.alt = island.alt;
  }
  if (islandFaces.identityFront) islandFaces.identityFront.innerHTML = identityMarkup(island, index);
  if (islandFaces.advantageFront) islandFaces.advantageFront.innerHTML = advantageMarkup(island);
  if (!preserveBack) {
    if (islandFaces.identityBack) islandFaces.identityBack.innerHTML = identityMarkup(island, index);
    if (islandFaces.advantageBack) islandFaces.advantageBack.innerHTML = advantageMarkup(island);
  }
  islandDots.forEach((button, i) => {
    button.classList.toggle('is-active', i === index);
    button.setAttribute('aria-pressed', String(i === index));
  });
}
renderIsland(0);

const wait = duration => new Promise(resolve => window.setTimeout(resolve, duration));

async function setIsland(index) {
  if (!islandShowcase || islandBusy) return;
  const next = (index + islands.length) % islands.length;
  if (next === activeIsland) return;
  if (reduceMotion.matches) {
    activeIsland = next;
    renderIsland(next);
    return;
  }

  const island = islands[next];
  const startedAt = performance.now();
  const nextImage = new Image();
  nextImage.src = island.image;
  const imageReady = nextImage.decode().catch(() => {});
  const incomingSide = islandShowingBack ? 'Front' : 'Back';
  const outgoingSide = islandShowingBack ? 'Back' : 'Front';
  const incomingIdentity = islandFaces[`identity${incomingSide}`];
  const incomingAdvantage = islandFaces[`advantage${incomingSide}`];

  islandBusy = true;
  if (incomingIdentity) incomingIdentity.innerHTML = identityMarkup(island, next);
  if (incomingAdvantage) incomingAdvantage.innerHTML = advantageMarkup(island);
  void islandShowcase.offsetWidth;

  islandShowingBack = !islandShowingBack;
  islandShowcase.classList.remove('is-returning');
  islandShowcase.classList.add('is-changing');
  islandShowcase.classList.toggle('is-flipped', islandShowingBack);

  [incomingIdentity, incomingAdvantage].forEach(face => {
    face?.querySelector('.island-card__content')?.animate([
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], {
      delay: 400,
      duration: 380,
      easing: 'cubic-bezier(.22,1,.36,1)',
      fill: 'backwards',
    });
  });

  await wait(430);
  activeIsland = next;
  islandShowcase.dataset.island = island.id;
  if (islandFaces[`identity${outgoingSide}`])
    islandFaces[`identity${outgoingSide}`].innerHTML = identityMarkup(island, next);
  if (islandFaces[`advantage${outgoingSide}`])
    islandFaces[`advantage${outgoingSide}`].innerHTML = advantageMarkup(island);
  islandDots.forEach((button, i) => {
    button.classList.toggle('is-active', i === next);
    button.setAttribute('aria-pressed', String(i === next));
  });

  await imageReady;
  if (islandImage) {
    islandImage.src = island.image;
    islandImage.alt = island.alt;
    await islandImage.decode().catch(() => {});
  }

  await wait(Math.max(0, 540 - (performance.now() - startedAt)));
  islandShowcase.classList.add('is-returning');
  await wait(Math.max(280, 880 - (performance.now() - startedAt)));

  islandShowcase.classList.remove('is-changing', 'is-returning');
  ['identity', 'advantage'].forEach(type => {
    islandFaces[`${type}Front`]?.setAttribute('aria-hidden', String(islandShowingBack));
    islandFaces[`${type}Back`]?.setAttribute('aria-hidden', String(!islandShowingBack));
  });
  islandBusy = false;
}
document.querySelector('[data-island-prev]')?.addEventListener('click', () => setIsland(activeIsland - 1));
document.querySelector('[data-island-next]')?.addEventListener('click', () => setIsland(activeIsland + 1));
islandDots.forEach((button, index) => button.addEventListener('click', () => setIsland(index)));
islandShowcase?.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); setIsland(activeIsland - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); setIsland(activeIsland + 1); }
});
let islandTouchStart = null;
islandShowcase?.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch') islandTouchStart = event.clientX;
}, { passive: true });
islandShowcase?.addEventListener('pointerup', event => {
  if (islandTouchStart === null || event.pointerType !== 'touch') return;
  const delta = event.clientX - islandTouchStart;
  islandTouchStart = null;
  if (Math.abs(delta) > 55) setIsland(activeIsland + (delta < 0 ? 1 : -1));
}, { passive: true });

/* Five-stage crafting workbench: material, blade, components, assembly, finishing */
const workbench = document.querySelector('[data-sword-workbench]');
const swordParts = [...document.querySelectorAll('[data-sword-part]')];
const materialBlock = document.querySelector('[data-material-block]');
const craftNext = document.querySelector('[data-craft-next]');
const craftPrev = document.querySelector('[data-craft-prev]');
const craftVisualCaption = document.querySelector('[data-craft-visual-caption]');
const craftStageNumber = document.querySelector('[data-craft-stage-number]');
const craftStageDescription = document.querySelector('[data-craft-stage-description]');
let activeCraftStage = -1;

const craftStages = [
  { name: 'Материал', caption: 'Исходный слиток', description: 'Выберите материал — он определит внешний вид меча.' },
  { name: 'Обработка', caption: 'Клинок после обработки', description: 'Слиток обрабатывается и принимает форму клинка.' },
  { name: 'Детали', caption: 'Компоненты перед сборкой', description: 'Гарда, рукоять и навершие подготовлены к сборке.' },
  { name: 'Сборка', caption: 'Собранный меч', description: 'Все детали соединяются в единое снаряжение.' },
  { name: 'Доводка', caption: 'Готовое снаряжение', description: 'Финальная доводка завершает создание меча.' },
];

const craftPartStates = {
  blade: [
    { opacity: 0, x: 0, y: 5, r: 0 }, { opacity: 1, x: 0, y: -7, r: -3 },
    { opacity: 1, x: 0, y: -15, r: -4 }, { opacity: 1, x: 0, y: 0, r: 0 }, { opacity: 1, x: 0, y: 0, r: 0 },
  ],
  guard: [
    { opacity: 0, x: 0, y: 0, r: 0 }, { opacity: 0, x: 0, y: 0, r: 0 },
    { opacity: 1, x: -31, y: 5, r: -14 }, { opacity: 1, x: 0, y: 0, r: 0 }, { opacity: 1, x: 0, y: 0, r: 0 },
  ],
  grip: [
    { opacity: 0, x: 0, y: 0, r: 0 }, { opacity: 0, x: 0, y: 0, r: 0 },
    { opacity: 1, x: 25, y: 15, r: 13 }, { opacity: 1, x: 0, y: 0, r: 0 }, { opacity: 1, x: 0, y: 0, r: 0 },
  ],
  pommel: [
    { opacity: 0, x: 0, y: 0, r: 0 }, { opacity: 0, x: 0, y: 0, r: 0 },
    { opacity: 1, x: 34, y: 27, r: 24 }, { opacity: 1, x: 0, y: 0, r: 0 }, { opacity: 1, x: 0, y: 0, r: 0 },
  ],
};

function setCraftStage(index) {
  index = clamp(index, 0, craftStages.length - 1);
  if (index === activeCraftStage) return;
  activeCraftStage = index;
  const stage = craftStages[index];
  if (workbench) workbench.dataset.stage = String(index);
  if (craftVisualCaption) craftVisualCaption.textContent = `${String(index + 1).padStart(2, '0')} — ${stage.caption}`;
  if (craftStageNumber) craftStageNumber.textContent = String(index + 1).padStart(2, '0');
  if (craftStageDescription) craftStageDescription.textContent = stage.description;
  craftPrev?.setAttribute('aria-label', `Предыдущий этап: ${craftStages[(index + craftStages.length - 1) % craftStages.length].name}`);
  craftNext?.setAttribute('aria-label', `Следующий этап: ${craftStages[(index + 1) % craftStages.length].name}`);
  if (materialBlock) {
    materialBlock.style.opacity = index === 0 ? '1' : '0';
    materialBlock.style.transform = `translate(-50%,-50%) translate3d(0,${index === 0 ? 0 : -30}px,0) rotate(${index === 0 ? -4 : 10}deg) scale(${index === 0 ? 1 : .8})`;
  }
  const spread = mobile.matches ? .65 : 1;
  swordParts.forEach(part => {
    const state = craftPartStates[part.dataset.swordPart][index];
    const mobileLift = mobile.matches && index === 2 && part.dataset.swordPart !== 'blade' ? -8 : 0;
    part.style.opacity = String(state.opacity);
    part.style.transform = `translate3d(${state.x * spread}%,${state.y * spread + mobileLift}%,0) rotate(${state.r}deg)`;
  });
  if (workbench) {
    workbench.style.setProperty('--sword-glow', index === 4 ? '1' : index === 3 ? '.45' : '0');
    workbench.style.setProperty('--sword-rotate', index === 4 ? '5deg' : index === 3 ? '-2deg' : '-7deg');
  }
}
setCraftStage(0);
craftNext?.addEventListener('click', () => setCraftStage((activeCraftStage + 1) % craftStages.length));
craftPrev?.addEventListener('click', () => setCraftStage((activeCraftStage + craftStages.length - 1) % craftStages.length));
workbench?.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  const direction = event.key === 'ArrowRight' ? 1 : -1;
  setCraftStage((activeCraftStage + direction + craftStages.length) % craftStages.length);
});

const finishNames = { steel: 'сталь', bronze: 'бронза', dark: 'тёмный металл' };
const finishButtons = [...document.querySelectorAll('[data-finish]')].filter(button => button.tagName === 'BUTTON');
const variantStatus = document.querySelector('[data-variant-status]');
finishButtons.forEach(button => button.addEventListener('click', () => {
  const finish = button.dataset.finish;
  finishButtons.forEach(other => {
    const active = other === button;
    other.classList.toggle('is-active', active);
    other.setAttribute('aria-pressed', String(active));
  });
  if (workbench) workbench.dataset.finish = finish;
  if (variantStatus) variantStatus.textContent = `Выбран материал: ${finishNames[finish]}`;
}));

/* Accessible before/after climate slider */
const climateCompare = document.querySelector('[data-climate-compare]');
const climateRange = document.querySelector('[data-climate-range]');
let climateInteracted = false;
let climateAnimation = 0;

function setClimateValue(value) {
  if (!climateCompare || !climateRange) return;
  const next = clamp(Number(value), 0, 100);
  climateRange.value = String(next);
  climateCompare.style.setProperty('--split', `${next}%`);
}
climateRange?.addEventListener('input', event => {
  climateInteracted = true;
  cancelAnimationFrame(climateAnimation);
  setClimateValue(event.target.value);
});
climateRange?.addEventListener('pointerdown', () => {
  climateInteracted = true;
  cancelAnimationFrame(climateAnimation);
});

if (climateCompare && 'IntersectionObserver' in window && !reduceMotion.matches) {
  const climateObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || climateInteracted) return;
    climateObserver.disconnect();
    const start = performance.now();
    const animate = now => {
      if (climateInteracted) return;
      const t = clamp((now - start) / 1500);
      let value;
      if (t < .48) value = 50 + (18 - 50) * easeOut(t / .48);
      else if (t < .78) value = 18 + (68 - 18) * easeOut((t - .48) / .3);
      else value = 68 + (50 - 68) * easeOut((t - .78) / .22);
      setClimateValue(value);
      if (t < 1) climateAnimation = requestAnimationFrame(animate);
    };
    climateAnimation = requestAnimationFrame(animate);
  }, { threshold: .55 });
  climateObserver.observe(climateCompare);
}

/* Countdown and real calendar download */
const countdown = document.querySelector('[data-countdown]');
const launchOpen = document.querySelector('[data-launch-open]');
const launchDate = new Date(countdown?.dataset.launchDate || '2026-12-19T18:00:00+03:00');
const cd = {
  d: document.querySelector('[data-cd="d"]'),
  h: document.querySelector('[data-cd="h"]'),
  m: document.querySelector('[data-cd="m"]'),
  s: document.querySelector('[data-cd="s"]'),
};
const pad = value => String(value).padStart(2, '0');
function updateCountdown() {
  const difference = launchDate.getTime() - Date.now();
  if (difference <= 0) {
    if (countdown) countdown.hidden = true;
    if (launchOpen) launchOpen.hidden = false;
    const calendarButton = document.querySelector('[data-calendar]');
    if (calendarButton) calendarButton.hidden = true;
    return;
  }
  const seconds = Math.floor(difference / 1000);
  const values = {
    d: pad(Math.floor(seconds / 86400)),
    h: pad(Math.floor((seconds % 86400) / 3600)),
    m: pad(Math.floor((seconds % 3600) / 60)),
    s: pad(seconds % 60),
  };
  Object.entries(values).forEach(([key, value]) => { if (cd[key]) cd[key].textContent = value; });
  window.setTimeout(updateCountdown, 1000 - (Date.now() % 1000));
}
updateCountdown();

document.querySelector('[data-calendar]')?.addEventListener('click', () => {
  const end = new Date(launchDate.getTime() + 2 * 60 * 60 * 1000);
  const formatICS = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gerbarium//Server Launch//RU',
    'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:launch-${launchDate.getTime()}@gerbarium`,
    `DTSTAMP:${formatICS(new Date())}`, `DTSTART:${formatICS(launchDate)}`, `DTEND:${formatICS(end)}`,
    'SUMMARY:Открытие сервера Gerbarium',
    'DESCRIPTION:Minecraft 1.20.1 — выживание среди четырёх островов.',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gerbarium-launch.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  const feedback = document.querySelector('[data-calendar-feedback]');
  if (feedback) feedback.textContent = 'Событие для календаря загружено.';
});

/* Entrance motion never controls content visibility */
const revealElements = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealObserver.unobserve(entry.target);
      entry.target.animate([
        { transform: 'translate3d(0,22px,0) scale(.985)' },
        { transform: 'translate3d(0,0,0) scale(1)' },
      ], { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'none' });
    });
  }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  revealElements.forEach(element => revealObserver.observe(element));
}

/* One scheduled update per scroll frame */
let scrollQueued = false;
function updateAll() {
  scrollQueued = false;
  updateHeader();
  updateHero();
}
function queueUpdate() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(updateAll);
}
window.addEventListener('scroll', queueUpdate, { passive: true });
window.addEventListener('resize', queueUpdate, { passive: true });
mobile.addEventListener('change', () => {
  const stage = activeCraftStage;
  activeCraftStage = -1;
  setCraftStage(stage);
  queueUpdate();
});
reduceMotion.addEventListener('change', queueUpdate);
updateAll();
