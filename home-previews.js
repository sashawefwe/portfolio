(() => {
  const preview = document.createElement('div');
  preview.className = 'image-preview';
  preview.id = 'inline-image-preview';
  preview.hidden = true;
  preview.setAttribute('role', 'tooltip');
  const image = document.createElement('img');
  preview.append(image);
  document.body.append(preview);
  let active = null;
  let closeTimer;

  function close() {
    clearTimeout(closeTimer);
    active?.setAttribute('aria-expanded', 'false');
    active = null;
    preview.hidden = true;
  }

  function position() {
    if (!active || !image.naturalWidth) return;
    const anchor = active.getBoundingClientRect();
    const ratio = image.naturalWidth / image.naturalHeight;
    const width = Math.min(260, document.documentElement.clientWidth - 24,
      Math.max(0, anchor.top - 28) * ratio);
    if (width < 24) return close();
    const center = anchor.left + anchor.width / 2;
    const left = Math.max(12, Math.min(center - width / 2,
      document.documentElement.clientWidth - width - 12));
    preview.style.width = `${width}px`;
    preview.style.left = `${left}px`;
    preview.style.top = `${anchor.top - width / ratio - 16}px`;
    preview.style.setProperty('--tail-left', `${Math.max(12, Math.min(width - 12, center - left))}px`);
    preview.hidden = false;
  }

  function open(button, source) {
    clearTimeout(closeTimer);
    active?.setAttribute('aria-expanded', 'false');
    active = button;
    button.setAttribute('aria-expanded', 'true');
    preview.hidden = true;
    image.alt = button.getAttribute('aria-label');
    image.src = source.src;
    preview.style.setProperty('--preview-image', `url("${source.src}")`);
    if (image.complete) position();
  }

  image.addEventListener('load', position);
  image.addEventListener('error', close);
  document.querySelectorAll('.home-hero__inline-image').forEach(source => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'image-preview-trigger';
    button.setAttribute('aria-label', source.src.includes('grass') ? 'Трава крупным планом' : 'Кот крупным планом');
    button.setAttribute('aria-controls', preview.id);
    button.setAttribute('aria-expanded', 'false');
    source.before(button);
    button.append(source);
    button.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') open(button, source);
    });
    button.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') closeTimer = setTimeout(close, 160);
    });
    button.addEventListener('focus', () => {
      if (button.matches(':focus-visible')) open(button, source);
    });
    button.addEventListener('blur', close);
    button.addEventListener('click', () => {
      if (active === button) close();
      else open(button, source);
    });
  });
  preview.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  preview.addEventListener('pointerleave', () => { closeTimer = setTimeout(close, 160); });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.image-preview-trigger, .image-preview')) close();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  window.addEventListener('scroll', close, { passive: true });
  window.addEventListener('resize', close);
  fitIntroText();
})();
