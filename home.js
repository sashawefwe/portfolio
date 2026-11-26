const desktopScroll = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
let desktopScrollInitialized = false;

function initDesktopScroll() {
  if (desktopScrollInitialized || !desktopScroll.matches || !window.luxy) return;
  window.luxy.init({ wrapper: '#luxy', wrapperSpeed: 0.055 });
  desktopScrollInitialized = true;
}

const floatingMenu = document.querySelector('.home-intro__menu');

if (floatingMenu) {
  let previousScrollY = Math.max(0, window.scrollY);
  let touchStartY;
  let hideMenuTimer;

  function hideFloatingMenu() {
    floatingMenu.dataset.scrollHidden = 'true';
  }

  function showFloatingMenu() {
    floatingMenu.dataset.scrollHidden = 'false';
    window.clearTimeout(hideMenuTimer);
    hideMenuTimer = window.setTimeout(hideFloatingMenu, 2400);
  }

  window.addEventListener('scroll', () => {
    const scrollY = Math.max(0, window.scrollY);
    if (scrollY < previousScrollY) {
      showFloatingMenu();
    } else if (scrollY > previousScrollY) {
      window.clearTimeout(hideMenuTimer);
      hideFloatingMenu();
    }
    previousScrollY = scrollY;
  }, { passive: true });

  window.addEventListener('wheel', (event) => {
    if (window.scrollY <= 0 && event.deltaY < 0) showFloatingMenu();
  }, { passive: true });

  window.addEventListener('touchstart', (event) => {
    touchStartY = event.touches[0]?.clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (window.scrollY <= 0 && event.touches[0]?.clientY > touchStartY + 4) showFloatingMenu();
  }, { passive: true });

  floatingMenu.addEventListener('focusin', showFloatingMenu);
  showFloatingMenu();
}

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

const homePlayer = document.querySelector('.home-player');

if (homePlayer) {
  const audio = homePlayer.querySelector('audio');
  const toggle = homePlayer.querySelector('.home-player__toggle');
  const seek = homePlayer.querySelector('.home-player__seek');
  const elapsed = homePlayer.querySelector('.home-player__elapsed');
  const duration = homePlayer.querySelector('.home-player__duration');
  const error = homePlayer.querySelector('.home-player__error');
  const bars = [...homePlayer.querySelectorAll('.home-player__equalizer i')];
  const bands = [[40, 95], [95, 200], [200, 500], [500, 1800], [1800, 5500]];
  const levels = bars.map(() => .35);
  const listeners = new AbortController();
  const listen = { signal: listeners.signal };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let context;
  let source;
  let analyser;
  let spectrum;
  let bins;
  let equalizerProfile;
  let frame = null;
  let previousFrameTime;

  function stopEqualizer(reset = false) {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previousFrameTime = undefined;
    if (reset) bars.forEach((bar, index) => {
      levels[index] = .35;
      bar.style.removeProperty('--bar-level');
    });
  }

  function getEqualizerProfile() {
    if (!equalizerProfile) return null;
    if (Number.isFinite(audio.duration) && Math.abs(audio.duration - equalizerProfile.duration) > .5) return null;
    return equalizerProfile;
  }

  function updateLiveBands(elapsed) {
    analyser.getFloatFrequencyData(spectrum);
    bins.forEach(([start, end], index) => {
      let sum = 0;
      let peak = 0;
      for (let bin = start; bin < end; bin += 1) {
        const value = 10 ** (spectrum[bin] / 20);
        sum += value;
        peak = Math.max(peak, value);
      }
      const mean = sum / (end - start);
      const peakWeight = index < 2 ? .78 : .55;
      const amplitude = peakWeight * peak + (1 - peakWeight) * mean;
      // Leave room for strong peaks while keeping quieter bands distinct.
      const energy = amplitude / (amplitude + .055);
      const target = .35 + .65 * energy;
      const response = target > levels[index] ? 18 : 140;
      levels[index] += (target - levels[index]) * (1 - Math.exp(-elapsed / response));
    });
  }

  function renderEqualizer(now) {
    frame = null;
    if (audio.paused || audio.ended || audio.seeking || reducedMotion.matches) return;
    const profile = getEqualizerProfile();
    const live = analyser && context.state === 'running';
    if (!profile && !live) return;

    const elapsed = previousFrameTime === undefined ? 16 : Math.min(now - previousFrameTime, 50);
    previousFrameTime = now;
    if (live) updateLiveBands(elapsed);

    if (profile) {
      const lastFrame = profile.samples.length / bars.length - 1;
      const position = Math.min(audio.currentTime * profile.rate, lastFrame);
      const first = Math.floor(position);
      const next = Math.min(first + 1, lastFrame);
      const mix = position - first;
      bars.forEach((bar, index) => {
        const a = profile.samples[first * bars.length + index];
        const b = profile.samples[next * bars.length + index];
        const baked = (a + (b - a) * mix) / 255;
        const level = live ? .9 * baked + .1 * levels[index] : baked;
        bar.style.setProperty('--bar-level', level.toFixed(3));
      });
    } else {
      bars.forEach((bar, index) => bar.style.setProperty('--bar-level', levels[index].toFixed(3)));
    }
    frame = window.requestAnimationFrame(renderEqualizer);
  }

  function startEqualizer() {
    if (frame !== null || audio.paused || audio.ended || audio.seeking || reducedMotion.matches) return;
    if (!getEqualizerProfile() && (!analyser || context.state !== 'running')) return;
    frame = window.requestAnimationFrame(renderEqualizer);
  }

  function activateAudioAnalysis() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      if (!context) {
        context = new AudioContext();
        context.addEventListener('statechange', startEqualizer, listen);
      }
      // Resume from the Play gesture before routing the media element through Web Audio.
      context.resume().then(() => {
        if (listen.signal.aborted) return;
        if (!source) {
          const node = context.createAnalyser();
          node.fftSize = 2048;
          node.smoothingTimeConstant = 0;
          const hertzPerBin = context.sampleRate / node.fftSize;
          spectrum = new Float32Array(node.frequencyBinCount);
          bins = bands.map(([low, high]) => {
            const start = Math.min(spectrum.length - 1, Math.ceil(low / hertzPerBin));
            const end = Math.min(spectrum.length, Math.max(start + 1, Math.ceil(high / hertzPerBin)));
            return [start, end];
          });
          node.connect(context.destination);
          source = context.createMediaElementSource(audio);
          source.connect(node);
          analyser = node;
        }
        startEqualizer();
      }).catch(() => {});
    } catch {
      // The native player still works if the browser cannot initialize Web Audio.
    }
  }

  function formatPlayerTime(seconds) {
    const wholeSeconds = Math.floor(seconds);
    return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
  }

  function updatePlayerProgress() {
    const hasDuration = Number.isFinite(audio.duration) && audio.duration > 0;
    const current = formatPlayerTime(audio.currentTime);
    const total = hasDuration ? formatPlayerTime(audio.duration) : '–:––';
    elapsed.textContent = current;
    duration.textContent = total;
    seek.disabled = !hasDuration;
    seek.max = hasDuration ? audio.duration : 1;
    seek.value = audio.currentTime;
    seek.style.setProperty('--player-progress', `${hasDuration ? audio.currentTime / audio.duration * 100 : 0}%`);
    seek.setAttribute('aria-valuetext', `${current} / ${total}`);
  }

  function updatePlaybackState() {
    const playing = !audio.paused && !audio.ended;
    homePlayer.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
    if (playing) startEqualizer();
    else stopEqualizer(audio.ended);
  }

  function showPlaybackError() {
    stopEqualizer(true);
    error.textContent = 'Не удалось воспроизвести трек.';
    error.hidden = false;
    homePlayer.classList.remove('is-playing');
    toggle.setAttribute('aria-label', 'Воспроизвести');
  }

  toggle.addEventListener('click', async () => {
    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }
    error.hidden = true;
    try {
      activateAudioAnalysis();
      await audio.play();
    } catch (playbackError) {
      if (playbackError.name !== 'AbortError') showPlaybackError();
    }
  }, listen);

  seek.addEventListener('input', () => {
    audio.currentTime = seek.valueAsNumber;
    updatePlayerProgress();
  }, listen);

  ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked'].forEach(event => audio.addEventListener(event, updatePlayerProgress, listen));
  ['play', 'pause', 'ended'].forEach(event => audio.addEventListener(event, updatePlaybackState, listen));
  ['playing', 'seeked'].forEach(event => audio.addEventListener(event, startEqualizer, listen));
  audio.addEventListener('seeking', () => stopEqualizer(true), listen);
  audio.addEventListener('waiting', () => stopEqualizer(), listen);
  audio.addEventListener('error', showPlaybackError, listen);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) stopEqualizer(true);
    else startEqualizer();
  }, listen);
  window.addEventListener('pagehide', (event) => {
    stopEqualizer();
    if (event.persisted) return;
    listeners.abort();
    source?.disconnect();
    analyser?.disconnect();
    if (context && context.state !== 'closed') context.close().catch(() => {});
  }, listen);
  window.addEventListener('pageshow', startEqualizer, listen);
  fetch(new URL('mietze_conte_2000-equalizer.json', audio.src), listen)
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data || !Number.isFinite(data.rate) || data.rate <= 0 ||
          !Number.isFinite(data.duration) || data.duration <= 0 || typeof data.frames !== 'string') return;
      const samples = Uint8Array.from(atob(data.frames), char => char.charCodeAt(0));
      if (samples.length < bars.length || samples.length % bars.length !== 0 ||
          Math.abs(samples.length / bars.length / data.rate - data.duration) > .5) return;
      equalizerProfile = { rate: data.rate, duration: data.duration, samples };
      startEqualizer();
    }).catch(() => {});
  toggle.disabled = false;
  updatePlayerProgress();
  updatePlaybackState();
}

const workPhrase = document.querySelector('.home-work-grid__phrase');

if (workPhrase) {
  const phrases = [workPhrase.textContent, 'Проверяю пиксели', 'Оттачиваю детали', 'Причёсываю макеты'];
  const reducedPhraseMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let phraseIndex = 0;
  let phraseTimer;

  function createPhraseLine(text) {
    const line = document.createElement('span');
    line.className = 'home-work-grid__phrase-line';
    let letterIndex = 0;
    for (const letter of text) {
      if (letter === ' ') {
        line.append(' ');
        continue;
      }
      const letterElement = document.createElement('span');
      letterElement.className = 'home-work-grid__phrase-letter';
      letterElement.textContent = letter;
      letterElement.style.setProperty('--letter-delay', `${letterIndex++ * 16}ms`);
      line.append(letterElement);
    }
    return line;
  }

  function updatePhraseMotion() {
    window.clearInterval(phraseTimer);
    if (reducedPhraseMotion.matches) {
      workPhrase.textContent = phrases[phraseIndex];
      return;
    }
    const phraseWindow = document.createElement('span');
    phraseWindow.className = 'home-work-grid__phrase-window';
    let currentLine = createPhraseLine(phrases[phraseIndex]);
    phraseWindow.append(currentLine);
    workPhrase.replaceChildren(phraseWindow);
    phraseTimer = window.setInterval(() => {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      const outgoingLine = currentLine;
      currentLine = createPhraseLine(phrases[phraseIndex]);
      currentLine.classList.add('is-entering');
      outgoingLine.classList.remove('is-entering');
      outgoingLine.classList.add('is-leaving');
      outgoingLine.setAttribute('aria-hidden', 'true');
      outgoingLine.lastElementChild.addEventListener('animationend', () => outgoingLine.remove(), { once: true });
      phraseWindow.replaceChildren(outgoingLine, currentLine);
    }, 2900);
  }

  reducedPhraseMotion.addEventListener('change', updatePhraseMotion);
  updatePhraseMotion();
}

const heroConfetti = document.querySelector('.home-hero__confetti:not([hidden])');

if (heroConfetti) {
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
    return !reducedMotion.matches && window.scrollY < 8
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
  reducedMotion.addEventListener('change', reactToActivity);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || dotTimer !== undefined || heroConfetti.querySelector('.home-hero__confetti-dot:not(.is-falling)')) return;
    window.clearTimeout(idleTimer);
    startDots();
  });

  scheduleDots();
}

document.getElementById('home-luxy')?.addEventListener('load', initDesktopScroll);
desktopScroll.addEventListener('change', initDesktopScroll);
initDesktopScroll();
