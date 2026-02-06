const content = document.getElementById("content");
const settings = document.getElementById("settingsModal");

let epgData = {};
const EPG_CACHE_KEY = "iptv_epg_cache";
const EPG_TIME_KEY = "iptv_epg_time";
const EPG_TTL = 24 * 60 * 60 * 1000; // 24h

document.getElementById("btnSettings").onclick = () =>
  settings.style.display = "block";

function closeSettings() {
  settings.style.display = "none";
}

async function importAll() {
  const m3u = document.getElementById("m3uUrl").value;
  const epg = document.getElementById("epgUrl").value;

  if (epg) await loadEPG(epg);
  if (m3u) await loadM3U(m3u);

  closeSettings();
}

/* ================= M3U ================= */

async function loadM3U(url) {
  const res = await fetch(url);
  const text = await res.text();
  parseM3U(text);
}

function parseM3U(data) {
  const lines = data.split("\n");
  const categories = {};
  let current = {};

  lines.forEach(l => {
    if (l.startsWith("#EXTINF")) {
      current = {
        name: l.split(",")[1],
        group: l.match(/group-title="([^"]+)"/)?.[1] || "Outros",
        logo: l.match(/tvg-logo="([^"]+)"/)?.[1] || "",
        tvgId: l.match(/tvg-id="([^"]+)"/)?.[1] || null
      };
    } else if (l.startsWith("http")) {
      current.url = l.trim();
      categories[current.group] ??= [];
      categories[current.group].push(current);
    }
  });

  render(categories);
}

/* ================= EPG ================= */

async function loadEPG(url) {
  const cached = localStorage.getItem(EPG_CACHE_KEY);
  const time = localStorage.getItem(EPG_TIME_KEY);

  if (cached && time && Date.now() - time < EPG_TTL) {
    epgData = JSON.parse(cached);
    return;
  }

  const res = await fetch(url);
  const xmlText = await res.text();
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");

  epgData = {};
  xml.querySelectorAll("programme").forEach(p => {
    const ch = p.getAttribute("channel");
    epgData[ch] ??= [];
    epgData[ch].push({
      start: p.getAttribute("start"),
      stop: p.getAttribute("stop"),
      title: p.querySelector("title")?.textContent || ""
    });
  });

  localStorage.setItem(EPG_CACHE_KEY, JSON.stringify(epgData));
  localStorage.setItem(EPG_TIME_KEY, Date.now());
}

function currentProgram(tvgId) {
  if (!epgData[tvgId]) return "Sem EPG";

  const now = new Date();
  const prog = epgData[tvgId].find(p => {
    const s = parseEPGDate(p.start);
    const e = parseEPGDate(p.stop);
    return now >= s && now <= e;
  });

  return prog ? prog.title : "Sem emissão";
}

function parseEPGDate(s) {
  return new Date(
    s.substr(0,4),
    s.substr(4,2)-1,
    s.substr(6,2),
    s.substr(8,2),
    s.substr(10,2)
  );
}

/* ================= UI ================= */

function render(categories) {
  content.innerHTML = "";
  Object.keys(categories).forEach(cat => {
    const sec = document.createElement("div");
    sec.className = "category";
    sec.innerHTML = `<h2>${cat}</h2>`;

    const row = document.createElement("div");
    row.className = "row";

    categories[cat].forEach(ch => {
      const d = document.createElement("div");
      d.className = "channel";
      d.innerHTML = `
        <img src="${ch.logo}">
        <strong>${ch.name}</strong>
        <div class="epg">${currentProgram(ch.tvgId)}</div>
      `;
      d.onclick = () => openVLC(ch.url);
      row.appendChild(d);
    });

    sec.appendChild(row);
    content.appendChild(sec);
  });
}

/* ================= VLC ================= */

function openVLC(url) {
  const intent = `intent:${url}#Intent;package=org.videolan.vlc;type=video/*;end`;
  window.location.href = intent;
}