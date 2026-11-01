(() => {
  const desktopNavigation = document.querySelector('.site-navigation');
  if (!desktopNavigation) return;

  const currentHref = desktopNavigation.querySelector('[aria-current="page"]')?.getAttribute('href');
  const entries = [
    { label:'Саша Пронченко', href:'index.html' },
    { label:'Pinterest', href:'pinterest.html' },
    { label:'Орбита' }
  ];

  const navigation = document.createElement('div');
  navigation.className = 'mobile-navigation';
  navigation.dataset.open = 'false';

  const trigger = document.createElement('button');
  trigger.className = 'mobile-navigation__trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'mobile-navigation-menu');
  trigger.setAttribute('aria-label', 'Открыть меню');
  trigger.innerHTML = '<img src="assets/icons/navigation/menu.svg" alt="">';

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

  entries.forEach(({ label, href }) => {
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

  navigation.append(trigger, mobileBackdrop, menu);
  document.body.append(navigation);

  let previousMobileHtmlOverflow = '';
  let previousMobileBodyOverflow = '';
  function setOpen(open) {
    const changed = (navigation.dataset.open === 'true') !== open;
    navigation.dataset.open = String(open);
    trigger.setAttribute('aria-expanded', String(open));
    if (changed) {
      mobileBackdrop.hidden = !open;
      if (open) {
        previousMobileHtmlOverflow = document.documentElement.style.overflow;
        previousMobileBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        mobileClose.focus();
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
    if (!navigation.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (navigation.dataset.open === 'true' && event.key === 'Tab') {
      const focusable = [mobileClose, ...menu.querySelectorAll('a')];
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
  desktopTrigger.innerHTML = '<img src="assets/icons/navigation/menu.svg" alt="">';

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
  document.body.append(desktopTrigger, desktopOverlay);

  let desktopOpen = false;
  let previousHtmlOverflow = '';
  let previousBodyOverflow = '';
  function setDesktopOpen(open) {
    if (desktopOpen === open) return;
    desktopOpen = open;
    desktopOverlay.hidden = !open;
    desktopTrigger.setAttribute('aria-expanded', String(open));
    if (open) {
      previousHtmlOverflow = document.documentElement.style.overflow;
      previousBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    } else {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      if (desktopLayout.matches) desktopTrigger.focus();
    }
  }

  desktopTrigger.addEventListener('click', () => setDesktopOpen(true));
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
