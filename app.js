const splash = document.getElementById('splash');
const app = document.getElementById('app');

/* ORIENTATION CONTROL */
function checkOrientation() {
  if (window.matchMedia('(orientation: landscape)').matches) {
    setTimeout(() => {
      splash.style.display = 'none';
      app.style.display = 'block';

      const first = document.querySelector('.channel');
      if (first) first.focus();
    }, 1200);
  } else {
    splash.style.display = 'flex';
    app.style.display = 'none';
  }
}

window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

/* ANDROID TV NAVIGATION */
document.addEventListener('keydown', e => {
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
  if (e.target.classList.contains('channel')) {
    e.target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }
});
