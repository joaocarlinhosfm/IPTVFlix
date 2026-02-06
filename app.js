const content = document.getElementById("content");
const settings = document.getElementById("settingsModal");
const searchInput = document.getElementById("searchInput");

let m3uCache = null;

document.getElementById("btnSettings").onclick = () => settings.style.display = "block";
function closeSettings() { settings.style.display = "none"; }

async function importM3U() {
  const m3uUrl = document.getElementById("m3uUrl").value.trim();
  if (!m3uUrl) return alert("Coloca a URL da lista M3U");

  const res = await fetch(m3uUrl);
  const text = await res.text();
  m3uCache = parseM3U(text);

  render(m3uCache);
  closeSettings();
}

/* Parse M3U */
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

/* Render e pesquisa */
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

function render(categories) {
  content.innerHTML = "";
  Object.keys(categories).forEach(cat => {
    const section = document.createElement("div");
    section.className = "category";
    section.innerHTML = `<h2>${cat}</h2>`;

    const row = document.createElement("div");
    row.className = "row";

    categories[cat].forEach(ch => {
      const card = document.createElement("div");
      card.className = "channel";

      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.textContent = "Abrindo no VLC…";
      card.appendChild(overlay);

      const img = document.createElement("img");
      img.src = ch.logo;
      img.loading = "lazy"; // lazy loading
      card.appendChild(img);

      const name = document.createElement("strong");
      name.textContent = ch.name;
      card.appendChild(name);

      card.onclick = () => {
        card.classList.add("active");
        setTimeout(() => card.classList.remove("active"), 2000);
        openVLC(ch.url);
      };

      row.appendChild(card);
    });

    section.appendChild(row);
    content.appendChild(section);
  });
}

/* VLC Android */
function openVLC(url) {
  const intent = `intent:${url}#Intent;package=org.videolan.vlc;type=video/*;end`;
  window.location.href = intent;
}
