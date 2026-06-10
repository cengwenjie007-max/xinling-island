const STORAGE_KEY = "xinling-island-state";
const COMPANION_API_URL = "";
const MAX_SPRITE_CHATS = 6;
const CRISIS_PATTERN = /自杀|想死|不想活|活不下去|伤害自己|伤害别人|结束生命|轻生|割腕|跳楼|没必要活|无法保证安全|撑不下去/;

const defaultState = {
  soul: 20,
  energy: 6,
  badges: ["初次登岛"],
  quests: {},
  moods: [],
  bottles: ["今天也许不完美，但我已经在靠岸。"],
  spriteChats: [
    {
      role: "assistant",
      content: "欢迎来到心灵岛，先坐下来休息一下吧。"
    }
  ],
  consultIntent: {
    service: "倾听员陪伴",
    topic: "",
    summary: ""
  },
  lastMoodRewardDate: "",
  lastBottleRewardDate: "",
  lastConsultRewardDate: ""
};

const state = loadState();
let selectedMood = { mood: "开心", energy: 8 };
let selectedService = state.consultIntent?.service || "倾听员陪伴";
let spriteMood = "idle";

const mapPlaces = {
  pier: {
    title: "海边码头",
    status: "已点亮",
    fit: "适合：第一次登岛、状态有点乱、想先做一件小事。",
    action: "我能做什么：新手引导、今日心情打卡。",
    unlock: "入口区域已开放。",
    href: "#mood",
    cta: "记录今日心情",
    isUnlocked: () => true
  },
  forest: {
    title: "森林疗愈区",
    status: "已点亮",
    fit: "适合：焦虑、疲惫、睡前、需要慢慢安静下来。",
    action: "我能做什么：3 分钟呼吸、正念、身体扫描。",
    unlock: "完成一次情绪记录后，森林会变得更明亮。",
    href: "#method",
    cta: "进入练习",
    isUnlocked: () => state.moods.length >= 1
  },
  plaza: {
    title: "星光广场",
    status: "已点亮",
    fit: "适合：想被听见、想轻轻回应别人、想留下匿名一句话。",
    action: "我能做什么：漂流瓶、同频留言、温柔回应。",
    unlock: "投递一只漂流瓶后，广场会记录你的星光。",
    href: "#community",
    cta: "投递漂流瓶",
    isUnlocked: () => true
  },
  garden: {
    title: "梦境花园",
    status: "半开放",
    fit: "适合：潜意识书写、梦境记录、整理反复出现的念头。",
    action: "我能做什么：进入心理测试，完成一次深度自评。",
    unlock: "完成一次心理测试后，可把结果写入情绪记录。",
    href: "tests.html",
    cta: "进入测试",
    isUnlocked: () => true
  },
  lighthouse: {
    title: "回忆灯塔",
    status: "待点亮",
    fit: "适合：回顾最近状态、整理成长档案、准备真实求助。",
    action: "我能做什么：情绪回顾、成长档案、求助准备。",
    unlock: "完成 3 次情绪记录后点亮灯塔。",
    href: "#help",
    cta: "查看求助灯塔",
    isUnlocked: () => state.moods.length >= 3
  },
  temple: {
    title: "心灵神殿",
    status: "待点亮",
    fit: "适合：心理测试、咨询准备、深度探索。",
    action: "我能做什么：心理测试、咨询预约准备、与岛上精灵对话。",
    unlock: "心灵值达到 80 或完成新手任务后点亮神殿。",
    href: "tests.html",
    cta: "进入深度探索",
    isUnlocked: () => state.soul >= 80 || Object.values(state.quests).filter(Boolean).length >= 3
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
    chart.replaceChildren(createElement("span", "", "暂无记录"));
    return;
  }
  chart.replaceChildren(
    ...recent.map((entry) => {
      const bar = createElement("div", "mood-bar");
      bar.style.height = `${clamp(Number(entry.energy || 0), 1, 10) * 10}%`;
      bar.append(createElement("span", "", entry.mood || "未命名"));
      return bar;
    })
  );
}

function renderMoodHistory() {
  const history = document.querySelector("#mood-history");
  if (!history) return;
  const recent = state.moods.slice(-3).reverse();
  if (!recent.length) {
    history.replaceChildren(createElement("p", "form-hint", "最近记录会显示在这里，方便你看见自己的情绪节律。"));
    return;
  }
  const title = createElement("strong", "", "最近记录");
  const list = createElement("div", "mood-note-list");
  recent.forEach((entry) => {
    const item = createElement("article");
    const date = entry.date ? new Date(entry.date).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) : "今天";
    item.append(createElement("span", "", `${date} / ${entry.mood}`));
    item.append(createElement("p", "", entry.note || "这一天只留下了一个情绪标记。"));
    list.append(item);
  });
  history.replaceChildren(title, list);
}

function renderBottles() {
  const list = document.querySelector("#bottle-list");
  const items = state.bottles
    .slice(-4)
    .reverse()
    .map((item) => {
      const article = createElement("article");
      article.append(document.createTextNode(item));
      article.append(createElement("span", "", "抱抱你"));
      return article;
    });
  list.replaceChildren(...items);
}

function fallbackSpriteReply(text) {
  if (CRISIS_PATTERN.test(text)) {
    return "我很在意你现在的安全。请立刻联系身边可信任的人、当地紧急电话或医院急诊；如果可以，请现在走到有人在的地方，不要独自承受。";
  }
  if (/累|疲惫|困|撑|倦|耗/.test(text)) return "今天辛苦了。先允许自己停靠十分钟，岛上的风会陪你把肩膀慢慢放下来。";
  if (/焦虑|害怕|紧张|慌|担心/.test(text)) return "焦虑像涨潮，它会来，也会退。先说出你最担心的一件小事，我们只处理这一件。";
  if (/难过|失恋|哭|委屈|孤独/.test(text)) return "我会在这里陪你。难过不是退步，它说明这件事真的触碰到了你。";
  if (/睡不着|失眠|噩梦/.test(text)) return "睡不着的时候，先不和自己对抗。试试把手机放远一点，慢慢呼气，比吸气长一点。";
  return "我听见了。先把呼吸放慢一点，我们不用马上解决所有事。你愿意再告诉我一点点，最压着你的是什么吗？";
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
  reply.textContent = chats.filter((item) => item.role === "assistant").at(-1)?.content || "欢迎来到心灵岛，先坐下来休息一下吧。";
  log.replaceChildren(
    ...chats.slice(-MAX_SPRITE_CHATS).map((item) => {
      const bubble = createElement("article", `sprite-message ${item.role === "user" ? "user" : "assistant"}`);
      bubble.append(createElement("span", "", item.role === "user" ? "你" : "萤火精灵"));
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

async function askCompanionAI(message) {
  if (!COMPANION_API_URL) {
    throw new Error("Companion API URL is not configured.");
  }
  const history = (state.spriteChats || [])
    .slice(-MAX_SPRITE_CHATS)
    .map((item) => ({ role: item.role, content: item.content }));
  const response = await fetch(COMPANION_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  if (CRISIS_PATTERN.test(text)) {
    appendSpriteChat("assistant", fallbackSpriteReply(text));
    setSpriteStatus("检测到安全风险：已优先显示现实求助提示，未调用 AI。", "alert");
    return;
  }
  button.disabled = true;
  setSpriteStatus("萤火精灵正在倾听...", "thinking");
  try {
    const data = await askCompanionAI(text);
    appendSpriteChat("assistant", data.reply);
    setSpriteStatus(data.safety === "crisis" ? "AI 返回了安全提示，请优先联系现实支持。" : "AI 陪伴已回应。", data.safety === "crisis" ? "alert" : "glow");
  } catch (_error) {
    appendSpriteChat("assistant", fallbackSpriteReply(text));
    setSpriteStatus("AI Worker 暂未连接，已使用本地温柔回应。", "fallback");
  } finally {
    button.disabled = false;
  }
}

function renderBookingState() {
  const topic = document.querySelector("#booking-topic");
  const summary = document.querySelector("#booking-summary");
  if (!topic || !summary) return;
  topic.value = state.consultIntent.topic || "";
  summary.textContent = state.consultIntent.summary || "选择服务并写下主题后，这里会生成一份可复制给倾听员或咨询师的摘要。";
  document.querySelectorAll(".booking-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.service === selectedService);
  });
}

function insightForMoods() {
  const recent = state.moods.slice(-3);
  if (!recent.length) return "保存后，这里会出现你的情绪趋势分析。";
  const average = recent.reduce((sum, item) => sum + item.energy, 0) / recent.length;
  if (average >= 7) return "最近的情绪能量偏明亮，可以趁状态好时保存一些让你恢复的习惯。";
  if (average >= 4) return "最近情绪有起伏，建议给自己安排一个低门槛休息动作，比如散步或早睡。";
  return "最近能量偏低，请先照顾睡眠、饮食和安全感，不要独自硬撑太久。";
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
    button.setAttribute("aria-label", `${place.title}，${unlocked ? "已点亮" : "未完全点亮"}，点击查看功能卡片`);
  });
}

function showMapPlace(placeId) {
  const place = mapPlaces[placeId] || mapPlaces.pier;
  const unlocked = place.isUnlocked();
  document.querySelectorAll("[data-place]").forEach((button) => {
    button.classList.toggle("active", button.dataset.place === placeId);
  });
  document.querySelector("#map-detail-status").textContent = unlocked ? place.status : "未完全点亮";
  document.querySelector("#map-detail-title").textContent = place.title;
  document.querySelector("#map-detail-fit").textContent = place.fit;
  document.querySelector("#map-detail-action").textContent = place.action;
  document.querySelector("#map-detail-unlock").textContent = unlocked ? "当前可以进入。继续使用会让这片区域更明亮。" : place.unlock;
  const link = document.querySelector("#map-detail-link");
  link.textContent = place.cta;
  link.href = place.href;
  link.classList.toggle("disabled-link", !unlocked);
  link.setAttribute("aria-disabled", String(!unlocked));
}

document.querySelectorAll("[data-quest]").forEach((input) => {
  input.addEventListener("change", () => {
    state.quests[input.dataset.quest] = input.checked;
    addSoul(input.checked ? 10 : -10);
    if (Object.values(state.quests).filter(Boolean).length >= 3) awardBadge("完成新手任务");
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
    insight.textContent = "可以只写一句很短的话，比如“今天有点累”。给情绪一个名字，也是一种靠岸。";
    note.focus();
    return;
  }
  state.moods.push({
    mood: selectedMood.mood,
    energy: selectedMood.energy,
    note: text.slice(0, 260),
    date: new Date().toISOString()
  });
  state.energy = selectedMood.energy;
  const today = todayKey();
  if (state.lastMoodRewardDate !== today) {
    addSoul(15);
    state.lastMoodRewardDate = today;
  }
  awardBadge("情绪记录者");
  if (state.moods.length >= 3) awardBadge("连续靠岸");
  note.value = "";
  saveState();
  updateGrowth();
  renderMoodChart();
  renderMoodHistory();
  insight.textContent = insightForMoods();
});

document.querySelector("#send-sprite").addEventListener("click", sendSpriteMessage);
document.querySelector("#sprite-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendSpriteMessage();
  }
});

document.querySelector("#send-bottle").addEventListener("click", () => {
  const input = document.querySelector("#bottle-text");
  const text = input.value.trim();
  if (!text) return;
  state.bottles.push(text.slice(0, 180));
  const today = todayKey();
  if (state.lastBottleRewardDate !== today) {
    addSoul(8);
    state.lastBottleRewardDate = today;
  }
  awardBadge("星光漂流瓶");
  input.value = "";
  saveState();
  updateGrowth();
  renderBottles();
});

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
    summary.textContent = "可以先写一句最想被理解的事，例如：最近失眠、关系压力、工作很累。";
    topicInput.focus();
    return;
  }
  const recentMood = state.moods.at(-1);
  const cleanTopic = topic.slice(0, 180).replace(/[。！？!?.,，、\s]+$/g, "");
  const moodText = recentMood ? `最近一次情绪记录：${recentMood.mood}，能量 ${recentMood.energy}/10。` : "暂未记录情绪。";
  const bookingText = `我想预约：${selectedService}。当前主题：${cleanTopic}。${moodText} 希望先获得稳定倾听、状态梳理和下一步建议。`;
  state.consultIntent = {
    service: selectedService,
    topic: cleanTopic,
    summary: bookingText,
    date: new Date().toISOString()
  };
  awardBadge("点亮求助灯塔");
  const today = todayKey();
  if (state.lastConsultRewardDate !== today) {
    addSoul(6);
    state.lastConsultRewardDate = today;
  }
  saveState();
  updateGrowth();
  summary.textContent = `${bookingText} 摘要已生成，可复制给倾听员或咨询师。`;
  navigator.clipboard?.writeText(bookingText).catch(() => {});
});

document.querySelectorAll("[data-place]").forEach((button) => {
  button.addEventListener("click", () => showMapPlace(button.dataset.place));
});

renderQuests();
updateGrowth();
renderMoodChart();
renderMoodHistory();
renderBottles();
renderBookingState();
renderSpriteChats();
document.querySelector("#ai-insight").textContent = insightForMoods();
updateMapLocks();
showMapPlace("pier");
initSpriteScene();
