const STORAGE_KEY = "xinling-island-state";
const COMPANION_API_URL = "";
const MAX_SPRITE_CHATS = 6;
const CRISIS_PATTERN = /??|??|???|????|????|????|????|??|??|??|????|??????|????/;

const defaultState = {
  soul: 20,
  energy: 6,
  badges: ["????"],
  quests: {},
  moods: [],
  bottles: ["????????????????"],
  spriteChats: [
    {
      role: "assistant",
      content: "??????????????????"
    }
  ],
  consultIntent: {
    service: "?????",
    topic: "",
    summary: ""
  },
  lastMoodRewardDate: "",
  lastBottleRewardDate: "",
  lastConsultRewardDate: "",
  lastVisitDate: "",
  visitStreak: 0,
  testsCompleted: 0,
  receivedBottles: [],
  islandLogs: [
    "???????????????",
    "???????????????",
    "????????????????????"
  ]
};

const state = loadState();
let selectedMood = { mood: "??", energy: 8 };
let selectedService = state.consultIntent?.service || "?????";
let spriteMood = "idle";

const seedBottles = [
  { islanderNo: 27, content: "??????????????????" },
  { islanderNo: 86, content: "???????????????" },
  { islanderNo: 135, content: "???????????????" },
  { islanderNo: 204, content: "????????????????????" }
];

const moodGroups = [
  { key: "??", label: "??", emoji: "??", match: /??|??|??|??|??/ },
  { key: "??", label: "??", emoji: "??", match: /??|??|??|??/ },
  { key: "??", label: "??", emoji: "??", match: /??|??|?|???/ },
  { key: "??", label: "??", emoji: "??", match: /??|?|?|??|??|??/ }
];

const mapPlaces = {
  pier: {
    title: "????",
    status: "???",
    fit: "???????????????????????",
    action: "??????????????????",
    unlock: "????????",
    href: "#mood",
    cta: "??????",
    isUnlocked: () => true
  },
  forest: {
    title: "?????",
    status: "???",
    fit: "?????????????????????",
    action: "??????3 ?????????????",
    unlock: "???????????????????",
    href: "#method",
    cta: "????",
    isUnlocked: () => state.moods.length >= 1
  },
  plaza: {
    title: "????",
    status: "???",
    fit: "?????????????????????????",
    action: "????????????????????",
    unlock: "???????????????????",
    href: "#community",
    cta: "?????",
    isUnlocked: () => true
  },
  garden: {
    title: "????",
    status: "???",
    fit: "????????????????????????",
    action: "??????????????????????",
    unlock: "??????????????????????????",
    href: "tests.html",
    cta: "????",
    isUnlocked: () => state.testsCompleted >= 1 || state.bottles.length >= 2
  },
  lighthouse: {
    title: "????",
    status: "???",
    fit: "????????????????????????",
    action: "?????????????????????",
    unlock: "???? 3 ????? 3 ???????????",
    href: "#help",
    cta: "??????",
    isUnlocked: () => state.visitStreak >= 3 || state.moods.length >= 3
  },
  temple: {
    title: "????",
    status: "???",
    fit: "??????????????????",
    action: "??????????????????????????",
    unlock: "????? 80??????????? 3 ???????????",
    href: "tests.html",
    cta: "??????",
    isUnlocked: () => state.soul >= 80 || Object.values(state.quests).filter(Boolean).length >= 3 || state.testsCompleted >= 3
  }
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState({ ...defaultState, ...(saved && typeof saved === "object" ? saved : {}) });
  } catch {
    return { ...defaultState };
  }
}

function normalizeState(nextState) {
  return {
    ...nextState,
    soul: clamp(Number(nextState.soul ?? defaultState.soul), 0, 999),
    energy: clamp(Number(nextState.energy ?? defaultState.energy), 1, 10),
    badges: Array.isArray(nextState.badges) ? nextState.badges : [...defaultState.badges],
    quests: nextState.quests && typeof nextState.quests === "object" ? nextState.quests : {},
    moods: Array.isArray(nextState.moods) ? nextState.moods : [],
    bottles: Array.isArray(nextState.bottles) ? nextState.bottles : [...defaultState.bottles],
    spriteChats: Array.isArray(nextState.spriteChats) ? nextState.spriteChats : [...defaultState.spriteChats],
    lastVisitDate: typeof nextState.lastVisitDate === "string" ? nextState.lastVisitDate : "",
    visitStreak: Math.max(0, Number(nextState.visitStreak || 0)),
    testsCompleted: Math.max(0, Number(nextState.testsCompleted || 0)),
    receivedBottles: Array.isArray(nextState.receivedBottles) ? nextState.receivedBottles : [],
    islandLogs: Array.isArray(nextState.islandLogs) ? nextState.islandLogs : [...defaultState.islandLogs],
    consultIntent:
      nextState.consultIntent && typeof nextState.consultIntent === "object"
        ? { ...defaultState.consultIntent, ...nextState.consultIntent }
        : { ...defaultState.consultIntent }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateOffsetKey(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function trackVisit() {
  const today = todayKey();
  if (state.lastVisitDate === today) return;
  state.visitStreak = state.lastVisitDate === dateOffsetKey(-1) ? Number(state.visitStreak || 0) + 1 : 1;
  state.lastVisitDate = today;
  addSoul(3);
  awardBadge("????");
  if (state.visitStreak >= 3) awardBadge("???? 3 ?");
  saveState();
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function addSoul(amount) {
  state.soul = clamp(Number(state.soul || 0) + amount, 0, 999);
}

function updateGrowth() {
  const level = Math.max(1, Math.floor(state.soul / 60) + 1);
  document.querySelector("#level-number").textContent = `Lv.${level}`;
  document.querySelector("#soul-value").textContent = state.soul;
  document.querySelector("#emotion-energy").textContent = state.energy;
  document.querySelector("#badge-count").textContent = state.badges.length;
  const badgeRow = document.querySelector("#badge-row");
  badgeRow.replaceChildren(...state.badges.map((badge) => createElement("span", "", badge)));
  updateMapLocks();
}

function awardBadge(name) {
  if (!state.badges.includes(name)) {
    state.badges.push(name);
  }
}

function renderQuests() {
  document.querySelectorAll("[data-quest]").forEach((input) => {
    input.checked = Boolean(state.quests[input.dataset.quest]);
  });
}

function renderMoodChart() {
  const chart = document.querySelector("#mood-chart");
  const recent = state.moods.slice(-7);
  if (!recent.length) {
    chart.replaceChildren(createElement("span", "", "????"));
    return;
  }
  chart.replaceChildren(
    ...recent.map((entry) => {
      const bar = createElement("div", "mood-bar");
      bar.style.height = `${clamp(Number(entry.energy || 0), 1, 10) * 10}%`;
      bar.append(createElement("span", "", entry.mood || "???"));
      return bar;
    })
  );
}

function renderMoodHistory() {
  const history = document.querySelector("#mood-history");
  if (!history) return;
  const recent = state.moods.slice(-3).reverse();
  if (!recent.length) {
    history.replaceChildren(createElement("p", "form-hint", "????????????????????????"));
    return;
  }
  const title = createElement("strong", "", "????");
  const list = createElement("div", "mood-note-list");
  recent.forEach((entry) => {
    const item = createElement("article");
    const date = entry.date ? new Date(entry.date).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) : "??";
    item.append(createElement("span", "", `${date} / ${entry.mood}`));
    item.append(createElement("p", "", entry.note || "??????????????"));
    list.append(item);
  });
  history.replaceChildren(title, list);
}

function renderBottles() {
  const list = document.querySelector("#bottle-list");
  if (!list) return;
  const items = state.bottles
    .slice(-4)
    .reverse()
    .map((item) => {
      const article = createElement("article");
      article.append(document.createTextNode(item));
      article.append(createElement("span", "", "???"));
      return article;
    });
  list.replaceChildren(...items);
}

function moodGroupFor(label = "") {
  return moodGroups.find((group) => group.match.test(label)) || moodGroups[2];
}

function localMoodStats() {
  const today = todayKey();
  const todayMoods = state.moods.filter((entry) => String(entry.date || "").startsWith(today));
  const counts = new Map(moodGroups.map((group) => [group.key, 0]));
  todayMoods.forEach((entry) => {
    const group = moodGroupFor(entry.mood);
    counts.set(group.key, (counts.get(group.key) || 0) + 1);
  });
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
  if (!total) {
    return moodGroups.map((group, index) => ({
      mood: group.label,
      emoji: group.emoji,
      count: 0,
      percent: index === 0 ? 100 : 0
    }));
  }
  return moodGroups.map((group) => ({
    mood: group.label,
    emoji: group.emoji,
    count: counts.get(group.key) || 0,
    percent: Math.round(((counts.get(group.key) || 0) / total) * 100)
  }));
}

function renderMoodPulse(remoteStats) {
  const container = document.querySelector("#mood-pulse");
  if (!container) return;
  const stats = Array.isArray(remoteStats) && remoteStats.length
    ? remoteStats.map((entry) => {
        const group = moodGroupFor(entry.mood);
        return { mood: group.label, emoji: group.emoji, count: entry.count || 0, percent: entry.percent || 0 };
      })
    : localMoodStats();
  const title = createElement("strong", "", "??????");
  const rows = stats.map((entry) => {
    const row = createElement("article", "mood-pulse-row");
    row.append(createElement("span", "", `${entry.emoji} ${entry.mood}`));
    const track = createElement("div", "mood-pulse-track");
    const fill = createElement("i");
    fill.style.width = `${clamp(entry.percent, 3, 100)}%`;
    track.append(fill);
    row.append(track, createElement("b", "", `${entry.percent}%`));
    return row;
  });
  container.replaceChildren(title, ...rows);
}

function renderIslandStats(remote) {
  const stats = remote?.stats || {
    islanders: 128 + state.badges.length + Number(state.visitStreak || 0),
    bottles: state.bottles.length + state.receivedBottles.length,
    todayMoods: state.moods.filter((entry) => String(entry.date || "").startsWith(todayKey())).length,
    consultRequests: state.consultIntent?.summary ? 1 : 0
  };
  const source = remote?.source === "cloud" ? "??????" : "??????";
  const fields = [
    ["#stat-islanders", stats.islanders],
    ["#stat-bottles", stats.bottles],
    ["#stat-moods", stats.todayMoods],
    ["#stat-requests", stats.consultRequests]
  ];
  fields.forEach(([selector, value]) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = Number(value || 0).toLocaleString("zh-CN");
  });
  const sourceNode = document.querySelector("#stats-source");
  if (sourceNode) sourceNode.textContent = source;
}

function renderIslandLogs(remoteLogs) {
  const container = document.querySelector("#island-logs");
  if (!container) return;
  const local = state.islandLogs.map((content, index) => ({ islander_no: 135 + index, content }));
  const logs = Array.isArray(remoteLogs) && remoteLogs.length ? remoteLogs : local;
  const title = createElement("strong", "", "????");
  const items = logs.slice(0, 4).map((log, index) => {
    const item = createElement("article");
    const no = log.islander_no || log.islanderNo || 100 + index;
    item.append(createElement("span", "", `? ${no} ???????`));
    item.append(createElement("p", "", log.content || "???????????"));
    return item;
  });
  container.replaceChildren(title, ...items);
}

function setCommunityStatus(text, tone = "normal") {
  const status = document.querySelector("#community-status");
  if (!status) return;
  status.textContent = text;
  status.dataset.tone = tone;
}

function showReceivedBottle(bottle) {
  const panel = document.querySelector("#received-bottle");
  if (!panel) return;
  const no = bottle?.islander_no || bottle?.islanderNo || Math.floor(20 + Math.random() * 260);
  panel.replaceChildren(
    createElement("span", "", `????? ${no} ????????`),
    createElement("p", "", bottle?.content || "??????????????")
  );
}

async function receiveBottle() {
  let bottle = null;
  if (window.XinlingBackend?.isConfigured()) {
    try {
      const data = await XinlingBackend.getRandomBottle();
      bottle = data?.bottle;
    } catch (_error) {
      bottle = null;
    }
  }
  if (!bottle) {
    const local = [
      ...state.bottles.map((content, index) => ({ islanderNo: 300 + index, content })),
      ...seedBottles
    ];
    bottle = local[Math.floor(Math.random() * local.length)];
  }
  showReceivedBottle(bottle);
  state.receivedBottles.push({ content: bottle.content, date: new Date().toISOString() });
  state.receivedBottles = state.receivedBottles.slice(-12);
  awardBadge("?????");
  addSoul(4);
  saveState();
  updateGrowth();
  renderIslandStats();
}

async function loadCommunityData() {
  renderIslandStats();
  renderMoodPulse();
  renderIslandLogs();
  if (!window.XinlingBackend?.isConfigured()) return;
  try {
    const [statsData, logsData] = await Promise.all([
      XinlingBackend.getStats(),
      XinlingBackend.listIslandLogs()
    ]);
    renderIslandStats(statsData);
    renderMoodPulse(statsData?.moodStats);
    renderIslandLogs(logsData?.logs);
  } catch (_error) {
    renderIslandStats();
    renderMoodPulse();
    renderIslandLogs();
  }
}

function fallbackSpriteReply(text) {
  if (CRISIS_PATTERN.test(text)) {
    return "????????????????????????????????????????????????????????????";
  }
  if (/?|??|?|?|?|?/.test(text)) return "?????????????????????????????????";
  if (/??|??|??|?|??/.test(text)) return "????????????????????????????????????";
  if (/??|??|?|??|??/.test(text)) return "?????????????????????????????";
  if (/???|??|??/.test(text)) return "?????????????????????????????????????";
  return "???????????????????????????????????????????????";
}

function trimSpriteChats() {
  state.spriteChats = (state.spriteChats || []).slice(-MAX_SPRITE_CHATS);
}

function appendSpriteChat(role, content) {
  state.spriteChats = state.spriteChats || [];
  state.spriteChats.push({ role, content: content.slice(0, role === "user" ? 500 : 360) });
  trimSpriteChats();
  saveState();
  renderSpriteChats();
}

function renderSpriteChats() {
  const log = document.querySelector("#sprite-log");
  const reply = document.querySelector("#sprite-reply");
  if (!log || !reply) return;
  const chats = state.spriteChats?.length ? state.spriteChats : defaultState.spriteChats;
  reply.textContent = chats.filter((item) => item.role === "assistant").at(-1)?.content || "??????????????????";
  log.replaceChildren(
    ...chats.slice(-MAX_SPRITE_CHATS).map((item) => {
      const bubble = createElement("article", `sprite-message ${item.role === "user" ? "user" : "assistant"}`);
      bubble.append(createElement("span", "", item.role === "user" ? "?" : "????"));
      bubble.append(createElement("p", "", item.content));
      return bubble;
    })
  );
  log.scrollTop = log.scrollHeight;
}

function setSpriteStatus(message, mood = "idle") {
  const status = document.querySelector("#sprite-status");
  if (status) status.textContent = message;
  spriteMood = mood;
}

async function syncSpriteChat(role, content) {
  if (!window.XinlingBackend?.isConfigured()) return;
  try {
    await XinlingBackend.saveSpriteChat({ role, content });
  } catch (_error) {
    // Local fallback stays authoritative when backend is unavailable.
  }
}

async function askCompanionAI(message) {
  const apiUrl = window.XINLING_BACKEND_CONFIG?.apiBaseUrl
    ? `${window.XINLING_BACKEND_CONFIG.apiBaseUrl}/api/companion`
    : COMPANION_API_URL;
  if (!apiUrl) {
    throw new Error("Companion API URL is not configured.");
  }
  const history = (state.spriteChats || [])
    .slice(-MAX_SPRITE_CHATS)
    .map((item) => ({ role: item.role, content: item.content }));
  const session = await window.XinlingBackend?.getSession?.();
  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, history })
  });
  if (!response.ok) throw new Error(`Companion API failed: ${response.status}`);
  const data = await response.json();
  if (!data?.reply) throw new Error("Companion API returned an empty reply.");
  return data;
}

async function sendSpriteMessage() {
  const input = document.querySelector("#sprite-input");
  const button = document.querySelector("#send-sprite");
  const text = input.value.trim().slice(0, 500);
  if (!text) return;
  input.value = "";
  appendSpriteChat("user", text);
  syncSpriteChat("user", text);
  if (CRISIS_PATTERN.test(text)) {
    const reply = fallbackSpriteReply(text);
    appendSpriteChat("assistant", reply);
    syncSpriteChat("assistant", reply);
    setSpriteStatus("??????????????????????? AI?", "alert");
    return;
  }
  button.disabled = true;
  setSpriteStatus("????????...", "thinking");
  try {
    const data = await askCompanionAI(text);
    appendSpriteChat("assistant", data.reply);
    setSpriteStatus(data.safety === "crisis" ? "AI ??????????????????" : "AI ??????", data.safety === "crisis" ? "alert" : "glow");
  } catch (_error) {
    const reply = fallbackSpriteReply(text);
    appendSpriteChat("assistant", reply);
    syncSpriteChat("assistant", reply);
    setSpriteStatus("AI Worker ???????????????", "fallback");
  } finally {
    button.disabled = false;
  }
}

function renderBookingState() {
  const topic = document.querySelector("#booking-topic");
  const summary = document.querySelector("#booking-summary");
  if (!topic || !summary) return;
  topic.value = state.consultIntent.topic || "";
  summary.textContent = state.consultIntent.summary || "?????????????????????????????????";
  document.querySelectorAll(".booking-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.service === selectedService);
  });
}

function insightForMoods() {
  const recent = state.moods.slice(-3);
  if (!recent.length) return "??????????????????";
  const average = recent.reduce((sum, item) => sum + item.energy, 0) / recent.length;
  if (average >= 7) return "??????????????????????????????";
  if (average >= 4) return "?????????????????????????????????";
  return "??????????????????????????????";
}

function initSpriteScene() {
  const canvas = document.querySelector("#sprite-canvas");
  const stage = document.querySelector("#sprite-stage");
  if (!canvas || !stage || !window.THREE) {
    stage?.classList.add("no-webgl");
    return;
  }
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.7, 7);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 40, 40),
      new THREE.MeshStandardMaterial({
        color: 0xbfffe5,
        emissive: 0x5cffcf,
        emissiveIntensity: 1.25,
        roughness: 0.34,
        metalness: 0.02
      })
    );
    scene.add(core);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 40, 40),
      new THREE.MeshBasicMaterial({ color: 0xd9fff2, transparent: true, opacity: 0.18 })
    );
    scene.add(halo);

    const wingMaterial = new THREE.MeshBasicMaterial({ color: 0xf9fff8, transparent: true, opacity: 0.44, side: THREE.DoubleSide });
    const wingGeometry = new THREE.CircleGeometry(0.55, 32);
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial.clone());
    leftWing.position.set(-0.68, 0.12, -0.08);
    rightWing.position.set(0.68, 0.12, -0.08);
    leftWing.scale.set(0.8, 1.18, 1);
    rightWing.scale.set(0.8, 1.18, 1);
    scene.add(leftWing, rightWing);

    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x102d3a });
    const eyeGeometry = new THREE.SphereGeometry(0.055, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.18, 0.18, 0.68);
    rightEye.position.set(0.18, 0.18, 0.68);
    scene.add(leftEye, rightEye);

    const particleCount = window.innerWidth < 720 ? 34 : 62;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 5;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 3.2;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0xf7ffc2, size: 0.06, transparent: true, opacity: 0.72 })
    );
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const light = new THREE.PointLight(0x8fffe4, 2.4, 12);
    light.position.set(0, 1.2, 3);
    scene.add(light);

    function resize() {
      const rect = stage.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    resize();

    function animate(time) {
      const t = time * 0.001;
      const pulse = spriteMood === "thinking" ? 1.2 : spriteMood === "alert" ? 0.72 : spriteMood === "glow" ? 1.45 : 1;
      core.position.y = Math.sin(t * 1.7) * 0.12;
      core.scale.setScalar(1 + Math.sin(t * 2.8) * 0.035 * pulse);
      halo.scale.setScalar(1.04 + Math.sin(t * 2.2) * 0.08 * pulse);
      halo.material.opacity = spriteMood === "alert" ? 0.26 : 0.16 + Math.sin(t * 3) * 0.035 * pulse;
      leftWing.rotation.y = -0.85 + Math.sin(t * 8) * 0.34;
      rightWing.rotation.y = 0.85 - Math.sin(t * 8) * 0.34;
      particles.rotation.y = t * 0.08;
      particles.rotation.x = Math.sin(t * 0.4) * 0.08;
      const blink = Math.sin(t * 3.7) > 0.985 ? 0.18 : 1;
      leftEye.scale.y = blink;
      rightEye.scale.y = blink;
      core.material.emissiveIntensity = spriteMood === "thinking" ? 1.8 : spriteMood === "alert" ? 0.95 : spriteMood === "glow" ? 2.2 : 1.25;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  } catch (_error) {
    stage.classList.add("no-webgl");
  }
}

function updateMapLocks() {
  document.querySelectorAll("[data-place]").forEach((button) => {
    const place = mapPlaces[button.dataset.place];
    if (!place) return;
    const unlocked = place.isUnlocked();
    button.classList.toggle("locked", !unlocked);
    button.classList.toggle("lit", unlocked);
    button.setAttribute("aria-label", `${place.title}?${unlocked ? "???" : "?????"}?????????`);
  });
}

function showMapPlace(placeId) {
  const place = mapPlaces[placeId] || mapPlaces.pier;
  const unlocked = place.isUnlocked();
  document.querySelectorAll("[data-place]").forEach((button) => {
    button.classList.toggle("active", button.dataset.place === placeId);
  });
  document.querySelector("#map-detail-status").textContent = unlocked ? place.status : "?????";
  document.querySelector("#map-detail-title").textContent = place.title;
  document.querySelector("#map-detail-fit").textContent = place.fit;
  document.querySelector("#map-detail-action").textContent = place.action;
  document.querySelector("#map-detail-unlock").textContent = unlocked ? "?????????????????????" : place.unlock;
  const link = document.querySelector("#map-detail-link");
  link.textContent = place.cta;
  link.href = place.href;
  link.classList.toggle("disabled-link", !unlocked);
  link.setAttribute("aria-disabled", String(!unlocked));
  if (placeId === "garden" && unlocked) {
    awardBadge("??????");
    saveState();
    updateGrowth();
  }
}

function updateMapWeather() {
  const board = document.querySelector("#map-board");
  const hint = document.querySelector("#weather-hint");
  if (!board) return;
  const hour = new Date().getHours();
  const daySeed = Number(todayKey().replaceAll("-", ""));
  const isRain = daySeed % 7 === 0;
  const mode = isRain ? "rain" : hour >= 6 && hour < 18 ? "day" : hour >= 18 && hour < 23 ? "stars" : "night";
  board.classList.remove("weather-day", "weather-night", "weather-rain", "weather-stars");
  board.classList.add(`weather-${mode}`);
  const copy = {
    day: "??????????????????????",
    rain: "??????????????????????",
    stars: "????????????????????",
    night: "?????????????????????"
  };
  if (hint) hint.textContent = copy[mode];
}

document.querySelectorAll("[data-quest]").forEach((input) => {
  input.addEventListener("change", () => {
    state.quests[input.dataset.quest] = input.checked;
    addSoul(input.checked ? 10 : -10);
    if (Object.values(state.quests).filter(Boolean).length >= 3) awardBadge("??????");
    saveState();
    updateGrowth();
  });
});

document.querySelectorAll(".mood-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mood-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedMood = { mood: button.dataset.mood, energy: Number(button.dataset.energy) };
  });
});

document.querySelector("#save-mood").addEventListener("click", () => {
  const note = document.querySelector("#mood-note");
  const text = note.value.trim();
  const insight = document.querySelector("#ai-insight");
  if (!text) {
    insight.textContent = "????????????????????????????????????";
    note.focus();
    return;
  }
  state.moods.push({
    mood: selectedMood.mood,
    energy: selectedMood.energy,
    note: text.slice(0, 260),
    date: new Date().toISOString()
  });
  window.XinlingBackend?.saveMood?.({
    mood: selectedMood.mood,
    energy: selectedMood.energy,
    note: text.slice(0, 260)
  }).catch(() => {});
  state.energy = selectedMood.energy;
  const today = todayKey();
  if (state.lastMoodRewardDate !== today) {
    addSoul(15);
    state.lastMoodRewardDate = today;
  }
  awardBadge("?????");
  if (state.moods.length >= 3) awardBadge("????");
  note.value = "";
  saveState();
  updateGrowth();
  renderMoodChart();
  renderMoodHistory();
  renderMoodPulse();
  renderIslandStats();
  insight.textContent = insightForMoods();
});

document.querySelector("#send-sprite").addEventListener("click", sendSpriteMessage);
document.querySelector("#sprite-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendSpriteMessage();
  }
});

document.querySelector("#send-bottle").addEventListener("click", async () => {
  const input = document.querySelector("#bottle-text");
  const text = input.value.trim();
  if (!text) return;
  if (CRISIS_PATTERN.test(text)) {
    setCommunityStatus("??????????????????????????????????????????????????????", "alert");
    input.focus();
    return;
  }
  state.bottles.push(text.slice(0, 180));
  state.islandLogs.unshift(text.slice(0, 180));
  state.islandLogs = state.islandLogs.slice(0, 8);
  const today = todayKey();
  if (state.lastBottleRewardDate !== today) {
    addSoul(8);
    state.lastBottleRewardDate = today;
  }
  awardBadge("?????");
  input.value = "";
  saveState();
  updateGrowth();
  renderBottles();
  renderIslandStats();
  renderIslandLogs();
  setCommunityStatus("????????????", "normal");
  if (window.XinlingBackend?.isConfigured()) {
    try {
      const data = await XinlingBackend.sendBottle({ content: text.slice(0, 180), mood: selectedMood.mood });
      if (data?.safety === "crisis") {
        setCommunityStatus(data.reply || "??????????????", "alert");
      } else {
        setCommunityStatus("??????????????", "normal");
        loadCommunityData();
      }
    } catch (_error) {
      setCommunityStatus("???????????????????", "soft");
    }
  }
});

document.querySelector("#receive-bottle")?.addEventListener("click", receiveBottle);

document.querySelectorAll(".booking-option").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".booking-option").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedService = button.dataset.service;
  });
});

document.querySelector("#create-booking-summary").addEventListener("click", () => {
  const topicInput = document.querySelector("#booking-topic");
  const summary = document.querySelector("#booking-summary");
  const topic = topicInput.value.trim();
  if (!topic) {
    summary.textContent = "????????????????????????????????";
    topicInput.focus();
    return;
  }
  const recentMood = state.moods.at(-1);
  const cleanTopic = topic.slice(0, 180).replace(/[???!?.,??\s]+$/g, "");
  const moodText = recentMood ? `?????????${recentMood.mood}??? ${recentMood.energy}/10?` : "???????";
  const bookingText = `?????${selectedService}??????${cleanTopic}?${moodText} ?????????????????????`;
  state.consultIntent = {
    service: selectedService,
    topic: cleanTopic,
    summary: bookingText,
    date: new Date().toISOString()
  };
  window.XinlingBackend?.createConsultRequest?.({
    serviceType: selectedService,
    topic: cleanTopic,
    summary: bookingText,
    source: "homepage"
  }).catch(() => {});
  awardBadge("??????");
  const today = todayKey();
  if (state.lastConsultRewardDate !== today) {
    addSoul(6);
    state.lastConsultRewardDate = today;
  }
  saveState();
  updateGrowth();
  summary.textContent = `${bookingText} ??????????????????`;
  navigator.clipboard?.writeText(bookingText).catch(() => {});
});

document.querySelectorAll("[data-place]").forEach((button) => {
  button.addEventListener("click", () => showMapPlace(button.dataset.place));
});

trackVisit();
renderQuests();
updateGrowth();
renderMoodChart();
renderMoodHistory();
renderBottles();
renderBookingState();
renderSpriteChats();
document.querySelector("#ai-insight").textContent = insightForMoods();
updateMapLocks();
updateMapWeather();
loadCommunityData();
showMapPlace("pier");
initSpriteScene();
