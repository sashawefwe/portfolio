(() => {
  const desktopNavigation = document.querySelector('.site-navigation');
  if (!desktopNavigation) return;

  const currentHref = desktopNavigation.querySelector('[aria-current="page"]')?.getAttribute('href');
  const entries = [
    { label:'Пронченко Саша', href:'index.html' },
    { label:'Pinterest', href:'pinterest.html' },
    { label:'Орбита' },
    { label:'Telegram' },
    { label:'CV' }
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

  navigation.append(trigger, menu);
  document.body.append(navigation);

  function setOpen(open) {
    navigation.dataset.open = String(open);
    trigger.setAttribute('aria-expanded', String(open));
  }

  trigger.addEventListener('click', () => {
    setOpen(navigation.dataset.open !== 'true');
  });

  document.addEventListener('pointerdown', (event) => {
    if (!navigation.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || navigation.dataset.open !== 'true') return;
    setOpen(false);
    trigger.focus();
  });

  window.addEventListener('scroll', () => setOpen(false), { passive:true });
})();
