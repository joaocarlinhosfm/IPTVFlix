const splash = document.getElementById('splash');
const welcome = document.getElementById('welcome');
const content = document.getElementById('content');
const settingsModal = document.getElementById('settingsModal');

const settingsBtn = document.getElementById('settingsBtn');
const openSettings = document.getElementById('openSettings');
const closeSettings = document.getElementById('closeSettings');
const importBtn = document.getElementById('importBtn');
const m3uInput = document.getElementById('m3uUrl');

/* SPLASH */
window.addEventListener('load', () => {
  setTimeout(() => splash.style.display = 'none', 800);
  checkState();
});

/* STATE */
function checkState() {
  const hasList = localStorage.getItem('m3uList');
  if (!hasList) {
    welcome.style.display = 'flex';
    content.style.display = 'none';
  } else {
    welcome.style.display = 'none';
    content.style.display = 'block';
    renderChannels(JSON.parse(hasList));
  }
}

/* SETTINGS */
function openModal() {
  settingsModal.style.display = 'flex';
}

function closeModal() {
  settingsModal.style.display = 'none';
}

settingsBtn.onclick = openModal;
openSettings.onclick = openModal;
closeSettings.onclick = closeModal;

/* IMPORT */
importBtn.onclick = async () => {
  const url = m3uInput.value.trim();
  if (!url) return alert('Insere um URL M3U');

  try {
    const res = await fetch(url);
    const text = await res.text();
    localStorage.setItem('m3uList', JSON.stringify(parseM3U(text)));
    closeModal();
    checkState();
  } catch {
    alert('Erro ao importar lista');
  }
};

/* M3U PARSER (simples) */
function parseM3U(text) {
  const lines = text.split('\n');
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      channels.push({
        name: lines[i].split(',')[1],
        url: lines[i + 1]
      });
    }
  }
  return channels;
}

/* RENDER */
function renderChannels(channels) {
  content.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'row';

  channels.forEach(ch => {
    const div = document.createElement('div');
    div.className = 'channel';
    div.tabIndex = 0;
    div.textContent = ch.name;
    div.onclick = () => window.location.href = `vlc://${ch.url}`;
    row.appendChild(div);
  });

  content.appendChild(row);
}
