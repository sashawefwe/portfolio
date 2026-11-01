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
