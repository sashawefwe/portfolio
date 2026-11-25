(() => {
  const desktopNavigation = document.querySelector('.site-navigation');
  if (!desktopNavigation) return;
  const homeMenuSlot = document.querySelector('.home-intro__menu');

  const currentHref = desktopNavigation.querySelector('[aria-current="page"]')?.getAttribute('href');
  const morphIcon = '<span class="navigation-morph-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/></svg></span>';
  // Each outer cap travels to the next corner counterclockwise; its inner cap grows toward the center.
  const morphPaths = [
    { direction:1, points:[{ x:6, y:6, angle:0 }, { x:4.3, y:11.6, angle:-25 }, { x:5.56, y:18.44, angle:-45 }] },
    { direction:-1, points:[{ x:18, y:6, angle:0 }, { x:12.3, y:4.3, angle:-70 }, { x:5.56, y:5.56, angle:-135 }] },
    { direction:1, points:[{ x:6, y:18, angle:0 }, { x:11.7, y:19.7, angle:-110 }, { x:18.44, y:18.44, angle:-135 }] },
    { direction:-1, points:[{ x:18, y:18, angle:0 }, { x:19.7, y:12.3, angle:-20 }, { x:18.44, y:5.56, angle:-45 }] }
  ];
  function createMorphAnimation(button) {
    const rects = [...button.querySelectorAll('.navigation-morph-icon rect')];
    let progress = 0;
    let frame = 0;
    function render(value) {
      const midpoint = .52;
      const segment = value < midpoint ? 0 : 1;
      const amount = segment === 0 ? value / midpoint : (value - midpoint) / (1 - midpoint);
      const interpolate = (a, b) => a + (b - a) * amount;
      const widths = [6, 9.5, 12.5];
      const heights = [6, 4.8, 4.2];
      const width = interpolate(widths[segment], widths[segment + 1]);
      const height = interpolate(heights[segment], heights[segment + 1]);
      const radius = height / 2 * Math.min(1, value / midpoint);
      rects.forEach((rect, index) => {
        const path = morphPaths[index];
        const from = path.points[segment];
        const to = path.points[segment + 1];
        const outerX = interpolate(from.x, to.x);
        const outerY = interpolate(from.y, to.y);
        const angle = interpolate(from.angle, to.angle);
        const capHalfDistance = (width - height) / 2;
        const radians = angle * Math.PI / 180;
        const x = outerX + Math.cos(radians) * capHalfDistance * path.direction;
        const y = outerY + Math.sin(radians) * capHalfDistance * path.direction;
        rect.setAttribute('x', String(x - width / 2));
        rect.setAttribute('y', String(y - height / 2));
        rect.setAttribute('width', String(width));
        rect.setAttribute('height', String(height));
        rect.setAttribute('rx', String(radius));
        rect.setAttribute('transform', `rotate(${angle} ${x} ${y})`);
      });
    }
    return (open) => {
      cancelAnimationFrame(frame);
      const target = open ? 1 : 0;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        progress = target;
        render(target);
        return;
      }
      const from = progress;
      const duration = Math.abs(target - from) * 320;
      const start = performance.now();
      function step(now) {
        const elapsed = Math.min(1, (now - start) / duration);
        const eased = elapsed < .5 ? 2 * elapsed * elapsed : 1 - Math.pow(-2 * elapsed + 2, 2) / 2;
        progress = from + (target - from) * eased;
        render(progress);
        if (elapsed < 1) frame = requestAnimationFrame(step);
      }
      frame = requestAnimationFrame(step);
    };
  }

  const mobileTrigger = document.createElement('button');
  mobileTrigger.className = 'mobile-navigation__trigger';
  mobileTrigger.type = 'button';
  mobileTrigger.setAttribute('aria-expanded', 'false');
  mobileTrigger.setAttribute('aria-controls', 'desktop-navigation-menu');
  mobileTrigger.setAttribute('aria-label', 'Открыть меню');
  mobileTrigger.textContent = 'Menu';

  const desktopLayout = window.matchMedia('(min-width: 901px)');
  const desktopTrigger = document.createElement('button');
  desktopTrigger.className = 'desktop-navigation__trigger';
  desktopTrigger.type = 'button';
  desktopTrigger.setAttribute('aria-label', 'Открыть меню');
  desktopTrigger.setAttribute('aria-expanded', 'false');
  desktopTrigger.setAttribute('aria-controls', 'desktop-navigation-menu');
  desktopTrigger.textContent = 'Menu';

  const desktopOverlay = document.createElement('div');
  desktopOverlay.className = 'desktop-navigation__overlay';
  desktopOverlay.hidden = true;

  const desktopMenu = document.createElement('nav');
  desktopMenu.className = 'desktop-navigation__menu';
  desktopMenu.id = 'desktop-navigation-menu';
  desktopMenu.setAttribute('role', 'dialog');
  desktopMenu.setAttribute('aria-modal', 'true');
  desktopMenu.setAttribute('aria-label', 'Навигация');

  const closeButton = document.createElement('button');
  closeButton.className = 'desktop-navigation__close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Закрыть меню');
  closeButton.innerHTML = '<span aria-hidden="true"></span>';

  const desktopHeader = document.createElement('div');
  desktopHeader.className = 'desktop-navigation__header';
  desktopHeader.innerHTML = '<p class="desktop-navigation__clock">Moscow, RU · <time></time></p>';
  desktopHeader.append(closeButton);

  const desktopLinks = document.createElement('div');
  desktopLinks.className = 'desktop-navigation__links';
  [
    { label:'Саша Пронченко', href:'index.html', image:'assets/home/images/portrait.jpg' },
    { label:'Pinterest', href:'pinterest.html', image:'assets/icons/navigation/pinterest-menu.png' },
    { label:'Орбита', icon:'orbita' }
  ].forEach(({ label, href, image, icon }) => {
    const isCurrent = Boolean(href && href === currentHref);
    const item = document.createElement(href && !isCurrent ? 'a' : 'span');
    item.className = 'desktop-navigation__link';
    const thumbnail = document.createElement(image ? 'img' : 'span');
    thumbnail.className = 'desktop-navigation__thumbnail';
    if (image) {
      thumbnail.src = image;
      thumbnail.alt = '';
    } else {
      thumbnail.classList.add(`desktop-navigation__thumbnail--${icon}`);
      thumbnail.setAttribute('aria-hidden', 'true');
    }
    item.append(thumbnail, label);
    if (isCurrent) {
      item.setAttribute('aria-current', 'page');
    } else if (href) {
      item.href = href;
    } else {
      item.setAttribute('aria-disabled', 'true');
    }
    desktopLinks.append(item);
  });

  const desktopFooter = document.createElement('div');
  desktopFooter.className = 'desktop-navigation__footer';
  desktopFooter.innerHTML = `<div>Product Designer
    <div class="desktop-navigation__status"><span class="desktop-navigation__pulse" aria-hidden="true"></span>Open to work</div>
  </div><span class="desktop-navigation__telegram">Telegram<img src="assets/home/images/arrow-up-right.svg" alt="" width="20" height="20"></span>`;
  desktopMenu.append(desktopHeader, desktopLinks, desktopFooter);
  desktopOverlay.append(desktopMenu);
  (homeMenuSlot || document.body).append(desktopTrigger, mobileTrigger);
  (homeMenuSlot || document.body).append(desktopOverlay);

  let desktopOpen = false;
  let desktopScrollY = 0;
  let desktopMotion = [];
  let activeTrigger;
  let clockTimer;
  const clock = desktopHeader.querySelector('time');
  const formatMoscowTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  function updateClock() {
    const now = new Date();
    clock.textContent = formatMoscowTime.format(now);
    clock.dateTime = clock.textContent;
    clockTimer = window.setTimeout(updateClock, 60000 - now.getTime() % 60000 + 50);
  }

  function desktopClipFrames() {
    const capsule = activeTrigger.getBoundingClientRect();
    const card = desktopMenu.getBoundingClientRect();
    const radius = getComputedStyle(desktopMenu).borderTopLeftRadius;
    return [
      { clipPath: `inset(${capsule.top - card.top}px ${card.right - capsule.right}px ${card.bottom - capsule.bottom}px ${capsule.left - card.left}px round ${capsule.height / 2}px)` },
      { clipPath: `inset(0px 0px 0px 0px round ${radius})` }
    ];
  }

  function startDesktopMotion() {
    const timing = { duration: 420, easing: 'cubic-bezier(.22, .75, .25, 1)', fill: 'both' };
    const contentFrames = [{ opacity: 0 }, { opacity: 0, offset: .18 }, { opacity: 1 }];
    desktopMotion = [
      desktopMenu.animate(desktopClipFrames(), timing),
      desktopOverlay.animate([{ backgroundColor: 'transparent' }, { backgroundColor: 'rgba(0, 0, 0, .5)' }], timing),
      activeTrigger.animate([{ opacity: 1 }, { opacity: 0, offset: .45 }, { opacity: 0 }], timing),
      ...[desktopHeader, desktopLinks, desktopFooter].map(node => node.animate(contentFrames, timing))
    ];
  }

  function finishDesktopClose() {
    desktopOverlay.hidden = true;
    desktopMotion.forEach(animation => animation.cancel());
    desktopMotion = [];
    activeTrigger.inert = false;
    (desktopLayout.matches ? desktopTrigger : mobileTrigger).focus({ preventScroll: true });
  }

  function setDesktopOpen(open, trigger = activeTrigger) {
    if (desktopOpen === open) return;
    desktopOpen = open;
    activeTrigger = trigger;
    activeTrigger.setAttribute('aria-expanded', String(open));
    if (open) {
      desktopScrollY = window.scrollY;
      desktopOverlay.hidden = false;
      activeTrigger.inert = true;
      updateClock();
      if (desktopMenu.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        startDesktopMotion();
      }
      closeButton.focus({ preventScroll: true });
    } else {
      window.clearTimeout(clockTimer);
      const [cardMotion] = desktopMotion;
      if ((activeTrigger === desktopTrigger) !== desktopLayout.matches || !cardMotion?.currentTime) {
        finishDesktopClose();
        return;
      }
      cardMotion.effect.setKeyframes(desktopClipFrames());
      cardMotion.onfinish = finishDesktopClose;
      desktopMotion.forEach(animation => {
        animation.updatePlaybackRate(-420 / 330);
        animation.play();
      });
    }
  }

  function preventDesktopPageScroll(event) {
    if (desktopOverlay.hidden) return;
    if (desktopMenu.contains(event.target) && desktopMenu.scrollHeight > desktopMenu.clientHeight) return;
    event.preventDefault();
  }

  window.addEventListener('wheel', preventDesktopPageScroll, { passive: false });
  window.addEventListener('touchmove', preventDesktopPageScroll, { passive: false });
  window.addEventListener('scroll', () => {
    if (!desktopOverlay.hidden && window.scrollY !== desktopScrollY) {
      window.scrollTo({ top: desktopScrollY, behavior: 'instant' });
    }
  }, { passive: true });

  desktopTrigger.addEventListener('click', () => setDesktopOpen(true, desktopTrigger));
  mobileTrigger.addEventListener('click', () => setDesktopOpen(true, mobileTrigger));
  closeButton.addEventListener('click', () => setDesktopOpen(false));
  desktopOverlay.addEventListener('pointerdown', (event) => {
    if (event.target === desktopOverlay) setDesktopOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (!desktopOpen) return;
    if (event.key === 'Escape') {
      setDesktopOpen(false);
      return;
    }
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      if (event.key !== ' ' || document.activeElement !== closeButton) event.preventDefault();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [closeButton, ...desktopLinks.querySelectorAll('a')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  desktopLayout.addEventListener('change', () => {
    if (desktopOpen) setDesktopOpen(false);
    else if (!desktopOverlay.hidden) finishDesktopClose();
  });
})();
