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
  lastConsultRewardDate: "",
  lastVisitDate: "",
  visitStreak: 0,
  testsCompleted: 0,
  receivedBottles: [],
  moodWallPosts: [],
  lastMoodWallRewardDate: "",
  islanderRole: "",
  ritualMood: null,
  firstCabinLit: false,
  lastRitualMoodDate: "",
  treeholeNotes: [],
  lastTreeholeRewardDate: "",
  soundEnabled: false,
  islandLogs: [
    "愿所有焦虑的人都能被温柔对待。",
    "今天只是靠岸休息，也已经很好。",
    "如果你也在夜里醒着，希望海风替我抱抱你。"
  ]
};

const state = loadState();
let selectedMood = { mood: "开心", energy: 8 };
let selectedService = state.consultIntent?.service || "倾听员陪伴";
let spriteMood = "idle";
let oceanAudio = null;
let oceanSoundOn = false;
let oceanUnlockBound = false;
let seagullTimer = null;

const seedBottles = [
  { islanderNo: 27, content: "今天很难，但我愿意再给自己一点时间。" },
  { islanderNo: 86, content: "愿你今晚能睡一个没有自责的觉。" },
  { islanderNo: 135, content: "愿所有焦虑的人都能被温柔对待。" },
  { islanderNo: 204, content: "如果暂时看不见路，就先看见脚下这一小步。" }
];

const seedMoodWallPosts = [
  { islander_no: 42, mood: "平静", content: "今天没有变得很厉害，但我终于愿意慢一点了。", created_at: new Date().toISOString() },
  { islander_no: 118, mood: "难过", content: "把难过说出来以后，好像海风也轻了一点。", created_at: new Date().toISOString() },
  { islander_no: 207, mood: "开心", content: "今天收到一句温柔的话，想把它也留在岛上。", created_at: new Date().toISOString() }
];

const moodGroups = [
  { key: "开心", label: "开心", emoji: "😊", match: /开心|平静|愉快|满足|轻松/ },
  { key: "难过", label: "难过", emoji: "😔", match: /难过|低落|伤心|委屈/ },
  { key: "迷茫", label: "迷茫", emoji: "🌫", match: /迷茫|困惑|空|不知道/ },
  { key: "疲惫", label: "疲惫", emoji: "😴", match: /疲惫|累|困|失眠|焦虑|紧张/ }
];

const goodnightMessages = [
  "你已经抵达这里了。先把今天交给海风，剩下的明天再慢慢整理。",
  "今晚不需要证明自己。能安静待一会儿，也是一种恢复。",
  "如果今天很重，就先只做一件事：把肩膀放低，慢慢呼气。",
  "你不必把所有问题都在今晚想明白。灯塔会亮着，路可以明天再走。",
  "愿你睡前少一点自责，多一点被温柔接住的感觉。"
];

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
    unlock: "投递漂流瓶或完成一次心理测试后，梦境花园会正式开放。",
    href: "tests.html",
    cta: "进入测试",
    isUnlocked: () => state.testsCompleted >= 1 || state.bottles.length >= 2
  },
  lighthouse: {
    title: "回忆灯塔",
    status: "待点亮",
    fit: "适合：回顾最近状态、整理成长档案、准备真实求助。",
    action: "我能做什么：情绪回顾、成长档案、求助准备。",
    unlock: "连续登岛 3 天，或完成 3 次情绪记录后点亮灯塔。",
    href: "#help",
    cta: "查看求助灯塔",
    isUnlocked: () => state.visitStreak >= 3 || state.moods.length >= 3
  },
  temple: {
    title: "心灵神殿",
    status: "待点亮",
    fit: "适合：心理测试、咨询准备、深度探索。",
    action: "我能做什么：心理测试、咨询预约准备、与岛上精灵对话。",
    unlock: "心灵值达到 80、完成靠岸仪式，或完成 3 次标准量表后点亮神殿。",
    href: "tests.html",
    cta: "进入深度探索",
    isUnlocked: () => state.soul >= 80 || state.firstCabinLit || Object.values(state.quests).filter(Boolean).length >= 3 || state.testsCompleted >= 3
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
    moodWallPosts: Array.isArray(nextState.moodWallPosts) ? nextState.moodWallPosts : [],
    lastMoodWallRewardDate: typeof nextState.lastMoodWallRewardDate === "string" ? nextState.lastMoodWallRewardDate : "",
    islanderRole: typeof nextState.islanderRole === "string" ? nextState.islanderRole : (nextState.quests?.avatar ? "海风旅人" : ""),
    ritualMood:
      nextState.ritualMood && typeof nextState.ritualMood === "object"
        ? nextState.ritualMood
        : nextState.quests?.mood
          ? { mood: "平静", energy: 6, date: "" }
          : null,
    firstCabinLit: Boolean(nextState.firstCabinLit || nextState.quests?.cabin),
    lastRitualMoodDate: typeof nextState.lastRitualMoodDate === "string" ? nextState.lastRitualMoodDate : "",
    treeholeNotes: Array.isArray(nextState.treeholeNotes) ? nextState.treeholeNotes : [],
    lastTreeholeRewardDate: typeof nextState.lastTreeholeRewardDate === "string" ? nextState.lastTreeholeRewardDate : "",
    soundEnabled: Boolean(nextState.soundEnabled),
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
  awardBadge("再次靠岸");
  if (state.visitStreak >= 3) awardBadge("连续访问 3 天");
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

function getGrowthVoyage() {
  const today = todayKey();
  const hasMoodToday = state.moods.some((entry) => String(entry.date || "").startsWith(today));
  const hasBottleAction = state.bottles.length > 1 || state.receivedBottles.length > 0;
  const hasStandardTest = Number(state.testsCompleted || 0) > 0;
  const steps = [
    Boolean(state.islanderRole),
    Boolean(state.ritualMood),
    Boolean(state.firstCabinLit),
    hasMoodToday,
    hasBottleAction || hasStandardTest
  ];
  const completed = steps.filter(Boolean).length;
  const percent = Math.round((completed / steps.length) * 100);
  let label = "等待靠岸";
  if (completed > 0 && completed < steps.length) label = `${completed}/${steps.length} 段航线已点亮`;
  if (completed === steps.length) label = "今日航线完成";

  let next = "下一座可点亮区域：海边码头";
  if (!state.islanderRole) {
    next = "下一座可点亮区域：海边码头，先选择今天的岛民身份。";
  } else if (!state.ritualMood) {
    next = "下一座可点亮区域：森林疗愈区，留下一枚心情贝壳。";
  } else if (!state.firstCabinLit) {
    next = "下一座可点亮区域：第一座小屋，完成靠岸仪式。";
  } else if (!hasMoodToday) {
    next = "下一座可点亮区域：回忆灯塔，记录一次今天的情绪潮汐。";
  } else if (!hasBottleAction && !hasStandardTest) {
    next = "下一座可点亮区域：星光广场，投递漂流瓶或完成一次标准量表。";
  } else {
    next = "下一座可点亮区域：心灵神殿，继续深度探索自己的状态。";
  }

  return { percent, label, next };
}

function updateGrowth() {
  const level = Math.max(1, Math.floor(state.soul / 60) + 1);
  document.querySelector("#level-number").textContent = `Lv.${level}`;
  document.querySelector("#soul-value").textContent = state.soul;
  document.querySelector("#emotion-energy").textContent = state.energy;
  document.querySelector("#badge-count").textContent = state.badges.length;
  const badgeRow = document.querySelector("#badge-row");
  badgeRow.replaceChildren(...state.badges.map((badge) => createElement("span", "", badge)));
  const voyage = getGrowthVoyage();
  const progressLabel = document.querySelector("#growth-progress-label");
  const progressFill = document.querySelector("#growth-progress-fill");
  const nextAction = document.querySelector("#growth-next-action");
  if (progressLabel) progressLabel.textContent = voyage.label;
  if (progressFill) progressFill.style.width = `${voyage.percent}%`;
  if (nextAction) nextAction.textContent = voyage.next;
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

function canLightCabin() {
  return Boolean(state.islanderRole && state.ritualMood);
}

function renderRitual() {
  const roleDone = Boolean(state.islanderRole);
  const moodDone = Boolean(state.ritualMood);
  const cabinReady = canLightCabin();
  const cabinDone = Boolean(state.firstCabinLit);
  document.querySelectorAll("[data-role-choice]").forEach((button) => {
    button.classList.toggle("active", button.dataset.roleChoice === state.islanderRole);
  });
  document.querySelectorAll("[data-ritual-mood]").forEach((button) => {
    button.classList.toggle("active", button.dataset.ritualMood === state.ritualMood?.mood);
  });
  document.querySelector("[data-ritual-card='role']")?.classList.toggle("completed", roleDone);
  document.querySelector("[data-ritual-card='mood']")?.classList.toggle("completed", moodDone);
  const cabinCard = document.querySelector("[data-ritual-card='cabin']");
  cabinCard?.classList.toggle("locked", !cabinReady && !cabinDone);
  cabinCard?.classList.toggle("ready", cabinReady && !cabinDone);
  cabinCard?.classList.toggle("completed", cabinDone);
  document.querySelectorAll("[data-ritual-dot]").forEach((dot) => {
    const step = dot.dataset.ritualDot;
    dot.classList.toggle("completed", step === "role" ? roleDone : step === "mood" ? moodDone : cabinDone);
  });
  const roleSummary = document.querySelector("#ritual-role-summary");
  if (roleSummary) {
    roleSummary.textContent = roleDone ? `你今天以“${state.islanderRole}”的身份登岛。` : "给今天的自己一个角色，再开始登岛。";
  }
  const moodSummary = document.querySelector("#ritual-mood-summary");
  if (moodSummary) {
    moodSummary.textContent = moodDone ? `你留下了一枚“${state.ritualMood.mood}”贝壳，岛屿已经听见。` : "不用解释，也不用立刻变好，只给此刻一个名字。";
  }
  const cabinSummary = document.querySelector("#ritual-cabin-summary");
  if (cabinSummary) {
    cabinSummary.textContent = cabinDone
      ? "你的第一座心灵小屋已点亮，今晚可以在这里休息。"
      : cabinReady
        ? "海雾已经散开，可以点亮你的第一座心灵小屋。"
        : "完成前两步后，小屋会从海雾里亮起来。";
  }
  const cabinButton = document.querySelector("#light-cabin");
  if (cabinButton) {
    cabinButton.disabled = !cabinReady || cabinDone;
    cabinButton.textContent = cabinDone ? "小屋已点亮" : cabinReady ? "点亮小屋" : "等待前两步";
  }
  const stamps = {
    role: roleDone ? "已登岛" : "待选择",
    mood: moodDone ? "已留下" : "待留下",
    cabin: cabinDone ? "已点亮" : cabinReady ? "可点亮" : "海雾未散"
  };
  Object.entries(stamps).forEach(([step, text]) => {
    const stamp = document.querySelector(`[data-ritual-stamp="${step}"]`);
    if (stamp) stamp.textContent = text;
  });
}

function completeRitualStep(step, payload = {}) {
  if (step === "role") {
    state.islanderRole = payload.role || "海风旅人";
    state.quests.avatar = true;
    awardBadge("获得码头通行证");
  }
  if (step === "mood") {
    const today = todayKey();
    const mood = payload.mood || "平静";
    const energy = clamp(Number(payload.energy || 6), 1, 10);
    state.ritualMood = { mood, energy, date: new Date().toISOString() };
    state.quests.mood = true;
    state.energy = energy;
    selectedMood = { mood, energy };
    if (state.lastRitualMoodDate !== today) {
      state.moods.push({
        mood,
        energy,
        note: `靠岸仪式：留下了一枚“${mood}”心情贝壳。`,
        date: new Date().toISOString(),
        source: "ritual"
      });
      addSoul(10);
      state.lastRitualMoodDate = today;
    }
    awardBadge("心情贝壳");
  }
  if (step === "cabin") {
    if (!canLightCabin() || state.firstCabinLit) return;
    state.firstCabinLit = true;
    state.quests.cabin = true;
    addSoul(20);
    awardBadge("初次靠岸");
  }
  if (state.firstCabinLit || Object.values(state.quests).filter(Boolean).length >= 3) awardBadge("完成靠岸仪式");
  saveState();
  renderRitual();
  updateGrowth();
  renderMoodChart();
  renderMoodHistory();
  renderMoodPulse();
  renderIslandStats();
  updateMapLocks();
}

function renderMoodChart() {
  const chart = document.querySelector("#mood-chart");
  const recent = state.moods.slice(-7);
  if (!recent.length) {
    chart.replaceChildren(createElement("span", "", "潮汐线还很安静，保存第一篇日记后会出现。"));
    return;
  }
  const title = createElement("strong", "", "最近 7 次心情潮汐");
  const tide = createElement("div", "mood-tide-line");
  recent.forEach((entry, index) => {
    const shell = createElement("article", "mood-shell");
    const energy = clamp(Number(entry.energy || 0), 1, 10);
    shell.style.setProperty("--energy", `${energy * 7}px`);
    shell.style.setProperty("--delay", `${index * 70}ms`);
    shell.append(createElement("span", "", moodGroupFor(entry.mood).emoji));
    shell.append(createElement("b", "", entry.mood || "未命名"));
    shell.append(createElement("small", "", `${energy}/10`));
    tide.append(shell);
  });
  chart.replaceChildren(title, tide);
}

function renderMoodHistory() {
  const history = document.querySelector("#mood-history");
  if (!history) return;
  const recent = state.moods.slice(-3).reverse();
  if (!recent.length) {
    history.replaceChildren(createElement("p", "form-hint", "最近记录会显示在这里，方便你看见自己的情绪节律。"));
    return;
  }
  const title = createElement("strong", "", "我的潮汐日记");
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

function setMoodWallStatus(text, tone = "normal") {
  const status = document.querySelector("#mood-wall-status");
  if (!status) return;
  status.textContent = text;
  status.dataset.tone = tone;
}

function renderMoodWall(posts, source = "local") {
  const wall = document.querySelector("#mood-wall");
  if (!wall) return;
  const sourceNode = document.querySelector("#mood-wall-source");
  if (sourceNode) sourceNode.textContent = source === "cloud" ? "云端岛民树洞" : "本机预览模式";
  const localPosts = [
    ...state.moodWallPosts.slice(-8).reverse(),
    ...seedMoodWallPosts
  ];
  const list = Array.isArray(posts) && posts.length ? posts : localPosts;
  const title = createElement("strong", "", "岛民树洞海岸");
  const hint = createElement("p", "form-hint", source === "cloud" ? "这里展示已通过安全筛选的匿名公开留言。" : "当前展示本机预览与精选留言；配置后端后会显示云端公开树洞。");
  const shore = createElement("div", "mood-wall-shore");
  list.slice(0, 8).forEach((post, index) => {
    const item = createElement("article", "mood-wall-post");
    const no = post.islander_no || post.islanderNo || 500 + index;
    const mood = post.mood || "未命名";
    const time = post.created_at || post.date;
    const date = time ? new Date(time).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) : "今天";
    item.append(createElement("span", "", `第 ${no} 位岛民 / ${mood} / ${date}`));
    item.append(createElement("p", "", post.content || "愿你在这里被轻轻接住。"));
    shore.append(item);
  });
  wall.replaceChildren(title, hint, shore);
}

async function loadMoodWallData() {
  renderMoodWall();
  if (!window.XinlingBackend?.isConfigured()) {
    setMoodWallStatus("当前是本机预览模式；配置后端后，登录岛民可匿名公开留言。");
    return;
  }
  try {
    const data = await XinlingBackend.listMoodWallPosts();
    renderMoodWall(data?.posts, "cloud");
    setMoodWallStatus("云端树洞已同步。你发布的公开留言会匿名显示给其他岛民。");
  } catch (_error) {
    renderMoodWall();
    setMoodWallStatus("云端树洞暂时没有靠岸，先显示本机预览。", "alert");
  }
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
      article.append(createElement("span", "", "抱抱你"));
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
  const todayWallPosts = state.moodWallPosts.filter((entry) => String(entry.date || entry.created_at || "").startsWith(today));
  const counts = new Map(moodGroups.map((group) => [group.key, 0]));
  [...todayMoods, ...todayWallPosts].forEach((entry) => {
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
  const title = createElement("strong", "", "今日岛民心情");
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
    todayMoods:
      state.moods.filter((entry) => String(entry.date || "").startsWith(todayKey())).length +
      state.moodWallPosts.filter((entry) => String(entry.date || entry.created_at || "").startsWith(todayKey())).length,
    consultRequests: state.consultIntent?.summary ? 1 : 0
  };
  const source = remote?.source === "cloud" ? "云端岛民数据" : "本机岛屿数据";
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
  const title = createElement("strong", "", "岛民日志");
  const items = logs.slice(0, 4).map((log, index) => {
    const item = createElement("article");
    const no = log.islander_no || log.islanderNo || 100 + index;
    item.append(createElement("span", "", `第 ${no} 位登岛者留下：`));
    item.append(createElement("p", "", log.content || "愿你在这里被轻轻接住。"));
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

function setTreeholeStatus(text, tone = "normal") {
  const status = document.querySelector("#treehole-status");
  if (!status) return;
  status.textContent = text;
  status.dataset.tone = tone;
}

function showReceivedBottle(bottle) {
  const panel = document.querySelector("#received-bottle");
  if (!panel) return;
  const no = bottle?.islander_no || bottle?.islanderNo || Math.floor(20 + Math.random() * 260);
  panel.replaceChildren(
    createElement("span", "", `收到来自第 ${no} 位登岛者的漂流瓶`),
    createElement("p", "", bottle?.content || "愿你今晚能把心放下来一点点。")
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
  awardBadge("收到漂流瓶");
  addSoul(4);
  saveState();
  updateGrowth();
  renderIslandStats();
}

async function loadCommunityData() {
  renderIslandStats();
  renderMoodPulse();
  renderIslandLogs();
  loadMoodWallData();
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

function renderGoodnightMessage() {
  const message = document.querySelector("#goodnight-message");
  if (!message) return;
  const index = (new Date().getDate() + Number(state.visitStreak || 0)) % goodnightMessages.length;
  message.textContent = goodnightMessages[index];
}

function rotateGoodnightMessage() {
  const message = document.querySelector("#goodnight-message");
  if (!message) return;
  const current = message.textContent;
  const next = goodnightMessages.find((item) => item !== current) || goodnightMessages[0];
  message.textContent = next;
}

function renderTreeholeNotes() {
  const list = document.querySelector("#treehole-list");
  if (!list) return;
  const notes = state.treeholeNotes.slice(-4).reverse();
  if (!notes.length) {
    list.replaceChildren(createElement("p", "form-hint dark", "今晚的树洞还很安静。你可以只留下一句“我今天有点累”。"));
    return;
  }
  const items = notes.map((note) => {
    const item = createElement("article");
    const date = note.date ? new Date(note.date).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) : "今晚";
    item.append(createElement("span", "", `${date} / 晚安留言`));
    item.append(createElement("p", "", note.content));
    return item;
  });
  list.replaceChildren(...items);
}

function saveTreeholeNote() {
  const input = document.querySelector("#treehole-text");
  if (!input) return;
  const text = input.value.trim();
  if (!text) {
    setTreeholeStatus("可以很短，只写一句也可以。", "soft");
    input.focus();
    return;
  }
  if (CRISIS_PATTERN.test(text)) {
    setTreeholeStatus("这句话里出现了安全风险信号。请先联系身边可信任的人、当地紧急电话或线下医疗资源；今晚不要独自承受。", "alert");
    input.focus();
    return;
  }
  state.treeholeNotes.push({ content: text.slice(0, 220), date: new Date().toISOString() });
  state.treeholeNotes = state.treeholeNotes.slice(-12);
  const today = todayKey();
  if (state.lastTreeholeRewardDate !== today) {
    addSoul(6);
    state.lastTreeholeRewardDate = today;
  }
  awardBadge("晚安靠岸");
  input.value = "";
  saveState();
  updateGrowth();
  renderTreeholeNotes();
  setTreeholeStatus("已经放进晚安树洞。愿你离开时比来时轻一点。", "normal");
}

function createOceanAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const context = new AudioContext();
  const bufferSize = context.sampleRate * 4;
  const makeNoise = (strength = 1) => {
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < bufferSize; index += 1) {
      last = last * 0.72 + (Math.random() * 2 - 1) * 0.28;
      data[index] = last * strength;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  };
  const deepWave = makeNoise(0.95);
  const deepFilter = context.createBiquadFilter();
  deepFilter.type = "lowpass";
  deepFilter.frequency.value = 360;
  const foamWave = makeNoise(0.52);
  const foamFilter = context.createBiquadFilter();
  foamFilter.type = "bandpass";
  foamFilter.frequency.value = 1200;
  foamFilter.Q.value = 0.7;
  const waveSwell = context.createOscillator();
  waveSwell.type = "sine";
  waveSwell.frequency.value = 0.075;
  const swellGain = context.createGain();
  swellGain.gain.value = 0.055;
  const mainGain = context.createGain();
  mainGain.gain.value = 0.0001;
  const deepGain = context.createGain();
  deepGain.gain.value = 0.78;
  const foamGain = context.createGain();
  foamGain.gain.value = 0.34;
  waveSwell.connect(swellGain);
  swellGain.connect(mainGain.gain);
  deepWave.connect(deepFilter);
  deepFilter.connect(deepGain);
  deepGain.connect(mainGain);
  foamWave.connect(foamFilter);
  foamFilter.connect(foamGain);
  foamGain.connect(mainGain);
  mainGain.connect(context.destination);
  deepWave.start();
  foamWave.start();
  waveSwell.start();
  return { context, mainGain };
}

function playSeagullCall() {
  if (!oceanAudio || !oceanSoundOn) return;
  const { context } = oceanAudio;
  const now = context.currentTime;
  const output = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800 + Math.random() * 420;
  filter.Q.value = 5.4;
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.035, now + 0.08);
  output.gain.exponentialRampToValueAtTime(0.006, now + 0.52);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 1.18);
  filter.connect(output);
  output.connect(context.destination);

  const makeVoice = (start, base, peak, end, duration, gainScale = 1) => {
    const oscillator = context.createOscillator();
    const voiceGain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(base, start);
    oscillator.frequency.exponentialRampToValueAtTime(peak, start + duration * 0.32);
    oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
    voiceGain.gain.setValueAtTime(0.0001, start);
    voiceGain.gain.exponentialRampToValueAtTime(0.9 * gainScale, start + 0.04);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(voiceGain);
    voiceGain.connect(filter);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  };

  makeVoice(now, 760, 1380, 940, 0.44, 0.7);
  makeVoice(now + 0.34, 620, 1120, 780, 0.62, 0.46);
}

function scheduleSeagulls() {
  window.clearTimeout(seagullTimer);
  if (!oceanSoundOn) return;
  seagullTimer = window.setTimeout(() => {
    playSeagullCall();
    scheduleSeagulls();
  }, 8000 + Math.random() * 10000);
}

function setOceanStatus(message, active = false) {
  const status = document.querySelector("#sound-status");
  const indicator = document.querySelector("#sound-indicator");
  if (status) status.textContent = message;
  indicator?.classList.toggle("active", active);
}

function showSoundUnlockPrompt() {
  const prompt = document.querySelector("#sound-unlock");
  if (!prompt || oceanSoundOn) return;
  prompt.hidden = false;
}

function hideSoundUnlockPrompt() {
  const prompt = document.querySelector("#sound-unlock");
  if (prompt) prompt.hidden = true;
}

async function startOceanSound({ fromUserGesture = false } = {}) {
  if (!oceanAudio) oceanAudio = createOceanAudio();
  if (!oceanAudio) {
    setOceanStatus("当前浏览器不支持网页音频，海浪先保持安静。", false);
    return false;
  }
  try {
    if (oceanAudio.context.state === "suspended") {
      await oceanAudio.context.resume();
    }
    oceanSoundOn = oceanAudio.context.state === "running";
    if (!oceanSoundOn) throw new Error("AudioContext was not resumed.");
    const now = oceanAudio.context.currentTime;
    oceanAudio.mainGain.gain.cancelScheduledValues(now);
    oceanAudio.mainGain.gain.setValueAtTime(Math.max(oceanAudio.mainGain.gain.value, 0.0001), now);
    oceanAudio.mainGain.gain.linearRampToValueAtTime(0.15, now + 1.1);
    state.soundEnabled = true;
    saveState();
    hideSoundUnlockPrompt();
    setOceanStatus("海风、浪声与远处的海鸥正在陪你靠岸。", true);
    scheduleSeagulls();
    return true;
  } catch (_error) {
    oceanSoundOn = false;
    window.clearTimeout(seagullTimer);
    setOceanStatus(fromUserGesture ? "海岛环境声暂时没有启动，请再点击一次进入按钮。" : "点击进入后，海浪和海鸥声会在岛边响起。", false);
    showSoundUnlockPrompt();
    return false;
  }
}

function initOceanSoundAutoplay() {
  setOceanStatus("正在唤起岛边的海风与浪声。", false);
  startOceanSound();
  const unlock = () => {
    if (!oceanSoundOn) startOceanSound({ fromUserGesture: true });
  };
  document.querySelector("#sound-unlock-button")?.addEventListener("click", unlock);
  if (!oceanUnlockBound) {
    oceanUnlockBound = true;
    document.addEventListener("pointerdown", unlock, { once: true, passive: true });
    document.addEventListener("keydown", unlock, { once: true });
  }
}

function renderSoundControl() {
  setOceanStatus(state.soundEnabled ? "正在恢复岛边的海风、浪声与海鸥。" : "正在唤起岛边的海风与浪声。", false);
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
    const reply = fallbackSpriteReply(text);
    appendSpriteChat("assistant", reply);
    syncSpriteChat("assistant", reply);
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
  if (placeId === "garden" && unlocked) {
    awardBadge("发现秘密区域");
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
    day: "今日天气：晴海微风。适合从码头记录一件小事。",
    rain: "今日天气：海岛小雨。适合去森林做一次慢呼吸。",
    stars: "今日天气：星光渐亮。适合投递一只漂流瓶。",
    night: "今日天气：夜海安静。适合在灯塔下回顾今天。"
  };
  if (hint) hint.textContent = copy[mode];
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

document.querySelectorAll("[data-role-choice]").forEach((button) => {
  button.addEventListener("click", () => {
    completeRitualStep("role", { role: button.dataset.roleChoice });
  });
});

document.querySelectorAll("[data-ritual-mood]").forEach((button) => {
  button.addEventListener("click", () => {
    completeRitualStep("mood", {
      mood: button.dataset.ritualMood,
      energy: Number(button.dataset.energy)
    });
  });
});

document.querySelector("#light-cabin")?.addEventListener("click", () => {
  completeRitualStep("cabin");
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
  awardBadge("情绪记录者");
  if (state.moods.length >= 3) awardBadge("连续靠岸");
  note.value = "";
  saveState();
  updateGrowth();
  renderMoodChart();
  renderMoodHistory();
  renderMoodPulse();
  renderIslandStats();
  insight.textContent = insightForMoods();
});

document.querySelector("#publish-mood-wall")?.addEventListener("click", async () => {
  const input = document.querySelector("#mood-wall-text");
  const text = String(input?.value || "").replace(/\s+/g, " ").trim().slice(0, 180);
  if (!text) {
    setMoodWallStatus("可以只留一句很短的话，比如“今天有点累，但我还在靠岸”。", "alert");
    input?.focus();
    return;
  }
  if (CRISIS_PATTERN.test(text)) {
    setMoodWallStatus("这句话里出现了安全风险信号。请先联系身边可信任的人、当地紧急电话或线下医疗资源；它不会进入公开树洞。", "alert");
    input?.focus();
    return;
  }

  if (window.XinlingBackend?.isConfigured()) {
    const user = await XinlingBackend.getUser?.().catch(() => null);
    if (!user) {
      setMoodWallStatus("登录后才能把这句话匿名放到云端树洞；私人日记仍可在本机保存。", "alert");
      return;
    }
    try {
      setMoodWallStatus("正在把这句话放到树洞海岸...");
      const data = await XinlingBackend.publishMoodWallPost({ mood: selectedMood.mood, content: text });
      if (data?.safety === "crisis") {
        setMoodWallStatus(data.reply || "这句话不会进入公开树洞，请优先保证自己的安全。", "alert");
        return;
      }
      input.value = "";
      const today = todayKey();
      if (state.lastMoodWallRewardDate !== today) {
        addSoul(8);
        state.lastMoodWallRewardDate = today;
      }
      awardBadge("树洞回声");
      saveState();
      updateGrowth();
      await loadMoodWallData();
      await loadCommunityData();
      setMoodWallStatus("已匿名放到树洞海岸，其他岛民可以看见这句话。");
      return;
    } catch (_error) {
      setMoodWallStatus("云端树洞暂时没有回应，已切换成本机预览。", "alert");
    }
  }

  state.moodWallPosts.push({
    islanderNo: 600 + state.moodWallPosts.length,
    mood: selectedMood.mood,
    content: text,
    date: new Date().toISOString()
  });
  state.moodWallPosts = state.moodWallPosts.slice(-12);
  input.value = "";
  const today = todayKey();
  if (state.lastMoodWallRewardDate !== today) {
    addSoul(5);
    state.lastMoodWallRewardDate = today;
  }
  awardBadge("树洞回声");
  saveState();
  updateGrowth();
  renderMoodWall();
  renderMoodPulse();
  renderIslandStats();
  setMoodWallStatus("已加入本机预览树洞；配置后端后可发布到云端让其他岛民看见。");
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
    setCommunityStatus("这句话里出现了安全风险信号。请先联系身边可信任的人、当地紧急电话或线下医疗资源；这只瓶子不会进入公开漂流池。", "alert");
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
  awardBadge("星光漂流瓶");
  input.value = "";
  saveState();
  updateGrowth();
  renderBottles();
  renderIslandStats();
  renderIslandLogs();
  setCommunityStatus("漂流瓶已经投向星光广场。", "normal");
  if (window.XinlingBackend?.isConfigured()) {
    try {
      const data = await XinlingBackend.sendBottle({ content: text.slice(0, 180), mood: selectedMood.mood });
      if (data?.safety === "crisis") {
        setCommunityStatus(data.reply || "这只瓶子没有进入公开漂流池。", "alert");
      } else {
        setCommunityStatus("漂流瓶已同步到云端星光广场。", "normal");
        loadCommunityData();
      }
    } catch (_error) {
      setCommunityStatus("云端暂时没有回应，已先保存在本机岛屿。", "soft");
    }
  }
});

document.querySelector("#receive-bottle")?.addEventListener("click", receiveBottle);
document.querySelector("#save-treehole")?.addEventListener("click", saveTreeholeNote);
document.querySelector("#new-goodnight")?.addEventListener("click", rotateGoodnightMessage);

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
  window.XinlingBackend?.createConsultRequest?.({
    serviceType: selectedService,
    topic: cleanTopic,
    summary: bookingText,
    source: "homepage"
  }).catch(() => {});
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

trackVisit();
renderQuests();
renderRitual();
updateGrowth();
renderMoodChart();
renderMoodHistory();
renderBottles();
renderGoodnightMessage();
renderTreeholeNotes();
renderSoundControl();
initOceanSoundAutoplay();
renderBookingState();
renderSpriteChats();
document.querySelector("#ai-insight").textContent = insightForMoods();
updateMapLocks();
updateMapWeather();
loadCommunityData();
showMapPlace("pier");
initSpriteScene();
