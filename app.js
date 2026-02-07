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
  const data = localStorage.getItem('iptvData');
  if (!data) {
    welcome.style.display = 'flex';
    content.style.display = 'none';
  } else {
    welcome.style.display = 'none';
    content.style.display = 'block';
    renderCategories(JSON.parse(data));
  }
}

/* SETTINGS */
function openModal() { settingsModal.style.display = 'flex'; }
function closeModal() { settingsModal.style.display = 'none'; }

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
    const parsed = parseM3U(text);
    localStorage.setItem('iptvData', JSON.stringify(parsed));
    closeModal();
    checkState();
  } catch {
    alert('Erro ao importar lista');
  }
};

/* M3U PARSER COM CATEGORIAS */
function parseM3U(text) {
  const lines = text.split('\n');
  const categories = {};

  let current = null;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const name = lines[i].split(',')[1]?.trim() || 'Sem nome';
      const groupMatch = lines[i].match(/group-title="([^"]+)"/);
      const group = groupMatch ? groupMatch[1] : 'Outros';

      current = { name, group };
    } else if (lines[i].startsWith('http') && current) {
      if (!categories[current.group]) {
        categories[current.group] = [];
      }
      categories[current.group].push({
        name: current.name,
        url: lines[i]
      });
      current = null;
    }
  }
  return categories;
}

/* RENDER CATEGORIAS + TILES */
function renderCategories(categories) {
  content.innerHTML = '';

  Object.keys(categories).forEach(cat => {
    const section = document.createElement('section');
    section.className = 'category';

    const title = document.createElement('h2');
    title.textContent = cat;

    const row = document.createElement('div');
    row.className = 'row';

    categories[cat].forEach(channel => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.tabIndex = 0;
      tile.textContent = channel.name;

      tile.onclick = () => {
        window.location.href = `vlc://${channel.url}`;
      };

      row.appendChild(tile);
    });

    section.appendChild(title);
    section.appendChild(row);
    content.appendChild(section);
  });
}
