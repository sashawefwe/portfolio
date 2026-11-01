const summary = document.querySelector('.summary');
const cover = document.querySelector('.case-cover');
const summarySlot = document.querySelector('.summary-slot');
const mobileLayout = window.matchMedia('(max-width:900px)');
const collapseButton = document.querySelector('.summary__collapse');
const widgetButton = document.querySelector('.summary__widget');
const resultTooltip = document.querySelector('.summary__tooltip');
const resultTooltipButton = document.querySelector('.summary__tooltip-button');
const summaryBackdrop = document.querySelector('.summary-backdrop');
const caseSections = [...document.querySelectorAll('.case-section')];
const caseSectionTitleReveals = caseSections.map((section) => section.querySelector('.case-section__title-reveal'));
const iphoneDemos = document.querySelectorAll('.iphone-demo');
let manualExpanded = false;

const desktopSmoothScroll = window.matchMedia('(min-width:901px)');
const reducedScrollMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let desktopScrollInitialized = false;
function initDesktopSmoothScroll() {
  if (desktopScrollInitialized || !desktopSmoothScroll.matches || reducedScrollMotion.matches || !window.luxy) return;
  window.luxy.init({ wrapper:'#luxy', wrapperSpeed:0.055 });
  desktopScrollInitialized = true;
}
initDesktopSmoothScroll();
window.addEventListener('load', initDesktopSmoothScroll);
desktopSmoothScroll.addEventListener('change', initDesktopSmoothScroll);

function initSwipeStack(briefDeck, briefGrid, briefCards) {
  if (!briefDeck || !briefGrid || !briefCards.length) return;
  const briefMobile = window.matchMedia('(max-width:640px)');
  const reducedBriefMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let dragX = 0;
  let horizontalDrag = false;
  let busy = false;
  let activeAnimation = null;

  function updateBriefStack() {
    [...briefGrid.children].forEach((card, index) => {
      card.style.zIndex = String(briefCards.length - index);
    });
  }

  function resetBriefCard(card) {
    card.style.transform = '';
    card.style.zIndex = '';
  }

  function briefDragTransform(x, width) {
    const progress = Math.min(1, Math.abs(x) / (width * .48));
    return `translate3d(${x}px,0,0) rotate(${-8 * progress}deg) scale(${1 - .1 * progress})`;
  }

  async function finishBriefSwipe(card, fromX) {
    busy = true;
    const distance = Math.max(-fromX, Math.min(card.clientWidth * .48, 180));
    const duration = reducedBriefMotion.matches ? 1 : 310;
    const exitTransform = briefDragTransform(-distance, card.clientWidth);
    activeAnimation = card.animate([
      { transform:briefDragTransform(fromX, card.clientWidth) },
      { transform:exitTransform }
    ], { duration, easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards' });
    await activeAnimation.finished.catch(() => {});
    if (!briefMobile.matches) return;
    card.style.transform = exitTransform;
    activeAnimation.cancel();
    card.style.zIndex = '0';
    activeAnimation = card.animate([
      { transform:exitTransform },
      { transform:briefDragTransform(0, card.clientWidth) }
    ], { duration:reducedBriefMotion.matches ? 1 : 360, easing:'cubic-bezier(.22,1,.36,1)', fill:'forwards' });
    await activeAnimation.finished.catch(() => {});
    if (!briefMobile.matches) return;
    activeAnimation.cancel();
    briefGrid.append(card);
    resetBriefCard(card);
    updateBriefStack();
    busy = false;
  }

  function syncBriefLayout() {
    if (briefMobile.matches) {
      briefDeck.classList.add('is-stack');
      updateBriefStack();
      return;
    }
    activeAnimation?.cancel();
    activeAnimation = null;
    pointerId = null;
    busy = false;
    briefDeck.classList.remove('is-stack');
    briefGrid.replaceChildren(...briefCards);
    briefCards.forEach(resetBriefCard);
  }

  briefGrid.addEventListener('pointerdown', (event) => {
    if (!briefMobile.matches || busy || pointerId !== null || !briefGrid.firstElementChild.contains(event.target)) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dragX = 0;
    horizontalDrag = false;
    briefGrid.setPointerCapture(pointerId);
  });

  briefGrid.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId || busy) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!horizontalDrag) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) return;
      horizontalDrag = true;
    }
    dragX = Math.min(0, dx);
    const card = briefGrid.firstElementChild;
    card.style.transform = briefDragTransform(dragX, card.clientWidth);
  });

  function releaseBriefPointer(event, cancelled = false) {
    if (event.pointerId !== pointerId || busy) return;
    pointerId = null;
    const card = briefGrid.firstElementChild;
    const shouldAdvance = !cancelled && horizontalDrag && dragX < -Math.min(60, card.clientWidth * .2);
    if (shouldAdvance) {
      finishBriefSwipe(card, dragX);
    } else {
      activeAnimation = card.animate([
        { transform:briefDragTransform(dragX, card.clientWidth) },
        { transform:briefDragTransform(0, card.clientWidth) }
      ], { duration:reducedBriefMotion.matches ? 1 : 220, easing:'ease-out' });
      card.style.transform = '';
    }
  }
  briefGrid.addEventListener('pointerup', releaseBriefPointer);
  briefGrid.addEventListener('pointercancel', (event) => releaseBriefPointer(event, true));

  briefMobile.addEventListener('change', syncBriefLayout);
  syncBriefLayout();
}

const briefDeck = document.querySelector('.project-brief__deck');
if (briefDeck) initSwipeStack(briefDeck, briefDeck.querySelector('.project-brief__grid'), [...briefDeck.querySelectorAll('.project-brief__card')]);
const processDeck = document.querySelector('.process-tiles');
if (processDeck) initSwipeStack(processDeck, processDeck, [...processDeck.children]);

function updateIphoneScale(iphoneDemo) {
  iphoneDemo.style.setProperty('--iphone-scale', String(iphoneDemo.clientWidth / 449));
}

const iphoneResizeObserver = new ResizeObserver((entries) => {
  entries.forEach(({ target }) => updateIphoneScale(target));
});

iphoneDemos.forEach((iphoneDemo) => {
  updateIphoneScale(iphoneDemo);
  iphoneResizeObserver.observe(iphoneDemo);
});

document.querySelectorAll('.pin-save-video-test').forEach((block) => {
const pinSaveVideoTest = block.querySelector('video');
if (!pinSaveVideoTest) return;
const pinSaveVideoProgress = block.querySelector('.video-progress');
const pinSaveVideoProgressArc = pinSaveVideoProgress.querySelector('.video-progress__arc');
const pinSaveVideoProgressIcon = pinSaveVideoProgress.querySelector('.video-progress__icon');
const videoFeedback = document.createElement('span');
const videoFeedbackIcon = document.createElement('img');
const mobileVideoControl = document.createElement('button');
const mobileVideoControlIcon = document.createElement('img');
videoFeedback.className = 'video-feedback';
videoFeedback.setAttribute('aria-hidden', 'true');
videoFeedbackIcon.alt = '';
videoFeedback.append(videoFeedbackIcon);
mobileVideoControl.className = 'mobile-video-control';
mobileVideoControl.type = 'button';
mobileVideoControl.tabIndex = -1;
mobileVideoControlIcon.alt = '';
mobileVideoControlIcon.setAttribute('aria-hidden', 'true');
mobileVideoControl.append(mobileVideoControlIcon);
block.querySelector('.pin-save-video-test__media').append(videoFeedback, mobileVideoControl);
let pinSaveProgressFrame;
let lastPinSaveProgressUpdate = 0;
let mobileControlTimeout;

function showVideoFeedback(action) {
  if (mobileLayout.matches) return;
  videoFeedbackIcon.src = `assets/icons/video/${action}.svg`;
  videoFeedback.classList.remove('is-visible');
  void videoFeedback.offsetWidth;
  videoFeedback.classList.add('is-visible');
}

function hideMobileVideoControl() {
  clearTimeout(mobileControlTimeout);
  mobileVideoControl.classList.remove('is-visible');
  mobileVideoControl.tabIndex = -1;
  if (document.activeElement === mobileVideoControl) mobileVideoControl.blur();
}

function showMobileVideoControl() {
  if (!mobileLayout.matches) return;
  clearTimeout(mobileControlTimeout);
  const paused = pinSaveVideoTest.paused;
  mobileVideoControlIcon.src = `assets/icons/video/${paused ? 'play' : 'pause'}.svg`;
  mobileVideoControl.setAttribute('aria-label', paused ? 'Продолжить видео' : 'Поставить видео на паузу');
  mobileVideoControl.classList.add('is-visible');
  mobileVideoControl.tabIndex = 0;
  if (!paused) mobileControlTimeout = setTimeout(hideMobileVideoControl, 2000);
}

function togglePinSaveVideo() {
  const shouldPlay = pinSaveVideoTest.paused;
  pinSaveVideoTest.dataset.userPaused = String(!shouldPlay);
  if (shouldPlay) {
    pinSaveVideoTest.play().then(() => {
      showVideoFeedback('play');
      showMobileVideoControl();
    }).catch(() => {});
  } else {
    pinSaveVideoTest.pause();
    showVideoFeedback('pause');
    showMobileVideoControl();
  }
}

function updatePinSaveVideoControl() {
  const paused = pinSaveVideoTest.paused;
  pinSaveVideoProgress.dataset.state = paused ? 'paused' : 'playing';
  pinSaveVideoProgressIcon.src = paused ? 'assets/icons/video/play.svg' : 'assets/icons/video/pause.svg';
  pinSaveVideoProgress.setAttribute('aria-label', paused ? 'Продолжить видео' : 'Поставить видео на паузу');
}

function updatePinSaveVideoProgress(timestamp = performance.now()) {
  const duration = pinSaveVideoTest.duration;
  if (timestamp - lastPinSaveProgressUpdate >= 50 || pinSaveVideoTest.paused) {
    const progress = Number.isFinite(duration) && duration > 0 ? pinSaveVideoTest.currentTime / duration : 0;
    pinSaveVideoProgressArc.setAttribute('stroke-dashoffset', String(1 - Math.min(1, Math.max(0, progress))));
    lastPinSaveProgressUpdate = timestamp;
  }
  if (!pinSaveVideoTest.paused) pinSaveProgressFrame = requestAnimationFrame(updatePinSaveVideoProgress);
}

pinSaveVideoTest.addEventListener('click', () => {
  if (mobileLayout.matches) {
    showMobileVideoControl();
    return;
  }
  togglePinSaveVideo();
});

mobileVideoControl.addEventListener('click', togglePinSaveVideo);
pinSaveVideoProgress.addEventListener('click', togglePinSaveVideo);
block.querySelector('.video-replay').addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.getAnimations().forEach((animation) => animation.cancel());
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const originalColor = getComputedStyle(button).color;
  button.animate([
    { transform:reducedMotion ? 'none' : 'scale(.94)', color:'#1C1C1E' },
    { transform:'none', color:originalColor }
  ], { duration:320, easing:'ease-out' });
  pinSaveVideoTest.currentTime = 0;
  pinSaveVideoTest.dataset.userPaused = 'false';
  pinSaveVideoTest.play().catch(() => {});
  updatePinSaveVideoProgress();
});

pinSaveVideoTest.addEventListener('play', () => {
  if (mobileLayout.matches && mobileVideoControl.classList.contains('is-visible')) {
    showMobileVideoControl();
  } else {
    hideMobileVideoControl();
  }
  updatePinSaveVideoControl();
  cancelAnimationFrame(pinSaveProgressFrame);
  updatePinSaveVideoProgress();
});

pinSaveVideoTest.addEventListener('pause', () => {
  if (pinSaveVideoTest.dataset.userPaused === 'true') showMobileVideoControl();
  else hideMobileVideoControl();
  cancelAnimationFrame(pinSaveProgressFrame);
  updatePinSaveVideoControl();
  updatePinSaveVideoProgress();
});

pinSaveVideoTest.addEventListener('loadedmetadata', updatePinSaveVideoProgress);
mobileLayout.addEventListener('change', () => {
  if (mobileLayout.matches && pinSaveVideoTest.paused && pinSaveVideoTest.dataset.userPaused === 'true') {
    showMobileVideoControl();
  } else {
    hideMobileVideoControl();
  }
});
updatePinSaveVideoControl();
if (!pinSaveVideoTest.paused) updatePinSaveVideoProgress();
});

function syncSummarySlotHeight() {
  if (!mobileLayout.matches) {
    summarySlot.style.minHeight = '';
    return;
  }
  if (summary.dataset.state === 'expanded') {
    // offsetHeight measures layout height, unaffected by the morph animation.
    summarySlot.style.minHeight = `${summary.offsetHeight}px`;
  }
}

const summaryResizeObserver = new ResizeObserver(syncSummarySlotHeight);
summaryResizeObserver.observe(summary);

function applyState(state) {
  // Preserve the placeholder before the card leaves the document flow.
  syncSummarySlotHeight();

  // A fixed element inside Luxy's transformed wrapper is fixed to that
  // wrapper. Move the floating card outside it, then restore it in flow.
  const target = state === 'expanded' ? summarySlot : document.body;
  if (summary.parentElement !== target) target.append(summary);

  summary.dataset.state = state;
  const overlay = state === 'overlay';
  const compact = state === 'compact';
  document.body.classList.toggle('summary-overlay-open', overlay);
  collapseButton.tabIndex = overlay ? 0 : -1;
  collapseButton.setAttribute('aria-hidden', String(!overlay));
  widgetButton.tabIndex = compact ? 0 : -1;
  widgetButton.setAttribute('aria-hidden', String(!compact));
  if (state === 'expanded') {
    syncSummarySlotHeight();
    requestAnimationFrame(syncSummarySlotHeight);
  }
}

function setState(state, morph = false) {
  if (!morph || summary.dataset.state === state || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyState(state);
    return;
  }

  const first = summary.getBoundingClientRect();
  summary.getAnimations().forEach((animation) => animation.cancel());
  applyState(state);
  const last = summary.getBoundingClientRect();

  const deltaX = first.left - last.left;
  const deltaY = first.top - last.top;
  const scaleX = first.width / last.width;
  const scaleY = first.height / last.height;

  summary.animate([
    {
      transformOrigin:'top left',
      transform:`translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`
    },
    { transformOrigin:'top left', transform:'none' }
  ], {
    duration:720,
    easing:'cubic-bezier(.16,1,.3,1)'
  });
}

function onScroll() {
  // The slot keeps the original card bounds even while the card is fixed.
  const trigger = mobileLayout.matches ? summarySlot : cover;
  // Luxy can still be easing its transformed wrapper after native scrolling
  // reaches zero, so the cover's viewport bounds may lag behind the scroll.
  const coverVisible = window.scrollY <= 2 || trigger.getBoundingClientRect().bottom > 0;

  if (coverVisible) {
    manualExpanded = false;
    if (summary.dataset.state !== 'expanded') setState('expanded', true);
    return;
  }

  if (!manualExpanded && summary.dataset.state === 'expanded') {
    setState('compact', true);
  }
}

collapseButton.addEventListener('click', () => {
  manualExpanded = false;
  setState('compact', true);
});

summaryBackdrop.addEventListener('click', () => {
  manualExpanded = false;
  setState('compact', true);
});

widgetButton.addEventListener('click', () => {
  manualExpanded = true;
  setState('overlay', true);
});

resultTooltipButton.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = resultTooltip.dataset.open !== 'true';
  resultTooltip.dataset.open = String(open);
  resultTooltipButton.setAttribute('aria-expanded', String(open));
  if (!open) resultTooltipButton.blur();
});

document.addEventListener('click', () => {
  resultTooltip.dataset.open = 'false';
  resultTooltipButton.setAttribute('aria-expanded', 'false');
  resultTooltipButton.blur();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  resultTooltip.dataset.open = 'false';
  resultTooltipButton.setAttribute('aria-expanded', 'false');
  resultTooltipButton.blur();
});

function setupVideoSlider(videoSlider) {
  const section = videoSlider.closest('.case-section');
  const videoSlides = [...videoSlider.querySelectorAll('.pin-save-video-test')];
  const videoSegment = section.querySelector('.video-segment');
  const videoSegmentButtons = [...videoSegment.querySelectorAll('button')];
  const videoDescriptions = videoSlides.map((slide) => slide.querySelector('.pin-save-video-test__text'));
  const videoDescriptionArea = document.createElement('div');
  videoDescriptionArea.className = 'video-description-area';
  videoSegment.after(videoDescriptionArea);
  const mobileVideoCard = document.createElement('div');
  mobileVideoCard.className = 'mobile-video-card';
  videoSlider.before(mobileVideoCard);
  const sharedVideoControls = document.createElement('div');
  sharedVideoControls.className = 'shared-video-controls';
  const slideControls = videoSlides.map((slide) => slide.querySelector('.video-controls'));
  const slideVideos = videoSlides.map((slide) => slide.querySelector('video'));
  let activeVideoSlide = 0;
  let previousMobileVideo = null;
  let descriptionSwipeStart = null;

  function updateVideoSegment() {
    videoDescriptions.forEach((description, index) => {
      if (mobileLayout.matches) {
        if (description.parentElement !== videoDescriptionArea) videoDescriptionArea.append(description);
      } else if (description.parentElement !== videoSlides[index]) {
        videoSlides[index].prepend(description);
      }
    });
    if (mobileLayout.matches && videoSlider.clientWidth > 0) {
      activeVideoSlide = Math.max(0, Math.min(videoSlides.length - 1,
        Math.round(videoSlider.scrollLeft / videoSlider.clientWidth)));
    }
    videoSegmentButtons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === activeVideoSlide));
    });
    videoSlides.forEach((slide, index) => {
      slide.inert = mobileLayout.matches && index !== activeVideoSlide;
      videoDescriptions[index].dataset.active = String(index === activeVideoSlide);
      videoDescriptions[index].inert = mobileLayout.matches && index !== activeVideoSlide;
      if (mobileLayout.matches) videoDescriptions[index].setAttribute('aria-hidden', String(index !== activeVideoSlide));
      else videoDescriptions[index].removeAttribute('aria-hidden');
    });
    if (mobileLayout.matches) {
      slideControls.forEach((controls, index) => {
        if (!controls) return;
        const target = index === activeVideoSlide ? sharedVideoControls : videoSlides[index];
        if (controls.parentElement !== target) target.append(controls);
      });
      if (previousMobileVideo !== activeVideoSlide) {
        slideVideos.forEach((video, index) => {
          if (!video) return;
          if (index !== activeVideoSlide) video.pause();
          else if (video.dataset.userPaused !== 'true') video.play().catch(() => {});
        });
        previousMobileVideo = activeVideoSlide;
      }
    }
  }

  function syncVideoCardLayout() {
    if (mobileLayout.matches) {
      mobileVideoCard.append(videoSlider, sharedVideoControls, videoDescriptionArea, videoSegment);
    } else {
      mobileVideoCard.before(videoSlider, videoSegment, videoDescriptionArea);
      slideControls.forEach((controls, index) => {
        if (controls) videoSlides[index].append(controls);
      });
      previousMobileVideo = null;
      slideVideos.forEach((video) => {
        if (video && video.dataset.userPaused !== 'true') video.play().catch(() => {});
      });
    }
    updateVideoSegment();
  }

  function selectVideoSlide(index) {
    if (!mobileLayout.matches) return;
    videoSlider.scrollTo({
      left:index * videoSlider.clientWidth,
      behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  }

  videoSegmentButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectVideoSlide(index));
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const next = event.key === 'ArrowRight' ? 1 : 0;
      videoSegmentButtons[next].focus();
      selectVideoSlide(next);
    });
  });
  videoSlider.addEventListener('scroll', updateVideoSegment, { passive:true });
  videoDescriptionArea.addEventListener('touchstart', (event) => {
    if (!mobileLayout.matches || event.touches.length !== 1) {
      descriptionSwipeStart = null;
      return;
    }
    const touch = event.touches[0];
    descriptionSwipeStart = { x:touch.clientX, y:touch.clientY };
  }, { passive:true });
  videoDescriptionArea.addEventListener('touchmove', (event) => {
    if (!descriptionSwipeStart) return;
    const touch = event.touches[0];
    if (event.touches.length !== 1 || Math.abs(touch.clientY - descriptionSwipeStart.y) > 24) {
      descriptionSwipeStart = null;
    }
  }, { passive:true });
  videoDescriptionArea.addEventListener('touchend', (event) => {
    const start = descriptionSwipeStart;
    descriptionSwipeStart = null;
    if (!start || !mobileLayout.matches) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    selectVideoSlide(Math.max(0, Math.min(videoSlides.length - 1,
      activeVideoSlide + (dx < 0 ? 1 : -1))));
  }, { passive:true });
  videoDescriptionArea.addEventListener('touchcancel', () => {
    descriptionSwipeStart = null;
  }, { passive:true });
  new ResizeObserver(() => {
    videoSlider.scrollTo({ left:mobileLayout.matches ? activeVideoSlide * videoSlider.clientWidth : 0, behavior:'instant' });
    updateVideoSegment();
  }).observe(videoSlider);
  mobileLayout.addEventListener('change', syncVideoCardLayout);
  syncVideoCardLayout();
}

document.querySelectorAll('.pin-save-videos').forEach(setupVideoSlider);

const caseSectionObserver = new IntersectionObserver(([entry]) => {
  const section = entry.target.closest('.case-section');
  if (entry.isIntersecting) {
    section.classList.add('is-visible');
    return;
  }

  // Reset only after returning above the section. When the title leaves
  // through the top while scrolling down, it remains revealed.
  if (entry.rootBounds && entry.boundingClientRect.top >= entry.rootBounds.bottom) {
    section.classList.remove('is-visible');
  }
}, { threshold:0.15 });

caseSectionTitleReveals.forEach((titleReveal) => caseSectionObserver.observe(titleReveal));

// Luxy moves the page with a transform, which can make IntersectionObserver
// unreliable in some desktop browsers. Keep the reveal in sync with the
// element's actual on-screen position as a fallback.
let caseTitleRevealFrame = 0;
function syncCaseTitleReveal() {
  caseTitleRevealFrame = 0;
  caseSectionTitleReveals.forEach((titleReveal) => {
    const section = titleReveal.closest('.case-section');
    const bounds = titleReveal.getBoundingClientRect();
    if (bounds.top <= window.innerHeight * .85) {
      section.classList.add('is-visible');
    } else if (bounds.top >= window.innerHeight) {
      section.classList.remove('is-visible');
    }
  });
}
window.addEventListener('scroll', () => {
  if (!caseTitleRevealFrame) caseTitleRevealFrame = requestAnimationFrame(syncCaseTitleReveal);
}, { passive:true });
window.addEventListener('resize', syncCaseTitleReveal);
syncCaseTitleReveal();

const caseSectionTitles = [...document.querySelectorAll('.case-section__title')];
function fitMobileTitles() {
  caseSectionTitles.forEach((title) => {
    title.style.removeProperty('--mobile-title-size');
    if (!mobileLayout.matches) return;
    const fontSize = parseFloat(getComputedStyle(title).fontSize);
    const widestLine = Math.max(...[...title.querySelectorAll('span')]
      .map((line) => line.getBoundingClientRect().width));
    const availableWidth = title.clientWidth - 2;
    if (widestLine > availableWidth) {
      title.style.setProperty('--mobile-title-size', `${fontSize * availableWidth / widestLine}px`);
    }
  });
}
const caseTitleResizeObserver = new ResizeObserver(fitMobileTitles);
caseSectionTitleReveals.forEach((titleReveal) => caseTitleResizeObserver.observe(titleReveal));
document.fonts.ready.then(fitMobileTitles);
mobileLayout.addEventListener('change', fitMobileTitles);
fitMobileTitles();

let scrollUpdateFrame = 0;
window.addEventListener('scroll', () => {
  if (scrollUpdateFrame) return;
  scrollUpdateFrame = requestAnimationFrame(() => {
    scrollUpdateFrame = 0;
    onScroll();
  });
}, { passive:true });
window.addEventListener('resize', () => {
  syncSummarySlotHeight();
  onScroll();
});
mobileLayout.addEventListener('change', () => {
  syncSummarySlotHeight();
  onScroll();
});
applyState('expanded');
onScroll();
