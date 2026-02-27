document.addEventListener("DOMContentLoaded", async function () {

  if (!document.getElementById("cardSearch") || !document.getElementById("cardModal")) {
    return;
  }
  /* =============================
     LOAD CardInfo.txt -> DATABASE
     CardInfo.txt is TAB-separated.
     Expected columns:
     0  frontName
     1  frontMana
     2  frontType
     3  frontText
     4  frontPower
     5  frontToughness
     6  frontFlavor (optional)
     7  backName (optional)
     8  backMana (optional)
     9  backType (optional)
     10 backText (optional)
     11 backPower (optional)
     12 backToughness (optional)
     13 backFlavor (optional)
  ============================== */

    const setSelect = document.getElementById("setSelect");
if (setSelect) {
  setSelect.addEventListener("change", () => {
    if (setSelect.value) window.location.href = setSelect.value;
  });
}

// -----------------------------
// Custom Set Dropdown (button + menu)
// -----------------------------
const setMenuBtn = document.getElementById("setMenuBtn");
const setMenu = document.getElementById("setMenu");

function closeSetMenu() {
  if (!setMenu || !setMenuBtn) return;
  setMenu.classList.remove("open");
  setMenuBtn.setAttribute("aria-expanded", "false");
}

function openSetMenu() {
  if (!setMenu || !setMenuBtn) return;
  setMenu.classList.add("open");
  setMenuBtn.setAttribute("aria-expanded", "true");
}

function toggleSetMenu() {
  if (!setMenu || !setMenuBtn) return;
  const isOpen = setMenu.classList.contains("open");
  isOpen ? closeSetMenu() : openSetMenu();
}

function getCurrentPageName() {
  const p = (window.location.pathname || "").split("/").pop();
  return p || "index.html";
}

function syncActiveSetItem() {
  if (!setMenu || !setMenuBtn) return;

  const current = getCurrentPageName();
  const items = Array.from(setMenu.querySelectorAll(".nav-dropdown-item"));

  let activeText = "Choose a set…";
  items.forEach(btn => {
    const v = btn.dataset.value;
    const isActive = v === current;
    btn.classList.toggle("active", isActive);
    if (isActive) activeText = btn.textContent.trim();
  });

  // Show current page as label (nice polish)
  setMenuBtn.childNodes[0].textContent = activeText + " ";
}

if (setMenuBtn && setMenu) {
  // Initialize active label
  syncActiveSetItem();

  setMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSetMenu();
  });

  setMenu.addEventListener("click", (e) => {
    const item = e.target.closest(".nav-dropdown-item");
    if (!item) return;

    const value = item.dataset.value;
    closeSetMenu();
    if (value) window.location.href = value;
  });

  // Click outside closes
  document.addEventListener("click", () => closeSetMenu());

  // Escape closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSetMenu();
  });
}

  async function loadCardDatabaseFromTxt(url = "CardInfo.txt") {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);

    const raw = await res.text();

    // Split into lines, ignore blanks
    const lines = raw
      .split(/\r?\n/)
      .map(l => l.trimEnd())
      .filter(l => l.trim().length > 0);

    const db = {};

    for (const line of lines) {
      // Tabs are the delimiter in your file
      const cols = line.split("\t");

      const frontName = (cols[0] || "").trim();
      if (!frontName) continue;

      const frontMana = (cols[1] || "").trim();
      const frontType = (cols[2] || "").trim();
      const frontText = (cols[3] || "").trim();
      const frontPower = (cols[4] || "").trim();
      const frontToughness = (cols[5] || "").trim();
      const frontFlavor = (cols[6] || "").trim();

      const backName = (cols[7] || "").trim();
      const backMana = (cols[8] || "").trim();
      const backType = (cols[9] || "").trim();
      const backText = (cols[10] || "").trim();
      const backPower = (cols[11] || "").trim();
      const backToughness = (cols[12] || "").trim();
      const backFlavor = (cols[13] || "").trim();

      db[normalizeCardKey(frontName)] = {
        front: {
          name: frontName,
          mana: frontMana,
          type: frontType,
          text: frontText,
          pt: (frontPower && frontToughness) ? `${frontPower}/${frontToughness}` : "",
          flavor: frontFlavor
        },
        back: backName ? {
          name: backName,
          mana: backMana,
          type: backType,
          text: backText,
          pt: (backPower && backToughness) ? `${backPower}/${backToughness}` : "",
          flavor: backFlavor
        } : null
      };
    }

    return db;
  }

  let cardDatabase = {};
  try {
    const cardInfoUrl = document.body.dataset.cardinfo || "CardInfo.txt";
    cardDatabase = await loadCardDatabaseFromTxt(cardInfoUrl);
  } catch (err) {
    console.error(err);
  }

  /* =============================
     MODAL LOGIC
  ============================== */

  const modal = document.getElementById("cardModal");
  const modalFront = document.getElementById("modalFront");
  const modalBack = document.getElementById("modalBack");
  const card3d = document.getElementById("card3d");

  const modalTitle = document.getElementById("cardTitle");
  const modalMana = document.getElementById("cardMana");
  const modalType = document.getElementById("cardType");
  const modalText = document.getElementById("cardText");
  const modalPowerToughness = document.getElementById("cardPowerToughness");
  const modalFlavor = document.getElementById("cardFlavor");
  const oraclePanel = document.getElementById("oraclePanel");
  const oracleDeckLink = document.getElementById("oracleDeckLink");
  const oracleTextBox = document.getElementById("oracleText");

  const closeBtn = document.querySelector(".close");
  const flipButton = document.getElementById("flipButton");
  const modalContent = document.querySelector(".modal-content");
  function applyColorGlowForFace(faceData) {
  if (!modalContent || !faceData) return;


  const manaRaw = (faceData.mana || "").toUpperCase();
  const order = [];
  const seen = new Set();

  function addColor(c) {
    if (!"WUBRG".includes(c)) return;
    if (seen.has(c)) return;
    seen.add(c);
    order.push(c);
  }

  // Supports both:
  //  "2WU"
  //  "{2}{W}{U}"
  let tokens;

  if (manaRaw.includes("{")) {
    tokens = manaRaw.match(/\{([^}]+)\}/g)?.map(t => t.replace(/[{}]/g, "")) || [];
  } else {
    tokens = manaRaw.match(/\d+|[A-Z]/g) || [];
  }

  for (const t of tokens) {
    if (/^[WUBRG]$/.test(t)) {
      addColor(t);
    } else if (/^[WUBRG]+$/.test(t)) {
      for (const ch of t) addColor(ch);
    }
  }

  const glow = {
    W: "rgba(245, 245, 235, 0.55)",
    U: "rgba(80, 170, 255, 0.55)",
    B: "rgba(120, 90, 170, 0.55)",
    R: "rgba(255, 90, 80, 0.55)",
    G: "rgba(90, 210, 120, 0.55)"
  };

  if (order.length === 0) {
  // Colorless / no WUBRG in cost -> light grey glow like generic mana
  modalContent.classList.add("has-glow");
  modalContent.style.setProperty("--glow-bg", "rgba(210, 210, 210, 0.45)");
  return;
}

  const bg = (order.length === 1)
    ? glow[order[0]]
    : `linear-gradient(90deg, ${order.map(c => glow[c]).join(", ")})`;

  modalContent.classList.add("has-glow");
  modalContent.style.setProperty("--glow-bg", bg);
}

  let hasBackImage = false;
  let currentFace = "front"; // "front" | "back"
  let currentCardEntry = null;

  function renderFace(face) {
    if (!currentCardEntry) return;

    const data = currentCardEntry[face];
    if (!data) return;

    modalTitle.textContent = data.name || "";
    modalMana.innerHTML = "";

const SPRITE_STEP_X = 100;   // pitch between icons (not 100)
const SPRITE_STEP_Y = 100;

const manaRaw = (data.mana || "").trim();

// map ONLY the symbols you actually use from CardInfo
// grid is 10 columns wide:
// row 0: 0-9
// row 1: 10-19
// row 2: 20, X, Y, Z, W, U, B, R, G, (snow/other)
function symbolToGrid(token) {
  // numbers
  if (/^\d+$/.test(token)) {
    const n = parseInt(token, 10);
    if (n >= 0 && n <= 9) return { row: 0, col: n };
    if (n >= 10 && n <= 19) return { row: 1, col: n - 10 };
    if (n === 20) return { row: 2, col: 0 };
    return null;
  }

  const t = token.toUpperCase();
  const map = {
    T: { row: 5, col: 0 },
    W: { row: 2, col: 4 },
    U: { row: 2, col: 5 },
    B: { row: 2, col: 6 },
    R: { row: 2, col: 7 },
    G: { row: 2, col: 8 },
    X: { row: 2, col: 1 },
    Y: { row: 2, col: 2 },
    Z: { row: 2, col: 3 },
  };

  return map[t] || null;
}

// support either "{2}{W}{U}" or "2WU"
let tokens = [];
if (manaRaw.includes("{") && manaRaw.includes("}")) {
  tokens = manaRaw.match(/\{([^}]+)\}/g)?.map(t => t.replace(/[{}]/g, "").trim()) || [];
} else {
  tokens = manaRaw.match(/\d+|[A-Za-z]/g) || [];
}

for (const t of tokens) {
  const pos = symbolToGrid(t);

  if (!pos) {
    // show raw token if not mapped (so nothing silently disappears)
    const txt = document.createElement("span");
    txt.textContent = t;
    txt.style.marginLeft = "6px";
    modalMana.appendChild(txt);
    continue;
  }

  const el = document.createElement("span");
  el.className = "mana-symbol";
  const GRID_COLS = 10;
  const GRID_ROWS = 7;

  const xPercent = (pos.col / (GRID_COLS - 1)) * 100;
  const yPercent = (pos.row / (GRID_ROWS - 1)) * 100;

  el.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
  modalMana.appendChild(el);
}
    modalType.textContent = data.type || "";
    // Your CSS uses white-space: pre-line; so textContent is perfect

const rulesRaw = (data.text || "").replace(/\\n/g, "\n");

// token -> icon span HTML
function iconHTML(token) {
  const pos = symbolToGrid(token);
  if (!pos) return null;

  const GRID_COLS = 10;
  const GRID_ROWS = 7;
  const xPercent = (pos.col / (GRID_COLS - 1)) * 100;
  const yPercent = (pos.row / (GRID_ROWS - 1)) * 100;

  return `<span class="mana-symbol" style="background-position:${xPercent}% ${yPercent}%"></span>`;
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

// Replaces mana/tap chunks like: "1UB", "WU", "T", "10RG"
// when NOT inside a larger word. Works before ":" "," space, end-of-line, etc.
function renderRulesWithIcons(text) {
  let out = "";
  let i = 0;

  // Matches a mana/tap chunk ONLY if followed by : or ,
  // Examples matched:
  //   1UB:
  //   WU:
  //   1,
  //   T:
  //   10RG,
  const re = /(\d{1,2}[WUBRGT]+|[WUBRGT]+)(?=$|[^A-Za-z0-9_])|(\d{1,2})(?=[:,])/g;

  while (true) {
    const m = re.exec(text);
    if (!m) break;

    const token = m[1] || m[2];
    const start = m.index;
    const end = start + token.length;

    const prevChar = start > 0 ? text[start - 1] : "";

    // prevent replacing inside words like "Bounty"
    const leftOK = start === 0 || !/[A-Za-z0-9_]/.test(prevChar);
    if (!leftOK) continue;

    out += escapeHTML(text.slice(i, start));

    let rest = token;

    // leading number (optional)
    const numMatch = rest.match(/^\d{1,2}/);
    if (numMatch) {
      const num = numMatch[0];
      const icon = iconHTML(num);
      out += icon ? icon : escapeHTML(num);
      rest = rest.slice(num.length);
    }

    // remaining letters
    for (const ch of rest) {
      const icon = iconHTML(ch);
      out += icon ? icon : escapeHTML(ch);
    }

    i = end;
  }

  out += escapeHTML(text.slice(i));
  return out.replace(/\n/g, "<br>");
}

modalText.innerHTML = renderRulesWithIcons(rulesRaw);
    modalPowerToughness.textContent = data.pt || "";
    modalFlavor.textContent = data.flavor || "";
    applyColorGlowForFace(data);
  }
  

  function clearInfo(message = "") {
    modalTitle.textContent = "";
    modalMana.textContent = "";
    modalType.textContent = "";
    modalText.textContent = message;
    modalPowerToughness.textContent = "";
    modalFlavor.textContent = "";
  }

  const prevBtn = document.getElementById("prevCard");
  const nextBtn = document.getElementById("nextCard");

  if (!prevBtn || !nextBtn) {
    // Page doesn’t have nav buttons; stop modal navigation wiring.
    return;
  }

const cardContainers = Array.from(document.querySelectorAll("section.cardlist ol"));
  // fallback for older layouts
  if (!cardContainers.length) {
    cardContainers.push(...Array.from(document.querySelectorAll(".cardlist ol")));
  }
let currentIndex = -1;

function normalizeCardKey(s) {
  return (s || "")
    .normalize("NFKC")
    .replace(/[’‘‛′`]/g, "'")   // all common apostrophe-like chars -> '
    .replace(/\s+/g, " ")
    .trim();
}

function getCardNameFromContainer(container) {
  const mainImage = container.querySelector(".image_main") || container.querySelector("img");
  if (!mainImage) return "";

  // Prefer full image path
  let fullPath = mainImage.dataset.full || mainImage.getAttribute("src") || "";
  let filename = fullPath.split("/").pop() || "";

  filename = decodeURIComponent(filename);

  return normalizeCardKey(filename.replace(/\.png$/i, ""));
}

const orderedNames = cardContainers.map(getCardNameFromContainer);

function updateNavButtons() {
  if (currentIndex < 0) return;

  const prevIndex = (currentIndex - 1 + cardContainers.length) % cardContainers.length;
  const nextIndex = (currentIndex + 1) % cardContainers.length;

  prevBtn.textContent = `← ${orderedNames[prevIndex]}`;
  nextBtn.textContent = `${orderedNames[nextIndex]} →`;
}

function openCardAtIndex(idx) {
  currentIndex = idx;

  modal.style.display = "flex";
  document.body.classList.add("modal-open");

  card3d.classList.remove("flipped");
  currentFace = "front";

  const container = cardContainers[idx];

  const mainImage = container.querySelector(".image_main") || container.querySelector("img");
  const hoverImage = container.querySelector(".image-hover");

  const frontSrc = mainImage ? (mainImage.dataset.full || mainImage.getAttribute("src")) : "";
  const backSrc  = hoverImage ? (hoverImage.dataset.full || hoverImage.getAttribute("src")) : null;

  modalFront.src = frontSrc;
  modalBack.src = backSrc ? backSrc : "";

  hasBackImage = !!backSrc;
  flipButton.style.display = hasBackImage ? "block" : "none";

  const name = orderedNames[idx];
  currentCardEntry = cardDatabase[normalizeCardKey(name)] || null;

const cardKey = normalizeCardKey(name);
const linksSet = deckLinksByCardKey.get(cardKey);
const links = linksSet ? Array.from(linksSet) : [];

if (links.length === 0) {
  oraclePanel.style.display = "none";
} else {
  oraclePanel.style.display = "block";

  // If a card appears in multiple decklists, use the first link.
  // (If you want a dropdown/list later, say so.)
  oracleDeckLink.href = links[0];
  oracleDeckLink.textContent = "View decklist on Archidekt";
}

oracleTextBox.textContent = ""; // later we’ll fill this with oracle text

  if (!currentCardEntry) {
    clearInfo("No card data found.");
  } else {
    renderFace("front");
    applyColorGlowForFace(currentCardEntry.front);
  }

  updateNavButtons();
}

const searchInput = document.getElementById("cardSearch");
const searchCount = document.getElementById("searchCount");

// =============================
// MANUAL DECKLIST FILE NAMES
// =============================
const DECKLIST_FILES = [
  "Taliyah, Rubble Rouser.txt",
  "Zilean, Keeper of Icathia.txt"
  // Add more here
];

function normalizeForCompare(s) {
  return (s || "")
    .normalize("NFKC")
    .replace(/[’‘‛′`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Match card name as a "whole token-ish" thing, not as part of another word.
// Example: "Annie" won't match "Annie's" perfectly, but it WILL match "Annie, Cursed..."
function deckTextContainsCard(deckTextNorm, cardName) {
  const n = normalizeForCompare(cardName);
  if (!n) return false;

  // boundaries: start OR non-alnum before, and end OR non-alnum after
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(n)}([^a-z0-9]|$)`, "i");
  return re.test(deckTextNorm);
}

// --- Color parsing helpers (from mana cost) ---
const COLOR_WORD_TO_LETTER = {
  white: "W", blue: "U", black: "B", red: "R", green: "G",
  w: "W", u: "U", b: "B", r: "R", g: "G",
};

function extractColorsFromMana(mana) {
  const manaRaw = (mana || "").toUpperCase();
  const colors = new Set();

  // supports "{2}{W}{U}" OR "2WU"
  let tokens = [];
  if (manaRaw.includes("{")) {
    tokens = manaRaw.match(/\{([^}]+)\}/g)?.map(t => t.replace(/[{}]/g, "")) || [];
  } else {
    tokens = manaRaw.match(/\d+|[A-Z]/g) || [];
  }

  for (const t of tokens) {
    if (/^[WUBRG]$/.test(t)) colors.add(t);
    else if (/^[WUBRG]+$/.test(t)) for (const ch of t) colors.add(ch);
  }
  return colors;
}

const deckLinksByCardKey = new Map(); // normalized card name -> Set(links)

// Build base searchable index (we’ll fill inDeck after decklists load)
const searchable = cardContainers.map((container, idx) => {
  const name = orderedNames[idx] || "";
  const key = normalizeCardKey(name);
  const entry = cardDatabase[key] || null;
  const front = entry?.front || {};

  return {
    container,
    name,
    nameKey: normalizeForCompare(name),
    typeLine: (front.type || "").toLowerCase(),
    colorSet: extractColorsFromMana(front.mana || ""),
    inDeck: false, // will be set after decklists load
  };
});

function updateCount(visible, total) {
  if (!searchCount) return;
  searchCount.textContent = `${visible} / ${total}`;
}

// Tokenize query like: 't:creature c:white deck annie'
function parseQuery(q) {
  const raw = (q || "").trim();
  if (!raw) return { free: [], types: [], colorsAny: null, deckOnly: false };

  const parts = raw.split(/\s+/).filter(Boolean);

  const free = [];
  const types = [];
  let colorsAny = null; // Set; match if card has ANY of these
  let deckOnly = false;

  for (const p of parts) {
    const lower = p.toLowerCase();

    if (lower === "deck" || lower === "in:deck" || lower === "is:deck") {
      deckOnly = true;
      continue;
    }

    if (lower.startsWith("t:")) {
      const t = lower.slice(2).trim();
      if (t) types.push(t);
      continue;
    }

    if (lower.startsWith("c:")) {
      const rawC = lower.slice(2).trim();
      if (!rawC) continue;

      const chunks = rawC.split(",").map(s => s.trim()).filter(Boolean);
      const set = new Set();

      for (const ch of chunks) {
        if (/^[wubrg]+$/.test(ch)) {
          for (const letter of ch) set.add(COLOR_WORD_TO_LETTER[letter]);
        } else {
          const mapped = COLOR_WORD_TO_LETTER[ch];
          if (mapped) set.add(mapped);
        }
      }

      colorsAny = set.size ? set : colorsAny;
      continue;
    }

    free.push(lower);
  }

  return { free, types, colorsAny, deckOnly };
}

function matchesQuery(card, parsed) {
  if (parsed.deckOnly && !card.inDeck) return false;

  for (const t of parsed.types) {
    if (!card.typeLine.includes(t)) return false;
  }

  if (parsed.colorsAny && parsed.colorsAny.size) {
    let ok = false;
    for (const c of parsed.colorsAny) {
      if (card.colorSet.has(c)) { ok = true; break; }
    }
    if (!ok) return false;
  }

  for (const term of parsed.free) {
    if (!card.nameKey.includes(term)) return false;
  }

  return true;
}

function applyFilter(q) {
  const parsed = parseQuery(q);
  let visible = 0;

  for (const item of searchable) {
    const match = matchesQuery(item, parsed);
    item.container.style.display = match ? "" : "none";
    if (match) visible++;
  }

  updateCount(visible, searchable.length);
}

// Load decklists and mark inDeck
async function loadDecklistsAndMarkCards() {
  if (!DECKLIST_FILES.length) return;

  // clear previous
  deckLinksByCardKey.clear();
  for (const item of searchable) item.inDeck = false;

  const urlRegex = /https?:\/\/\S+/i;

  const deckTexts = await Promise.all(
    DECKLIST_FILES.map(async (file) => {
      try {
        const r = await fetch(`decklist/${encodeURI(file)}`, { cache: "no-store" });
        if (!r.ok) return { file, text: "" };
        return { file, text: await r.text() };
      } catch {
        return { file, text: "" };
      }
    })
  );

  for (const deck of deckTexts) {
    const raw = deck.text || "";
    const lines = raw.split(/\r?\n/);

    // Find the first URL near the top (first ~10 lines)
    let deckLink = "";
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const m = lines[i].match(urlRegex);
      if (m) { deckLink = m[0].trim(); break; }
    }

    const deckNorm = normalizeForCompare(raw);

    // Mark cards that appear in THIS decklist and attach link (if present)
    for (const item of searchable) {
      if (deckTextContainsCard(deckNorm, item.name)) {
        item.inDeck = true;

        if (deckLink) {
          const key = normalizeCardKey(item.name);
          if (!deckLinksByCardKey.has(key)) deckLinksByCardKey.set(key, new Set());
          deckLinksByCardKey.get(key).add(deckLink);
        }
      }
    }
  }
}

// init
if (searchInput) {
  updateCount(searchable.length, searchable.length);

  searchInput.addEventListener("input", (e) => {
    applyFilter(e.target.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      applyFilter("");
      searchInput.blur();
    }
  });
}

// Run deck scan, then re-apply current filter
loadDecklistsAndMarkCards().then(() => {
  applyFilter(searchInput ? searchInput.value : "");
});

cardContainers.forEach((container, idx) => {
  container.style.cursor = "pointer";
  container.addEventListener("click", () => openCardAtIndex(idx));
});

prevBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const prevIndex = (currentIndex - 1 + cardContainers.length) % cardContainers.length;
  openCardAtIndex(prevIndex);
});

nextBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const nextIndex = (currentIndex + 1) % cardContainers.length;
  openCardAtIndex(nextIndex);
});

  flipButton.addEventListener("click", function () {
    if (!hasBackImage || !currentCardEntry || !currentCardEntry.back) return;

    card3d.classList.toggle("flipped");
    currentFace = card3d.classList.contains("flipped") ? "back" : "front";
    renderFace(currentFace);
    applyColorGlowForFace(currentCardEntry[currentFace]);
  });

  closeBtn.onclick = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      document.body.classList.remove("modal-open");
    }
  };
document.addEventListener("keydown", (e) => {
  if (!document.body.classList.contains("modal-open")) return;

  // prevent page scroll on these keys
  if (["ArrowLeft", "ArrowRight", "Escape", " "].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === "ArrowLeft") {
    const prevIndex = (currentIndex - 1 + cardContainers.length) % cardContainers.length;
    openCardAtIndex(prevIndex);

  } else if (e.key === "ArrowRight") {
    const nextIndex = (currentIndex + 1) % cardContainers.length;
    openCardAtIndex(nextIndex);

  } else if (e.key === "Escape") {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");

  } else if (e.key === " " || e.code === "Space") {
    // Spacebar flips if there IS a back
    if (!hasBackImage || !currentCardEntry || !currentCardEntry.back) return;
    card3d.classList.toggle("flipped");
    currentFace = card3d.classList.contains("flipped") ? "back" : "front";
    renderFace(currentFace);
  }
});
});