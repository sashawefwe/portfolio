(() => {
  const desktopNavigation = document.querySelector('.site-navigation');
  if (!desktopNavigation) return;
  const homeMenuSlot = document.querySelector('.home-intro__menu');

  const currentHref = desktopNavigation.querySelector('[aria-current="page"]')?.getAttribute('href');
  const entries = [
    { label:'Саша Пронченко', href:'index.html' },
    { label:'Pinterest', href:'pinterest.html' },
    { label:'Орбита' }
  ];
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

  const navigation = document.createElement('div');
  navigation.className = 'mobile-navigation';
  navigation.dataset.open = 'false';

  const trigger = document.createElement('button');
  trigger.className = 'mobile-navigation__trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'mobile-navigation-menu');
  trigger.setAttribute('aria-label', 'Открыть меню');
  if (homeMenuSlot) trigger.textContent = 'Menu';
  else trigger.innerHTML = morphIcon;
  const animateMobileMorph = homeMenuSlot ? null : createMorphAnimation(trigger);

  const menu = document.createElement('nav');
  menu.className = 'mobile-navigation__menu';
  menu.id = 'mobile-navigation-menu';
  menu.setAttribute('aria-label', 'Мобильная навигация');

  const mobileBackdrop = document.createElement('div');
  mobileBackdrop.className = 'mobile-navigation__backdrop';
  mobileBackdrop.hidden = true;
  const mobileClose = document.createElement('button');
  mobileClose.className = 'mobile-navigation__close';
  mobileClose.type = 'button';
  mobileClose.setAttribute('aria-label', 'Закрыть меню');
  mobileClose.innerHTML = '<span aria-hidden="true"></span>';
  menu.append(mobileClose);
  const mobileMenuControl = homeMenuSlot ? mobileClose : trigger;

  const mobileEntries = homeMenuSlot ? entries : [...entries, { label: 'CV' }];
  mobileEntries.forEach(({ label, href }) => {
    const item = document.createElement(href ? 'a' : 'span');
    item.className = href ? 'mobile-navigation__link' : 'mobile-navigation__label';
    item.textContent = label;
    if (href) {
      item.href = href;
      if (href === currentHref) item.setAttribute('aria-current', 'page');
    } else {
      item.setAttribute('aria-disabled', 'true');
    }
    menu.append(item);
  });

  (homeMenuSlot || navigation).prepend(trigger);
  navigation.append(mobileBackdrop, menu);
  document.body.append(navigation);

  let previousMobileHtmlOverflow = '';
  let previousMobileBodyOverflow = '';
  function setOpen(open) {
    const changed = (navigation.dataset.open === 'true') !== open;
    navigation.dataset.open = String(open);
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (changed) {
      animateMobileMorph?.(open);
      mobileBackdrop.hidden = !open;
      if (open) {
        previousMobileHtmlOverflow = document.documentElement.style.overflow;
        previousMobileBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        mobileMenuControl.focus({ preventScroll: true });
      } else {
        document.documentElement.style.overflow = previousMobileHtmlOverflow;
        document.body.style.overflow = previousMobileBodyOverflow;
        trigger.focus();
      }
    }
  }

  trigger.addEventListener('click', () => {
    setOpen(navigation.dataset.open !== 'true');
  });
  mobileClose.addEventListener('click', () => setOpen(false));
  mobileBackdrop.addEventListener('pointerdown', () => setOpen(false));

  document.addEventListener('pointerdown', (event) => {
    if (!navigation.contains(event.target) && !trigger.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (navigation.dataset.open === 'true' && event.key === 'Tab') {
      const focusable = [mobileMenuControl, ...menu.querySelectorAll('a')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key !== 'Escape' || navigation.dataset.open !== 'true') return;
    setOpen(false);
    trigger.focus();
  });

  window.matchMedia('(min-width: 901px)').addEventListener('change', () => setOpen(false));

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

  const desktopLinks = document.createElement('div');
  desktopLinks.className = 'desktop-navigation__links';
  [
    { label:'Саша Пронченко', href:'index.html' },
    { label:'Pinterest', href:'pinterest.html' },
    { label:'Орбита' }
  ].forEach(({ label, href }) => {
    const item = document.createElement(href ? 'a' : 'span');
    item.className = 'desktop-navigation__link';
    item.textContent = label;
    if (href) {
      item.href = href;
      if (href === currentHref) item.setAttribute('aria-current', 'page');
    } else {
      item.setAttribute('aria-disabled', 'true');
    }
    desktopLinks.append(item);
  });

  desktopMenu.append(closeButton, desktopLinks);
  desktopOverlay.append(desktopMenu);
  if (homeMenuSlot) homeMenuSlot.prepend(desktopTrigger);
  else document.body.append(desktopTrigger);
  document.body.append(desktopOverlay);

  let desktopOpen = false;
  let desktopScrollY = 0;
  function setDesktopOpen(open) {
    if (desktopOpen === open) return;
    desktopOpen = open;
    desktopOverlay.hidden = !open;
    desktopTrigger.setAttribute('aria-expanded', String(open));
    desktopTrigger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) {
      desktopScrollY = window.scrollY;
      closeButton.focus({ preventScroll: true });
    } else if (desktopLayout.matches) {
      desktopTrigger.focus({ preventScroll: true });
    }
  }

  function preventDesktopPageScroll(event) {
    if (!desktopOpen) return;
    if (desktopMenu.contains(event.target) && desktopMenu.scrollHeight > desktopMenu.clientHeight) return;
    event.preventDefault();
  }

  window.addEventListener('wheel', preventDesktopPageScroll, { passive: false });
  window.addEventListener('touchmove', preventDesktopPageScroll, { passive: false });
  window.addEventListener('scroll', () => {
    if (desktopOpen && window.scrollY !== desktopScrollY) {
      window.scrollTo({ top: desktopScrollY, behavior: 'instant' });
    }
  }, { passive: true });

  desktopTrigger.addEventListener('click', () => setDesktopOpen(!desktopOpen));
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
  desktopLayout.addEventListener('change', () => setDesktopOpen(false));
})();
