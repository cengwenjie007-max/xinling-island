const STORAGE_KEY = "xinling-island-state";

const defaultState = {
  soul: 20,
  energy: 6,
  badges: ["初次登岛"],
  quests: {},
  moods: [],
  bottles: ["今天也许不完美，但我已经在靠岸。"]
};

const state = loadState();
let selectedMood = { mood: "开心", energy: 8 };

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateGrowth() {
  const level = Math.max(1, Math.floor(state.soul / 60) + 1);
  document.querySelector("#level-number").textContent = `Lv.${level}`;
  document.querySelector("#soul-value").textContent = state.soul;
  document.querySelector("#emotion-energy").textContent = state.energy;
  document.querySelector("#badge-count").textContent = state.badges.length;
  document.querySelector("#badge-row").innerHTML = state.badges.map((badge) => `<span>${badge}</span>`).join("");
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
    chart.innerHTML = "<span>暂无记录</span>";
    return;
  }
  chart.innerHTML = recent
    .map(
      (entry) => `
        <div class="mood-bar" style="height:${entry.energy * 10}%">
          <span>${entry.mood}</span>
        </div>
      `
    )
    .join("");
}

function renderBottles() {
  document.querySelector("#bottle-list").innerHTML = state.bottles
    .slice(-4)
    .reverse()
    .map((item) => `<article>${item}<span>抱抱你</span></article>`)
    .join("");
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
    state.soul += input.checked ? 10 : -10;
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
  state.moods.push({
    mood: selectedMood.mood,
    energy: selectedMood.energy,
    note: note.value.trim(),
    date: new Date().toISOString()
  });
  state.energy = selectedMood.energy;
  state.soul += 15;
  awardBadge("情绪记录者");
  if (state.moods.length >= 3) awardBadge("连续靠岸");
  note.value = "";
  saveState();
  updateGrowth();
  renderMoodChart();
  document.querySelector("#ai-insight").textContent = insightForMoods();
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
  state.bottles.push(text);
  state.soul += 8;
  awardBadge("星光漂流瓶");
  input.value = "";
  saveState();
  updateGrowth();
  renderBottles();
});

renderQuests();
updateGrowth();
renderMoodChart();
renderBottles();
document.querySelector("#ai-insight").textContent = insightForMoods();
