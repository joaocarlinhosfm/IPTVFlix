/* ================= CONFIG ================= */

const content = document.getElementById("content");
const settings = document.getElementById("settingsModal");

const EPG_CACHE_KEY = "iptv_epg_cache";
const EPG_TIME_KEY  = "iptv_epg_time";
const EPG_TTL       = 24 * 60 * 60 * 1000; // 24 horas

let epgData = {};

/* ================= UI ================= */

document.getElementById("btnSettings").onclick = () => {
  settings.style.display = "block";
};

function closeSettings() {
  settings.style.display = "none";
}

async function importAll() {
  const m3uUrl = document.getElementById("m3uUrl").value.trim();
  const epgUrl = document.getElementById("epgUrl").value.trim();

  if (epgUrl) await loadEPG(epgUrl);
  if (m3uUrl) await loadM3U(m3uUrl);

  closeSettings();
}

/* ================= SAFE FETCH ================= */

async function fetchSafe(url) {
  if (url.startsWith("http://")) {
    const proxy = "https://api.allorigins.win/raw?url=";
    return fetch(proxy + encodeURIComponent(url));
  }
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
        tvgId: line.match(/tvg-id="([^"]+)"/)?.[1] || null
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

/* ================= EPG ================= */

async function loadEPG(url) {
  const cached = localStorage.getItem(EPG_CACHE_KEY);
  const time   = localStorage.getItem(EPG_TIME_KEY);

  if (cached && time && Date.now() - time < EPG_TTL) {
    epgData = JSON.parse(cached);
    return;
  }

  const res = await fetchSafe(url);
  const xmlText = await res.text();
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");

  epgData = {};

  xml.querySelectorAll("programme").forEach(p => {
    const channel = p.getAttribute("channel");
    if (!channel) return;

    epgData[channel] ??= [];
    epgData[channel].push({
      start: p.getAttribute("start"),
      stop:  p.getAttribute("stop"),
      title: p.querySelector("title")?.textContent || ""
    });
  });

  localStorage.setItem(EPG_CACHE_KEY, JSON.stringify(epgData));
  localStorage.setItem(EPG_TIME_KEY, Date.now());
}

function getCurrentProgram(tvgId) {
  if (!tvgId || !epgData[tvgId]) return "Sem EPG";

  const now = new Date();

  const prog = epgData[tvgId].find(p => {
    const start = parseEPGDate(p.start);
    const stop  = parseEPGDate(p.stop);
    return now >= start && now <= stop;
  });

  return prog ? prog.title : "Sem emissão";
}

function parseEPGDate(s) {
  return new Date(
    s.substring(0,4),
    s.substring(4,6) - 1,
    s.substring(6,8),
    s.substring(8,10),
    s.substring(10,12)
  );
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
        <div class="epg">${getCurrentProgram(ch.tvgId)}</div>
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