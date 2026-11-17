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

const heroConfetti = document.querySelector('.home-hero__confetti');

if (heroConfetti) {
  const supportsEffect = window.matchMedia('(min-width: 901px) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#FF477E', '#FF6B35', '#FFC328', '#B6E735', '#20CA85', '#1CC5D8', '#5A8BFF', '#9B62E8'];
  const idleDelay = 8000;
  const maximumDots = 64;
  const dotSize = 12;
  let idleTimer;
  let dotTimer;

  function canShowDots() {
    return supportsEffect.matches && !reducedMotion.matches && !document.hidden && window.scrollY < 8
      && !document.querySelector('.desktop-navigation__overlay:not([hidden])');
  }

  function stopDotTimer() {
    window.clearInterval(dotTimer);
    dotTimer = undefined;
  }

  function addDot() {
    if (!canShowDots()) {
      stopDotTimer();
      return;
    }
    if (heroConfetti.childElementCount >= maximumDots) {
      stopDotTimer();
      return;
    }

    const dot = document.createElement('span');
    dot.className = 'home-hero__confetti-dot';
    dot.style.left = `${Math.random() * Math.max(0, heroConfetti.clientWidth - dotSize)}px`;
    dot.style.top = `${Math.random() * Math.max(0, heroConfetti.clientHeight - dotSize)}px`;
    dot.style.setProperty('--dot-size', `${dotSize}px`);
    dot.style.setProperty('--dot-color', colors[Math.floor(Math.random() * colors.length)]);
    dot.style.setProperty('--dot-drift', `${Math.round((Math.random() - .5) * 100)}px`);
    heroConfetti.append(dot);
  }

  function startDots() {
    if (!canShowDots()) return;
    addDot();
    dotTimer = window.setInterval(addDot, 180);
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
  window.addEventListener('keydown', reactToActivity);
  supportsEffect.addEventListener('change', reactToActivity);
  reducedMotion.addEventListener('change', reactToActivity);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearTimeout(idleTimer);
      stopDotTimer();
      heroConfetti.replaceChildren();
    } else {
      scheduleDots();
    }
  });

  scheduleDots();
}
