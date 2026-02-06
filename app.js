const content = document.getElementById("content");
const settings = document.getElementById("settingsModal");
const searchInput = document.getElementById("searchInput");

const LOCAL_STORAGE_KEY = "iptv_m3u_cache";
let m3uCache = null;
let loading = false;

document.getElementById("btnSettings").onclick = () => settings.style.display = "block";
function closeSettings() { settings.style.display = "none"; }

/* ===== Inicializa ===== */
window.addEventListener("load", () => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    m3uCache = JSON.parse(saved);
    render(m3uCache);
  }
});

/* ===== Importa M3U ===== */
async function importM3U() {
  const m3uUrl = document.getElementById("m3uUrl").value.trim();
  if (!m3uUrl) return alert("Coloca a URL da lista M3U");

  showLoading();
  try {
    const res = await fetch(m3uUrl);
    const text = await res.text();
    m3uCache = parseM3U(text);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(m3uCache));
    render(m3uCache);
  } catch (err) {
    alert("Falha ao carregar a lista M3U.");
    console.error(err);
  } finally {
    hideLoading();
    closeSettings();
  }
}

/* ===== Parse M3U ===== */
function parseM3U(data) {
  const lines = data.split("\n");
  const categories = {};
  let current = null;

  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith("#EXTINF")) {
      current = {
        name: line.split(",")[1] || "Canal",
        group: line.match(/group-title="([^"]+)"/)?.[1] || "Outros",
        logo: line.match(/tvg-logo="([^"]+)"/)?.[1] || "",
        url: null
      };
    } else if (line.startsWith("http") && current) {
      current.url = line;
      categories[current.group] ??= [];
      categories[current.group].push(current);
      current = null;
    }
  });

  return categories;
}

/* ===== Pesquisa ===== */
searchInput.addEventListener("input", () => {
  if (!m3uCache) return;
  const term = searchInput.value.toLowerCase();
  const filtered = {};
  Object.keys(m3uCache).forEach(cat => {
    const filteredChannels = m3uCache[cat].filter(c => c.name.toLowerCase().includes(term));
    if (filteredChannels.length > 0) filtered[cat] = filteredChannels;
  });
  render(filtered);
});

/* ===== Render TV-style horizontal ===== */
function render(categories) {
  content.innerHTML = "";

  Object.keys(categories).forEach(cat => {
    const section = document.createElement("div");
    section.className = "category";

    const title = document.createElement("h2");
    title.textContent = cat;
    section.appendChild(title);

    const row = document.createElement("div");
    row.className = "row";

    categories[cat].forEach(ch => {
      const card = document.createElement("div");
      card.className = "channel fade-in";

      const img = document.createElement("img");
      img.src = ch.logo || "https://via.placeholder.com/220x100?text=No+Logo";
      img.loading = "lazy";
      card.appendChild(img);

      const name = document.createElement("strong");
      name.textContent = ch.name;
      card.appendChild(name);

      card.onclick = () => openVLC(ch.url);

      row.appendChild(card);
    });

    section.appendChild(row);
    content.appendChild(section);
  });
}

/* ===== Loading ===== */
function showLoading() {
  if (loading) return;
  loading = true;
  content.innerHTML = `<div class="loading">Carregando lista...</div>`;
}

function hideLoading() { loading = false; }

/* ===== VLC Android ===== */
function openVLC(url) {
  const intent = `intent:${url}#Intent;package=org.videolan.vlc;type=video/*;end`;
  window.location.href = intent;
}

/* ===== Header desaparecer ao scroll ===== */
let lastScroll = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
  if (currentScroll > lastScroll && currentScroll > 50) {
    header.style.top = "-80px";
  } else {
    header.style.top = "0";
  }
  lastScroll = currentScroll;
});
