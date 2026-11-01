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
    if (reducedMotion.matches) dotAnimation.goToAndStop(0, true);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) dotAnimation.goToAndStop(0, true);
    else dotAnimation.play();
  });
});
