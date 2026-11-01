const slides = document.querySelectorAll('.slide');
const tabs = document.querySelectorAll('.tab');

function goToSlide(index) {

  // 1. Переключаем слайды
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });

  // 2. Обновляем активные табы во ВСЕХ таббарах
  tabs.forEach(tab => {
    const tabIndex = Number(tab.dataset.slide);
    tab.classList.toggle('active', tabIndex === index);
  });

  // 3. Скрываем разделители вокруг активного таба (в каждом таббаре отдельно)
  document.querySelectorAll('.tabs').forEach(tabsContainer => {

    const dividers = tabsContainer.querySelectorAll('.tab-divider');

    dividers.forEach(d => d.classList.remove('hidden'));

    if (index > 0) {
      dividers[index - 1]?.classList.add('hidden');
    }

    if (index < dividers.length) {
      dividers[index]?.classList.add('hidden');
    }

  });

  // 4. сохраняем состояние
  localStorage.setItem('activeSlide', index);
}

// 5. обработка кликов по табам
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const index = Number(tab.dataset.slide);
    goToSlide(index);
  });
});

// 6. стартовое состояние
const saved = localStorage.getItem('activeSlide');
goToSlide(saved ? Number(saved) : 0);

lottie.loadAnimation({
    container: document.getElementById('pulsing-dot'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'animations/pulsingDot.json'
});

document.addEventListener('keydown', (e) => {
  const current = Number(localStorage.getItem('activeSlide') || '0');

  if (e.key === 'ArrowRight') {
    const next = Math.min(current + 1, slides.length - 1);
    goToSlide(next);
  }

  if (e.key === 'ArrowLeft') {
    const prev = Math.max(current - 1, 0);
    goToSlide(prev);
  }
});

// =====================
// КАРУСЕЛЬ
// =====================

const track = document.querySelector(".carousel-track");
const cards = document.querySelectorAll(".carousel-card");
const dots = document.querySelectorAll(".carousel-dot");

const prevBtn = document.querySelector(".carousel-btn-prev");
const nextBtn = document.querySelector(".carousel-btn-next");

let currentCard = 0;

function updateCarousel() {
    track.style.transform = `translateX(-${currentCard * 925}px)`;

    // точки
    dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentCard);
    });

    // скрываем стрелку "назад" на первой карточке
    prevBtn.style.visibility = currentCard === 0 ? "hidden" : "visible";
}

nextBtn.addEventListener("click", () => {
    currentCard++;

    if (currentCard >= cards.length) {
        currentCard = 0;
    }

    updateCarousel();
});

prevBtn.addEventListener("click", () => {
    currentCard--;

    if (currentCard < 0) {
        currentCard = cards.length - 1;
    }

    updateCarousel();
});

// первая отрисовка
updateCarousel();

// оверлэй пинтерест ресёрч
const researchTrigger = document.querySelector('.pin-research-trigger');
const researchOverlay = document.querySelector('#researchOverlay');
const researchClose = document.querySelector('.research-close');

console.log(researchTrigger);

researchTrigger.addEventListener('click', () => {
    researchOverlay.classList.add('active');
});


researchClose.addEventListener('click', () => {
    researchOverlay.classList.remove('active');
});


researchOverlay.addEventListener('click', (e) => {
    if (e.target === researchOverlay) {
        researchOverlay.classList.remove('active');
    }
});

// =====================
// ПЛЭЙ И РЕПЛЭЙ ДЛЯ TEST IPHONE
// =====================

const testBlocks = document.querySelectorAll('.before-1, .after-1, .before-2, .after-2');

testBlocks.forEach((block) => {

  const video = block.querySelector('.test-iphone-video');
  const toggleButton = block.querySelector('.video-toggle');
  const toggleIcon = toggleButton.querySelector('img');

  
  // плэй / пауза
  toggleButton.addEventListener('click', () => {

    if (video.paused) {

      video.play();

      toggleIcon.src = 'images/pause.svg';
      toggleIcon.alt = 'Pause';

    } else {

      video.pause();

      toggleIcon.src = 'images/play.svg';
      toggleIcon.alt = 'Play';

    }

  });


  // реплэй
  const replayButton = block.querySelector('.video-replay');

  replayButton.addEventListener('click', () => {

    video.currentTime = 0;
    video.play();

    toggleIcon.src = 'images/pause.svg';
    toggleIcon.alt = 'Pause';

  });

});