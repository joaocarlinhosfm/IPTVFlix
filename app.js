const splash = document.getElementById('splash');

/* SPLASH */
window.addEventListener('load', () => {
  setTimeout(() => {
    splash.style.display = 'none';
  }, 1000);
});

/* UI MODE DETECTION */
function updateUIMode() {
  const body = document.body;
  const isLandscape = window.matchMedia('(orientation: landscape)').matches;
  const isLargeScreen = window.innerWidth >= 900;

  if (isLandscape && isLargeScreen) {
    body.classList.add('tv-mode');
    body.classList.remove('mobile-mode');
  } else {
    body.classList.add('mobile-mode');
    body.classList.remove('tv-mode');
  }
}

window.addEventListener('load', updateUIMode);
window.addEventListener('resize', updateUIMode);
window.addEventListener('orientationchange', updateUIMode);

/* ANDROID TV NAVIGATION */
document.addEventListener('keydown', e => {
  if (!document.body.classList.contains('tv-mode')) return;

  const focused = document.activeElement;
  if (!focused.classList.contains('channel')) return;

  const row = focused.closest('.row');
  const rows = Array.from(document.querySelectorAll('.row'));
  const channels = Array.from(row.querySelectorAll('.channel'));

  const rowIndex = rows.indexOf(row);
  const index = channels.indexOf(focused);

  switch (e.key) {
    case 'ArrowRight':
      channels[index + 1]?.focus();
      break;
    case 'ArrowLeft':
      channels[index - 1]?.focus();
      break;
    case 'ArrowDown':
      rows[rowIndex + 1]?.querySelector('.channel')?.focus();
      break;
    case 'ArrowUp':
      rows[rowIndex - 1]?.querySelector('.channel')?.focus();
      break;
    case 'Enter':
      const url = focused.dataset.url;
      if (url) window.location.href = `vlc://${url}`;
      break;
  }
});

/* AUTO SCROLL */
document.addEventListener('focusin', e => {
  if (document.body.classList.contains('tv-mode') &&
      e.target.classList.contains('channel')) {
    e.target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }
});
