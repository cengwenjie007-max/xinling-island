const tests = [
  {
    id: "social-tide",
    name: "社交潮汐测试",
    tag: "社交焦虑倾向",
    time: "2 分钟",
    description: "观察你在社交场景中的紧张、回避和恢复速度。",
    questions: [
      "进入陌生人很多的场合时，我会先担心自己是否表现得不自然。",
      "发出消息后，如果对方迟迟不回，我会反复猜测原因。",
      "在小组里表达观点前，我常常需要做很久心理准备。",
      "我会为了避免尴尬而减少主动邀约或开启话题。",
      "社交结束后，我容易复盘自己说过的话。",
      "被他人注视或评价时，我的身体会明显紧绷。",
      "我想建立关系，但常常不知道怎样靠近别人。",
      "一次不顺利的互动会影响我接下来很久的心情。"
    ],
    results: [
      {
        min: 0,
        max: 6,
        title: "轻浪社交型",
        summary: "你在多数社交场合能保持自然，偶尔的紧张更像正常提醒。",
        advice: ["继续保留主动连接的习惯。", "遇到小尴尬时，用事实替代脑内推演。", "给自己一点恢复时间，不必追求每次互动都完美。"]
      },
      {
        min: 7,
        max: 15,
        title: "涨潮观察型",
        summary: "你对社交反馈比较敏感，容易在重要关系或陌生场景里紧张。",
        advice: ["先练习低风险表达，比如一句回应或一个问题。", "把复盘限制在 10 分钟内，写下一个可改进点即可。", "用身体放松练习降低互动前的警觉。"]
      },
      {
        min: 16,
        max: 24,
        title: "高浪防御型",
        summary: "社交压力可能正在消耗你，让你倾向于回避或过度自责。",
        advice: ["从最安全的人际场景重新建立掌控感。", "把目标从表现好改成完成一次真实表达。", "如果回避明显影响学习、工作或关系，可以考虑寻求咨询支持。"]
      }
    ]
  },
  {
    id: "stress-storm",
    name: "压力风暴测试",
    tag: "压力负荷",
    time: "2 分钟",
    description: "了解近期压力对睡眠、专注、身体和情绪的影响。",
    questions: [
      "最近我常觉得事情一件接一件，难以真正停下来。",
      "即使休息时，我的大脑也在处理待办和担忧。",
      "我的睡眠、食欲或身体状态被压力影响。",
      "我比平时更容易烦躁、急促或失去耐心。",
      "面对任务时，我会先感到压迫感而不是清晰行动。",
      "我很难拒绝额外请求，即使已经很累。",
      "我经常觉得自己必须撑住，不能出错。",
      "我需要更久时间才能从一天的消耗里恢复。"
    ],
    results: [
      {
        min: 0,
        max: 6,
        title: "微风负荷",
        summary: "你的压力目前相对可控，恢复系统还在工作。",
        advice: ["保留固定睡眠和运动节律。", "提前安排轻休息，避免只在崩溃后补救。", "把压力来源分成能做、能沟通、需放下三类。"]
      },
      {
        min: 7,
        max: 15,
        title: "季风负荷",
        summary: "压力已经开始影响你的精力分配，需要主动减载。",
        advice: ["每天只选 1 到 3 件关键任务。", "练习把请求延后答复，给自己判断空间。", "用 15 分钟散步或呼吸练习打断持续紧绷。"]
      },
      {
        min: 16,
        max: 24,
        title: "风暴负荷",
        summary: "你可能处在长期高压状态，身心恢复被明显挤压。",
        advice: ["优先处理睡眠、饮食和基本安全感。", "和可信任的人说明当前负荷，减少独自硬撑。", "若持续失眠、崩溃或躯体不适，请及时寻求专业支持。"]
      }
    ]
  },
  {
    id: "mood-energy",
    name: "情绪能量测试",
    tag: "低落与恢复力",
    time: "2 分钟",
    description: "看见近期情绪低落、兴趣下降和自我修复能力。",
    questions: [
      "我对平时喜欢的事提不起太多兴趣。",
      "我觉得自己最近的能量比以往低。",
      "我容易把小挫折理解成自己的问题。",
      "我很难从快乐或放松的事情里获得满足。",
      "我对未来几天缺少期待感。",
      "我会不自觉减少和外界的连接。",
      "我需要更长时间才能完成原本简单的任务。",
      "我仍能找到让自己稍微恢复的方式。"
    ],
    reverse: [7],
    results: [
      {
        min: 0,
        max: 6,
        title: "晨光能量",
        summary: "你的情绪能量整体稳定，偶尔波动仍有恢复空间。",
        advice: ["继续记录让你恢复的具体活动。", "把好状态当作资源，而不是理所当然。", "保持稳定社交和身体活动。"]
      },
      {
        min: 7,
        max: 15,
        title: "薄雾能量",
        summary: "你近期可能有一些低落和兴趣下降，需要温和照料。",
        advice: ["把任务拆小，先完成能启动的一步。", "每天安排一个低门槛恢复动作。", "减少自责语言，记录事实和感受的区别。"]
      },
      {
        min: 16,
        max: 24,
        title: "阴云能量",
        summary: "低能量可能已经持续影响生活，不建议只靠意志硬扛。",
        advice: ["优先保证安全、睡眠和基本进食。", "把状态告诉可信任的人，建立陪伴和观察。", "如低落持续、出现伤害自己的想法，请立即联系专业人员或当地紧急资源。"]
      }
    ]
  },
  {
    id: "eq-lighthouse",
    name: "情商灯塔测试",
    tag: "情绪理解与表达",
    time: "2 分钟",
    description: "评估你识别情绪、表达需求和处理冲突的方式。",
    positive: true,
    questions: [
      "我能较快分辨自己是生气、委屈、害怕还是疲惫。",
      "情绪强烈时，我仍能尽量说明自己的需求。",
      "我能觉察对方话语背后的情绪，而不只听字面意思。",
      "冲突中，我会避免用攻击或冷处理解决问题。",
      "我愿意承认自己的误解或过度反应。",
      "我能在照顾别人感受时保留自己的边界。",
      "我会用合适方式表达感谢、歉意或欣赏。",
      "我能从一次关系摩擦里总结新的相处方式。"
    ],
    results: [
      {
        min: 0,
        max: 8,
        title: "雾中灯塔",
        summary: "你可能常常感受到情绪，却还不容易把它说清楚。",
        advice: ["先练习命名情绪，而不是立刻处理关系。", "用我感到、我需要、我希望的句式表达。", "冲突后复盘触发点和真实需求。"]
      },
      {
        min: 9,
        max: 16,
        title: "近岸灯塔",
        summary: "你已经具备不错的情绪理解力，部分场景还会被压力带偏。",
        advice: ["在重要对话前先写下核心需求。", "练习倾听后复述，确认你理解的是对方本意。", "把边界表达得温和但明确。"]
      },
      {
        min: 17,
        max: 24,
        title: "远航灯塔",
        summary: "你能较成熟地识别、表达和调节情绪，是关系里的稳定资源。",
        advice: ["保持真实表达，不必过度承担他人情绪。", "在高压关系中继续守住边界。", "把你的情绪能力用于合作，而不是自我压抑。"]
      }
    ]
  },
  {
    id: "career-island",
    name: "职业性格航线",
    tag: "职业偏好",
    time: "2 分钟",
    description: "从工作偏好、能量来源和决策方式理解适合你的职业环境。",
    questions: [
      "我喜欢在清晰规则和目标下推进任务。",
      "我更享受探索新想法，而不是重复固定流程。",
      "需要长期独立钻研的工作会让我有成就感。",
      "与人协作、沟通和影响他人会给我能量。",
      "我做决定时更依赖事实、结构和可验证信息。",
      "我很在意工作是否能表达价值感或帮助他人。",
      "面对变化，我通常能快速调整方案。",
      "我希望职业道路能保留一定自由度和审美空间。"
    ],
    results: [
      {
        min: 0,
        max: 8,
        title: "秩序港湾型",
        summary: "你偏好稳定、清晰、可预期的职业环境，适合流程明确的岗位。",
        advice: ["选择有清楚职责和反馈机制的团队。", "用结构化能力建立专业可信度。", "避免长期处在混乱又缺少边界的岗位。"]
      },
      {
        min: 9,
        max: 16,
        title: "协作航线型",
        summary: "你兼具执行和适应力，适合在协作、沟通和项目推进中发挥。",
        advice: ["寻找既有目标又允许讨论的工作环境。", "把沟通能力转化为项目管理或用户理解优势。", "定期校准边界，避免过度响应他人。"]
      },
      {
        min: 17,
        max: 24,
        title: "自由远航型",
        summary: "你更需要探索、创造和自主空间，适合变化、创意或策略型工作。",
        advice: ["选择允许试错和表达观点的环境。", "用阶段目标稳定你的创造力。", "留意自由和收入、稳定之间的现实平衡。"]
      }
    ]
  }
];

const choices = ["很少如此", "偶尔如此", "经常如此", "几乎总是"];
const state = { currentId: null };

const list = document.querySelector("#test-list");
const empty = document.querySelector("#stage-empty");
const active = document.querySelector("#active-test");
const resultPanel = document.querySelector("#result-panel");
const form = document.querySelector("#test-form");
const testAlert = document.querySelector("#test-alert");

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getTest(id) {
  return tests.find((test) => test.id === id) || tests[0];
}

function renderList() {
  list.innerHTML = tests
    .map(
      (test) => `
        <button class="test-card" type="button" data-test-id="${test.id}">
          <span>${test.tag}</span>
          <strong>${test.name}</strong>
          <small>${test.time} / ${test.questions.length} 题</small>
        </button>
      `
    )
    .join("");
}

function startTest(id) {
  const test = getTest(id);
  state.currentId = test.id;
  empty.hidden = true;
  resultPanel.hidden = true;
  active.hidden = false;
  document.querySelector("#test-kicker").textContent = test.tag;
  document.querySelector("#test-count").textContent = `${test.questions.length} 题`;
  document.querySelector("#test-title").textContent = test.name;
  document.querySelector("#test-description").textContent = test.description;
  document.querySelector("#progress-bar").style.width = "0%";
  testAlert.textContent = "";
  form.innerHTML = test.questions
    .map(
      (question, index) => `
        <fieldset class="question-block">
          <legend><span>${String(index + 1).padStart(2, "0")}</span>${question}</legend>
          <div class="choice-grid">
            ${choices
              .map(
                (choice, score) => `
                  <label>
                    <input type="radio" name="q${index}" value="${score}" />
                    <span>${choice}</span>
                  </label>
                `
              )
              .join("")}
          </div>
        </fieldset>
      `
    )
    .join("");
  document.querySelectorAll(".test-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.testId === test.id);
  });
}

function getScore(test) {
  return test.questions.reduce((total, _question, index) => {
    const selected = form.querySelector(`input[name="q${index}"]:checked`);
    if (!selected) return total;
    const value = Number(selected.value);
    if (test.reverse?.includes(index)) return total + (3 - value);
    return total + value;
  }, 0);
}

function answeredCount(test) {
  return test.questions.filter((_question, index) => form.querySelector(`input[name="q${index}"]:checked`)).length;
}

function updateProgress() {
  const test = getTest(state.currentId);
  const percent = Math.round((answeredCount(test) / test.questions.length) * 100);
  document.querySelector("#progress-bar").style.width = `${percent}%`;
  testAlert.textContent = "";
}

function showResult() {
  const test = getTest(state.currentId);
  const count = answeredCount(test);
  if (count < test.questions.length) {
    const nextIndex = test.questions.findIndex((_question, index) => !form.querySelector(`input[name="q${index}"]:checked`));
    const next = form.querySelector(`fieldset:nth-of-type(${nextIndex + 1})`);
    testAlert.textContent = `还有 ${test.questions.length - count} 题没有选择。已经帮你跳到下一题。`;
    next?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const score = getScore(test);
  const result = test.results.find((item) => score >= item.min && score <= item.max) || test.results.at(-1);
  active.hidden = true;
  resultPanel.hidden = false;
  document.querySelector("#result-title").textContent = result.title;
  document.querySelector("#result-summary").textContent = result.summary;
  document.querySelector("#result-score").textContent = `${score} / 24`;
  document.querySelector("#result-range").textContent = test.name;
  const advice = document.querySelector("#result-advice");
  const intro = createElement("p", "", "下一步可以从一件低门槛的小事开始：记录今天的状态、和可信任的人说一句，或在需要时寻找专业支持。");
  advice.replaceChildren(intro, ...result.advice.map((item) => createElement("p", "", item)));
  renderConsultMatch(test, score);
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderConsultMatch(test, score) {
  const title = document.querySelector("#consult-match-title");
  const copy = document.querySelector("#consult-match-copy");
  if (!title || !copy) return;
  const highScore = test.positive ? score <= 8 : score >= 16;
  const mediumScore = test.positive ? score <= 16 : score >= 7;
  if (highScore) {
    title.textContent = "建议优先匹配心理咨询";
    copy.textContent = "这份结果提示当前议题可能已经明显影响生活。建议带着测试结果、持续时间和最困扰的问题，寻找正规心理咨询或医疗资源。";
    return;
  }
  if (mediumScore) {
    title.textContent = "适合先找倾听员梳理";
    copy.textContent = "你可以先预约一次倾听陪伴，把近期压力、关系或情绪主题说清楚，再决定是否需要更深入的心理咨询。";
    return;
  }
  title.textContent = "适合做日常自助维护";
  copy.textContent = "当前结果更适合继续记录情绪、定期复测和保持稳定习惯。如果之后状态反复，也可以回到求助灯塔整理咨询主题。";
}

renderList();

list.addEventListener("click", (event) => {
  const card = event.target.closest("[data-test-id]");
  if (!card) return;
  startTest(card.dataset.testId);
});

form.addEventListener("change", updateProgress);
document.querySelector("#show-result").addEventListener("click", showResult);
document.querySelector("#reset-test").addEventListener("click", () => {
  active.hidden = true;
  resultPanel.hidden = true;
  empty.hidden = false;
  state.currentId = null;
  document.querySelectorAll(".test-card").forEach((card) => card.classList.remove("active"));
});
document.querySelector("#retake-test").addEventListener("click", () => startTest(state.currentId));

const hashId = window.location.hash.replace("#", "");
if (hashId && tests.some((test) => test.id === hashId)) {
  startTest(hashId);
}
