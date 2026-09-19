const introTitle = document.querySelector('.home-hero__intro h1');
const introLines = [...introTitle.querySelectorAll('.home-hero__line')];
const desktopLayout = window.matchMedia('(min-width: 701px)');

function fitIntroText() {
  introTitle.style.removeProperty('--intro-font-size');
  if (!desktopLayout.matches) return;
  const baseSize = parseFloat(getComputedStyle(introTitle).fontSize);
  const widestLine = Math.max(...introLines.map(line => line.getBoundingClientRect().width));
  const availableWidth = introTitle.getBoundingClientRect().width - 2;
  if (widestLine > 0 && availableWidth > 0) {
    let fittedSize = baseSize * availableWidth / widestLine;
    introTitle.style.setProperty('--intro-font-size', `${fittedSize}px`);
    // Verify the actual layout after resizing, including fractional glyph widths.
    for (let pass = 0; pass < 3; pass++) {
      const measuredWidth = Math.max(...introLines.map(line => line.getBoundingClientRect().width));
      if (measuredWidth <= availableWidth) break;
      fittedSize *= availableWidth / measuredWidth;
      introTitle.style.setProperty('--intro-font-size', `${fittedSize}px`);
    }
  }
}

let lastIntroWidth = 0;
new ResizeObserver(([entry]) => {
  if (entry.contentRect.width === lastIntroWidth) return;
  lastIntroWidth = entry.contentRect.width;
  fitIntroText();
}).observe(document.querySelector('.home-hero__intro'));
window.addEventListener('resize', fitIntroText);
document.fonts.ready.then(fitIntroText);
document.fonts.addEventListener('loadingdone', fitIntroText);
introTitle.querySelectorAll('img').forEach(image => {
  image.addEventListener('load', fitIntroText);
});
fitIntroText();

const statusDot = document.querySelector('.home-hero__status-dot');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.addEventListener('DOMContentLoaded', () => {
  if (!window.lottie) return;
  const dotAnimation = window.lottie.loadAnimation({
    container: statusDot,
    renderer: 'svg',
    loop: true,
    autoplay: !reducedMotion.matches,
    path: 'assets/home/animations/pulsing-dot.json'
  });
  dotAnimation.addEventListener('DOMLoaded', () => {
    statusDot.classList.add('is-loaded');
    fitIntroText();
    if (reducedMotion.matches) dotAnimation.goToAndStop(0, true);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) dotAnimation.goToAndStop(0, true);
    else dotAnimation.play();
  });
});
