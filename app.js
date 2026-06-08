const STORAGE_KEY = "xinling-island-state";

const defaultState = {
  soul: 20,
  energy: 6,
  badges: ["初次登岛"],
  quests: {},
  moods: [],
  bottles: ["今天也许不完美，但我已经在靠岸。"],
  lastMoodRewardDate: "",
  lastBottleRewardDate: ""
};

const state = loadState();
let selectedMood = { mood: "开心", energy: 8 };

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
    bottles: Array.isArray(nextState.bottles) ? nextState.bottles : [...defaultState.bottles]
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

function insightForMoods() {
  const recent = state.moods.slice(-3);
  if (!recent.length) return "保存后，这里会出现你的情绪趋势分析。";
  const average = recent.reduce((sum, item) => sum + item.energy, 0) / recent.length;
  if (average >= 7) return "最近的情绪能量偏明亮，可以趁状态好时保存一些让你恢复的习惯。";
  if (average >= 4) return "最近情绪有起伏，建议给自己安排一个低门槛休息动作，比如散步或早睡。";
  return "最近能量偏低，请先照顾睡眠、饮食和安全感，不要独自硬撑太久。";
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

document.querySelector("#send-sprite").addEventListener("click", () => {
  const input = document.querySelector("#sprite-input");
  const text = input.value.trim();
  if (!text) return;
  let reply = "我听见了。先把呼吸放慢一点，我们不用马上解决所有事。";
  if (/累|疲惫|困|撑/.test(text)) reply = "今天辛苦了。先允许自己停靠十分钟，岛上的风会陪你把肩膀慢慢放下来。";
  if (/焦虑|害怕|紧张/.test(text)) reply = "焦虑像涨潮，它会来，也会退。先说出你最担心的一件小事，我们只处理这一件。";
  if (/难过|失恋|哭/.test(text)) reply = "我会在这里陪你。难过不是退步，它说明这件事真的触碰到了你。";
  document.querySelector("#sprite-reply").textContent = reply;
  input.value = "";
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

renderQuests();
updateGrowth();
renderMoodChart();
renderMoodHistory();
renderBottles();
document.querySelector("#ai-insight").textContent = insightForMoods();
