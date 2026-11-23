const desktopScroll = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
let desktopScrollInitialized = false;

function initDesktopScroll() {
  if (desktopScrollInitialized || !desktopScroll.matches || !window.luxy) return;
  window.luxy.init({ wrapper: '#luxy', wrapperSpeed: 0.055 });
  desktopScrollInitialized = true;
}

initDesktopScroll();
desktopScroll.addEventListener('change', initDesktopScroll);

const moscowTime = document.querySelector('.home-header__time');

if (moscowTime) {
  const formatTime = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  function updateMoscowTime() {
    const now = new Date();
    moscowTime.textContent = formatTime.format(now);
    moscowTime.dateTime = moscowTime.textContent;
  }

  function scheduleNextMinute() {
    updateMoscowTime();
    window.setTimeout(scheduleNextMinute, 60000 - Date.now() % 60000 + 50);
  }

  scheduleNextMinute();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateMoscowTime();
  });
}

const heroConfetti = document.querySelector('.home-hero__confetti:not([hidden])');

if (heroConfetti) {
  const supportsEffect = window.matchMedia('(min-width: 901px) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#FF477E', '#FF6B35', '#FFC328', '#B6E735', '#20CA85', '#1CC5D8', '#5A8BFF', '#9B62E8'];
  const idleDelay = 8000;
  const dotWidth = 7;
  const dotHeight = 9;
  const gridSpacing = 110;
  let availableCells = [];
  let idleTimer;
  let dotTimer;

  function canShowDots() {
    return supportsEffect.matches && !reducedMotion.matches && window.scrollY < 8
      && !document.querySelector('.desktop-navigation__overlay:not([hidden])');
  }

  function stopDotTimer() {
    window.clearInterval(dotTimer);
    dotTimer = undefined;
  }

  function addDot() {
    const dot = document.createElement('span');
    const cellIndex = Math.floor(Math.random() * availableCells.length);
    const [cell] = availableCells.splice(cellIndex, 1);
    dot.className = 'home-hero__confetti-dot';
    dot.style.left = `${cell.x}px`;
    dot.style.top = `${cell.y}px`;
    dot.style.setProperty('--dot-width', `${dotWidth}px`);
    dot.style.setProperty('--dot-height', `${dotHeight}px`);
    dot.style.setProperty('--dot-color', colors[Math.floor(Math.random() * colors.length)]);
    dot.style.setProperty('--dot-drift', `${Math.round((Math.random() - .5) * 100)}px`);
    heroConfetti.append(dot);
  }

  function prepareGrid() {
    const right = Math.max(0, heroConfetti.clientWidth - dotWidth);
    const bottom = Math.max(0, Math.min(heroConfetti.clientHeight, document.documentElement.clientHeight) - dotHeight);
    const columnIntervals = Math.max(1, Math.round(right / gridSpacing));
    const rowIntervals = Math.max(1, Math.round(bottom / gridSpacing));
    availableCells = [];
    for (let row = 0; row <= rowIntervals; row += 1) {
      for (let column = 0; column <= columnIntervals; column += 1) {
        availableCells.push({
          x: column * right / columnIntervals,
          y: row * bottom / rowIntervals
        });
      }
    }
  }

  function startDots() {
    if (!canShowDots()) return;
    prepareGrid();
    addDot();
    dotTimer = window.setInterval(() => {
      if (!canShowDots() || !availableCells.length) {
        stopDotTimer();
        return;
      }
      addDot();
    }, 180);
  }

  function scheduleDots() {
    window.clearTimeout(idleTimer);
    if (canShowDots()) idleTimer = window.setTimeout(startDots, idleDelay);
  }

  function reactToActivity() {
    stopDotTimer();
    heroConfetti.querySelectorAll('.home-hero__confetti-dot:not(.is-falling)').forEach((dot) => {
      dot.classList.add('is-falling');
      window.setTimeout(() => dot.remove(), 550);
    });
    scheduleDots();
  }

  window.addEventListener('pointermove', reactToActivity, { passive: true });
  window.addEventListener('pointerdown', reactToActivity, { passive: true });
  window.addEventListener('scroll', reactToActivity, { passive: true });
  window.addEventListener('resize', reactToActivity);
  window.addEventListener('keydown', reactToActivity);
  supportsEffect.addEventListener('change', reactToActivity);
  reducedMotion.addEventListener('change', reactToActivity);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || dotTimer !== undefined || heroConfetti.querySelector('.home-hero__confetti-dot:not(.is-falling)')) return;
    window.clearTimeout(idleTimer);
    startDots();
  });

  scheduleDots();
}
