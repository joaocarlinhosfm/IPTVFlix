/* ================= CONFIG ================= */

const content = document.getElementById("content");
const settings = document.getElementById("settingsModal");

/* ================= UI ================= */

document.getElementById("btnSettings").onclick = () => {
  settings.style.display = "block";
};

function closeSettings() {
  settings.style.display = "none";
}

async function importM3U() {
  const m3uUrl = document.getElementById("m3uUrl").value.trim();
  if (!m3uUrl) return alert("Coloca a URL da lista M3U");

  await loadM3U(m3uUrl);
  closeSettings();
}

/* ================= SAFE FETCH ================= */

async function fetchSafe(url) {
  return fetch(url);
}

/* ================= M3U ================= */

async function loadM3U(url) {
  const res = await fetchSafe(url);
  const text = await res.text();
  parseM3U(text);
}

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
    }
    else if (line.startsWith("http") && current) {
      current.url = line;
      categories[current.group] ??= [];
      categories[current.group].push(current);
      current = null;
    }
  });

  render(categories);
}

/* ================= RENDER ================= */

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

      card.innerHTML = `
        <img src="${ch.logo}">
        <strong>${ch.name}</strong>
      `;

      card.onclick = () => openVLC(ch.url);
      row.appendChild(card);
    });

    section.appendChild(row);
    content.appendChild(section);
  });
}

/* ================= VLC ================= */

function openVLC(url) {
  const intent = `intent:${url}#Intent;package=org.videolan.vlc;type=video/*;end`;
  window.location.href = intent;
}
