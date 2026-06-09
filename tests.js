const defaultChoices = [
  { label: "很少如此", score: 0 },
  { label: "偶尔如此", score: 1 },
  { label: "经常如此", score: 2 },
  { label: "几乎总是", score: 3 }
];

const phqChoices = [
  { label: "完全没有", score: 0 },
  { label: "几天", score: 1 },
  { label: "一半以上天数", score: 2 },
  { label: "几乎每天", score: 3 }
];

const whoChoices = [
  { label: "完全没有", score: 0 },
  { label: "偶尔", score: 1 },
  { label: "少于一半时间", score: 2 },
  { label: "超过一半时间", score: 3 },
  { label: "大部分时间", score: 4 },
  { label: "一直如此", score: 5 }
];

const sources = {
  original: {
    sourceType: "原创自助版",
    sourceName: "心灵岛屿原创题库",
    sourceUrl: "index.html#help",
    licenseNote: "原创自助题目，用于自我观察，不作为医学诊断。"
  },
  phq9: {
    sourceType: "权威筛查量表",
    sourceName: "PHQ-9 / NIH Common Data Element",
    sourceUrl: "https://www.nih.gov/node/19946",
    licenseNote: "NIH 页面标注 Copyright: No；本站用于自我筛查展示，结果需由专业人员解释。"
  },
  gad7: {
    sourceType: "权威筛查量表",
    sourceName: "GAD-7 / Spitzer, Williams, Kroenke 等",
    sourceUrl: "https://deploymentpsych.org/sites/default/files/member_resource/COP_Toolkit/Metrics_Series-Generalized_Anxiety_Disorder_Scale_GAD.pdf",
    licenseNote: "GAD-7 被公开资料说明为 public domain；本站仅作筛查，不作诊断。"
  },
  who5: {
    sourceType: "权威量表改写",
    sourceName: "WHO-5 Well-Being Index",
    sourceUrl: "https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01",
    licenseNote: "参考 WHO-5 近两周幸福感结构，题目为中文自助表达，不替代原量表或临床评估。"
  },
  niosh: {
    sourceType: "公共领域参考",
    sourceName: "NIOSH Generic Job Stress Questionnaire",
    sourceUrl: "https://archive.cdc.gov/www_cdc_gov/niosh/topics/workorg/detail088.html",
    licenseNote: "NIOSH 工作压力工具标注 Public Domain；本站选取工作心理社会维度做简版自评。"
  },
  psc: {
    sourceType: "权威维度参考",
    sourceName: "Pediatric Symptom Checklist",
    sourceUrl: "https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist/",
    licenseNote: "参考儿童情绪、行为、注意和功能受损维度；本站不复制 PSC 原题，不输出诊断。"
  },
  sdq: {
    sourceType: "受版权量表维度参考",
    sourceName: "SDQ / Strengths and Difficulties Questionnaire",
    sourceUrl: "https://youthinmind.com/copyright/",
    licenseNote: "SDQ 电子版和翻译受版权限制；本站不复制、不改编原题，只参考主题维度写原创题。"
  },
  couple: {
    sourceType: "受版权量表维度参考",
    sourceName: "RDAS / Couple Satisfaction 等关系量表",
    sourceUrl: "https://eprovide.mapi-trust.org/instruments/revised-dyadic-adjustment-scale",
    licenseNote: "夫妻关系标准量表多有授权要求；本站使用原创关系自助题，不替代婚姻家庭治疗评估。"
  }
};

function makeRanges(labels, maxScore = 24, positive = false) {
  if (positive) {
    return [
      { min: 0, max: Math.floor(maxScore * 0.33), title: labels[0], summary: "当前资源感偏低，建议先降低压力、增加支持，并观察状态是否持续。", advice: ["先选择一个最容易完成的照顾动作。", "把最近的困难告诉可信任的人。", "如果持续影响生活，建议寻求倾听或咨询支持。"] },
      { min: Math.floor(maxScore * 0.33) + 1, max: Math.floor(maxScore * 0.67), title: labels[1], summary: "你已有一些稳定资源，但仍需要把恢复动作变成更规律的习惯。", advice: ["记录一件正在变好的小事。", "保持睡眠、运动和社交连接。", "一周后复测，观察趋势而不是只看单次分数。"] },
      { min: Math.floor(maxScore * 0.67) + 1, max: maxScore, title: labels[2], summary: "你的状态资源较充足，适合继续维护，并把有效经验沉淀下来。", advice: ["继续保持当前有效的生活结构。", "把恢复方法写进自己的工具箱。", "状态下滑时及时回到记录和求助路径。"] }
    ];
  }
  return [
    { min: 0, max: Math.floor(maxScore * 0.33), title: labels[0], summary: "当前困扰程度较低，适合做日常维护和周期性复测。", advice: ["保留规律作息和稳定连接。", "记录触发状态波动的小事件。", "如果后续分数升高，再回到本测试观察变化。"] },
    { min: Math.floor(maxScore * 0.33) + 1, max: Math.floor(maxScore * 0.67), title: labels[1], summary: "当前困扰已经值得认真看见，建议主动减压并寻求支持。", advice: ["挑一个最影响生活的场景先处理。", "和可信任的人说清楚你的压力。", "可先找倾听员梳理，再决定是否需要咨询。"] },
    { min: Math.floor(maxScore * 0.67) + 1, max: maxScore, title: labels[2], summary: "当前困扰可能已经明显影响生活，不建议长期独自硬撑。", advice: ["优先保证睡眠、饮食和现实安全。", "带着结果、持续时间和最困扰的问题寻求专业支持。", "若出现危机或失控感，请立即联系身边可信任的人或当地紧急资源。"] }
  ];
}

function createTest(config) {
  const choices = config.choices || defaultChoices;
  const maxScore = config.maxScore ?? config.questions.length * Math.max(...choices.map((choice) => choice.score));
  return {
    time: `${config.questions.length <= 8 ? 2 : 3} 分钟`,
    riskLevel: "常规自助",
    scoringMode: config.positive ? "分数越高代表资源越充足" : "分数越高代表困扰越明显",
    choices,
    maxScore,
    ...sources[config.source || "original"],
    ...config,
    results: config.results || makeRanges(config.labels, maxScore, config.positive)
  };
}

const tests = [
  createTest({
    id: "child-emotion-behavior",
    name: "儿童情绪与行为观察",
    tag: "家长观察",
    category: "儿童",
    audience: "4-12岁儿童家长",
    source: "psc",
    description: "从家长视角观察孩子近一个月情绪、行为和日常功能变化。",
    questions: ["孩子比平时更容易哭闹、烦躁或发脾气。", "孩子对原本喜欢的活动明显失去兴趣。", "孩子在学校、家庭或同伴相处中更容易出现冲突。", "孩子经常说身体不舒服，但检查或休息后仍反复出现。", "孩子很难遵守基本规则，需要频繁提醒。", "孩子遇到小挫折时恢复时间明显变长。", "孩子近期睡眠、食欲或精力有明显变化。", "孩子的状态已经影响学习、家庭互动或同伴关系。"],
    labels: ["轻度观察", "需要跟进", "建议评估"]
  }),
  createTest({
    id: "child-attention-impulse",
    name: "儿童注意力与冲动观察",
    tag: "注意行为",
    category: "儿童",
    audience: "5-12岁儿童家长",
    source: "psc",
    description: "观察孩子专注、冲动控制和任务完成的日常表现。",
    questions: ["孩子做作业或活动时很容易被无关刺激带走。", "孩子经常忘记刚被交代的事情。", "孩子坐不住、插话或很难等待轮到自己。", "孩子完成需要持续注意的任务明显吃力。", "孩子常因粗心或急着做完而出错。", "孩子需要大人反复提醒才能收拾物品或完成流程。", "孩子在课堂或集体活动中因冲动影响关系。", "这些表现已经持续影响学习、亲子关系或自信。"],
    labels: ["轻度分心", "需要结构支持", "建议进一步评估"]
  }),
  createTest({
    id: "child-parent-communication",
    name: "亲子沟通温度测试",
    tag: "亲子关系",
    category: "儿童",
    audience: "家长",
    source: "original",
    positive: true,
    description: "看见你和孩子之间的倾听、规则和情绪回应质量。",
    questions: ["孩子愿意告诉我学校或朋友之间发生的事。", "当孩子表达情绪时，我能先听完再回应。", "家里的规则清楚，且大人执行方式相对稳定。", "冲突后，我们能找到修复关系的机会。", "我能区分孩子的行为问题和他的价值感。", "我会给孩子留出选择和表达空间。", "孩子犯错后，仍能感到被爱和被支持。", "我能在疲惫时暂停，避免把压力完全丢给孩子。"],
    labels: ["沟通偏紧", "沟通可修复", "沟通有温度"]
  }),
  createTest({
    id: "child-school-adaptation",
    name: "儿童校园适应测试",
    tag: "校园功能",
    category: "儿童",
    audience: "6-12岁儿童家长",
    source: "psc",
    description: "观察孩子在学习、同伴、规则和分离适应上的状态。",
    questions: ["孩子上学前明显焦虑、抗拒或身体不适。", "孩子近期对学校活动兴趣下降。", "孩子和同学相处时经常被排斥、冲突或孤立。", "老师反馈孩子课堂参与或规则适应变差。", "孩子害怕考试、点名或公开表现。", "孩子放学后情绪低落或爆发明显增加。", "孩子因学校压力影响睡眠或食欲。", "孩子的校园状态让家庭每天都很紧绷。"],
    labels: ["适应稳定", "适应波动", "建议家校协作"]
  }),
  createTest({
    id: "child-sleep-routine",
    name: "儿童睡眠习惯测试",
    tag: "作息睡眠",
    category: "儿童",
    audience: "儿童家长",
    source: "original",
    description: "检查孩子睡前节律、夜醒和白天恢复情况。",
    questions: ["孩子入睡时间经常拖得很晚。", "睡前屏幕、游戏或兴奋活动影响孩子入睡。", "孩子夜里容易醒来或做噩梦。", "孩子早上起床困难，白天精神不足。", "孩子睡前会反复要求陪伴、确认或讲条件。", "家庭睡前流程不稳定，常临时变化。", "睡眠问题影响孩子白天情绪和注意力。", "我对孩子睡眠问题已经感到明显无力。"],
    labels: ["睡眠轻波动", "需要作息重建", "建议专业咨询"]
  }),
  createTest({
    id: "child-screen-balance",
    name: "儿童屏幕使用平衡测试",
    tag: "数字习惯",
    category: "儿童",
    audience: "儿童家长",
    source: "original",
    description: "观察屏幕使用是否影响孩子情绪、睡眠、学习和亲子关系。",
    questions: ["孩子很难在约定时间停止看屏幕。", "减少屏幕时，孩子会明显发脾气或焦虑。", "屏幕使用影响孩子作业、运动或睡眠。", "孩子更愿意刷视频或玩游戏，而不是现实活动。", "家庭常因屏幕时间发生冲突。", "孩子会隐瞒、讨价还价或偷偷使用设备。", "孩子离开屏幕后很难重新投入现实任务。", "我需要更清楚的家庭数字规则。"],
    labels: ["使用可控", "需要边界", "建议重建规则"]
  }),
  createTest({
    id: "teen-low-mood",
    name: "青少年情绪低落筛查",
    tag: "低落兴趣",
    category: "青少年",
    audience: "13-18岁青少年",
    source: "original",
    description: "观察近两周低落、兴趣下降、自责和精力变化。若痛苦强烈，请及时告诉可信任的大人。",
    questions: ["我最近经常觉得情绪低落或空空的。", "我对以前喜欢的事兴趣下降。", "我容易觉得自己不够好或让别人失望。", "我很难集中注意力学习或做事。", "我的睡眠或食欲和以前相比变化明显。", "我不太想和朋友或家人说话。", "我常觉得一天很难开始。", "这些状态已经影响学习、关系或生活节奏。"],
    labels: ["低落轻微", "需要支持", "建议尽快求助"]
  }),
  createTest({
    id: "teen-anxiety",
    name: "青少年焦虑紧张测试",
    tag: "焦虑担心",
    category: "青少年",
    audience: "13-18岁青少年",
    source: "gad7",
    description: "参考 GAD-7 的焦虑维度，观察担心、紧张、失控感和身体警觉。",
    questions: ["我经常感到紧张、担心或坐立不安。", "我很难停止或控制担忧。", "我会为很多不同的事情担心。", "我难以放松下来。", "我会因为紧张而坐不住或烦躁。", "我比平时更容易被小事激怒。", "我担心会发生不好的事。", "这些担心已经影响学习、睡眠或关系。"],
    labels: ["轻度紧张", "中度焦虑", "明显焦虑"]
  }),
  createTest({
    id: "teen-study-pressure",
    name: "青少年学习压力测试",
    tag: "学习考试",
    category: "青少年",
    audience: "学生",
    source: "original",
    description: "看见考试、成绩、期待和自我要求带来的压力。",
    questions: ["想到考试或排名，我会明显紧张。", "我把成绩和自己的价值感绑得很紧。", "我常担心辜负父母、老师或自己的期待。", "学习任务太多时，我会拖延或直接失去动力。", "我很难在休息时真正放松。", "一次失误会影响我很久的心情。", "我不知道如何和家人谈学习压力。", "学习压力已经影响睡眠、食欲或身体状态。"],
    labels: ["压力可控", "压力偏高", "需要减压支持"]
  }),
  createTest({
    id: "teen-peer-connection",
    name: "青少年同伴关系测试",
    tag: "朋友同伴",
    category: "青少年",
    audience: "13-18岁青少年",
    source: "sdq",
    description: "原创题，参考同伴关系和社会功能维度，观察孤立、冲突和归属感。",
    questions: ["我常担心自己在同学眼里不合群。", "我很难找到可以说真心话的朋友。", "群体聊天或社交媒体会让我焦虑。", "我和朋友发生误会后会反复想很久。", "我害怕被忽视、排斥或评价。", "我会为了融入别人而隐藏真实想法。", "同伴关系影响了我的学习或心情。", "我希望有人能认真听我说完。"],
    labels: ["连接尚可", "连接不足", "需要陪伴支持"]
  }),
  createTest({
    id: "teen-self-worth",
    name: "青少年自我价值测试",
    tag: "自尊自信",
    category: "青少年",
    audience: "13-18岁青少年",
    source: "original",
    description: "观察自我评价是否被成绩、外貌、社交反馈过度牵动。",
    questions: ["我经常拿自己和别人比较。", "别人一句评价会影响我很久。", "我很难自然地肯定自己。", "我觉得必须表现好才值得被喜欢。", "我会因为害怕失败而不敢尝试。", "我对外貌、能力或人缘很容易焦虑。", "我常把普通错误理解成自己不行。", "我希望能更稳定地看待自己。"],
    labels: ["价值感较稳", "价值感波动", "需要自我支持"]
  }),
  createTest({
    id: "teen-future-direction",
    name: "青少年未来方向测试",
    tag: "生涯探索",
    category: "青少年",
    audience: "学生",
    source: "original",
    positive: true,
    description: "了解你对兴趣、优势、选择和未来方向的清晰度。",
    questions: ["我知道自己对哪些事情比较有兴趣。", "我能说出自己的几个优势。", "我愿意尝试不同活动来了解自己。", "我能区分自己的想法和别人对我的期待。", "面对升学或职业选择，我能收集信息再决定。", "我允许自己暂时不完全确定未来。", "我有至少一个可以讨论未来方向的人。", "我相信方向可以通过探索慢慢清楚。"],
    labels: ["方向雾区", "方向探索中", "方向较清晰"]
  }),
  createTest({
    id: "phq-9",
    name: "PHQ-9 抑郁症状筛查",
    tag: "权威筛查",
    category: "情绪健康",
    audience: "成人/青少年",
    source: "phq9",
    choices: phqChoices,
    maxScore: 27,
    riskLevel: "需谨慎解释",
    scoringMode: "过去两周频率计分；分数越高代表抑郁相关症状越明显",
    criticalIndexes: [8],
    description: "PHQ-9 用于筛查近两周抑郁相关症状；结果不是诊断，必要时请联系专业人员。",
    questions: ["做事时兴趣或乐趣明显减少。", "感到情绪低落、沮丧或没有希望。", "入睡困难、睡不安稳，或睡得过多。", "感到疲倦或没有精力。", "食欲不佳，或吃得过多。", "觉得自己很糟，或觉得自己让自己/家人失望。", "难以集中注意力，例如读书、工作或看内容。", "动作或说话变慢到别人可能注意到，或相反地坐立不安。", "出现过伤害自己，或觉得自己不如离开的想法。"],
    results: [
      { min: 0, max: 4, title: "极轻微或无明显抑郁症状", summary: "当前分数处于较低区间，适合继续做生活维护和周期性复测。", advice: ["保留睡眠、运动和现实连接。", "如果状态突然变化，及时记录触发因素。", "本结果不排除其他心理困扰。"] },
      { min: 5, max: 9, title: "轻度抑郁相关症状", summary: "近期可能有低落、兴趣下降或精力减少，建议主动照顾。", advice: ["把最困扰的症状写下来。", "减少独自硬撑，和可信任的人说说。", "若持续两周以上或加重，建议咨询专业人员。"] },
      { min: 10, max: 14, title: "中度抑郁相关症状", summary: "分数提示需要进一步评估，尤其当生活功能已经受影响。", advice: ["建议联系心理咨询师、医生或学校/单位支持资源。", "优先稳定睡眠、饮食和日常安排。", "如果出现强烈危机感，请立即联系身边可信任的人或当地紧急资源。"] },
      { min: 15, max: 27, title: "较明显抑郁相关症状", summary: "当前结果提示困扰较重，不建议独自承受或只依赖自助工具。", advice: ["尽快寻求专业评估。", "把测试结果、持续时间和功能影响带给专业人员。", "如有现实危险或失控感，请立即使用紧急求助资源。"] }
    ]
  }),
  createTest({
    id: "gad-7",
    name: "GAD-7 焦虑症状筛查",
    tag: "权威筛查",
    category: "情绪健康",
    audience: "成人/青少年",
    source: "gad7",
    choices: phqChoices,
    maxScore: 21,
    riskLevel: "需谨慎解释",
    description: "GAD-7 用于筛查近两周焦虑相关症状；结果不是诊断。",
    questions: ["感到紧张、焦虑或急切。", "不能停止或控制担忧。", "对各种各样的事情担忧过多。", "很难放松下来。", "坐立不安，难以安静待着。", "变得容易烦恼或急躁。", "感到好像会发生可怕的事情。"],
    results: [
      { min: 0, max: 4, title: "焦虑症状不明显", summary: "当前焦虑分数较低，适合继续维护稳定节律。", advice: ["保持睡眠和运动。", "把偶发担心写成具体问题。", "状态变化时再复测。"] },
      { min: 5, max: 9, title: "轻度焦虑症状", summary: "担心和紧张有所增加，需要主动降低警觉。", advice: ["每天安排短时放松练习。", "区分可控制和不可控制事项。", "减少反复确认和过度搜索。"] },
      { min: 10, max: 14, title: "中度焦虑症状", summary: "分数提示可能需要进一步评估，尤其当睡眠或学习工作受影响。", advice: ["可先预约倾听员梳理压力源。", "如果持续或加重，建议寻求心理咨询。", "把持续时间、触发点和身体反应记录下来。"] },
      { min: 15, max: 21, title: "明显焦虑症状", summary: "焦虑可能已经显著影响生活，建议尽快获得专业支持。", advice: ["优先处理睡眠、身体紧绷和现实安全感。", "联系专业咨询或医疗资源。", "若出现强烈失控感，请立即联系可信任的人或紧急资源。"] }
    ]
  }),
  createTest({
    id: "who-5-wellbeing",
    name: "WHO-5 幸福感自评",
    tag: "幸福感",
    category: "情绪健康",
    audience: "成人/青少年",
    source: "who5",
    choices: whoChoices,
    positive: true,
    maxScore: 25,
    description: "参考 WHO-5 近两周幸福感结构，观察积极情绪、活力和日常兴趣。",
    questions: ["近两周，我感到心情明亮、比较平静。", "近两周，我觉得身体和精神都有一定活力。", "近两周，我醒来后能感到一些恢复感。", "近两周，我对日常事情仍有兴趣。", "近两周，我能感到生活中有一些值得期待的部分。"],
    results: [
      { min: 0, max: 8, title: "幸福感偏低", summary: "近期积极感和恢复感偏少，建议先增加支持和日常照顾。", advice: ["每天安排一件微小但确定的恢复活动。", "减少独处硬撑，寻找可信任的人说说。", "若低分持续，建议寻求专业支持。"] },
      { min: 9, max: 15, title: "幸福感波动", summary: "你仍有一些资源，但近期可能被压力或疲惫削弱。", advice: ["记录让你稍微好一点的时刻。", "维护睡眠、饮食和运动。", "一周后复测观察趋势。"] },
      { min: 16, max: 25, title: "幸福感较稳定", summary: "你近期有较好的积极情绪和恢复资源。", advice: ["继续保持让你有活力的习惯。", "把有效经验保存下来。", "状态下滑时及时回到情绪记录。"] }
    ]
  }),
  createTest({
    id: "stress-load",
    name: "压力负荷测试",
    tag: "压力状态",
    category: "情绪健康",
    audience: "成人/学生",
    source: "original",
    description: "了解近期压力对睡眠、专注、身体和情绪的影响。",
    questions: ["最近我常觉得事情一件接一件，难以真正停下来。", "休息时，我的大脑仍在处理待办和担心。", "我的睡眠、食欲或身体状态被压力影响。", "我比平时更容易烦躁、急促或失去耐心。", "面对任务时，我先感到压迫而不是清晰行动。", "我很难拒绝额外请求，即使已经很累。", "我经常觉得自己必须撑住，不能出错。", "我需要更久时间才能从一天的消耗里恢复。"],
    labels: ["微风负荷", "季风负荷", "风暴负荷"]
  }),
  createTest({
    id: "sleep-harbor",
    name: "睡眠港湾测试",
    tag: "睡眠质量",
    category: "生活状态",
    audience: "成人/学生",
    source: "original",
    description: "了解入睡、夜醒、醒后恢复和睡前心理负担。",
    questions: ["我入睡前常需要很久才能安静下来。", "我会在夜里醒来，并难以再次入睡。", "醒来后，我常觉得没有真正恢复。", "睡前刷手机或处理信息会影响我的睡意。", "我会把白天没解决的事带进睡前。", "我的作息时间最近不太稳定。", "我会因为担心睡不好而更难入睡。", "白天的注意力和情绪受睡眠影响。"],
    labels: ["安稳港湾", "浅眠港湾", "失眠警港"]
  }),
  createTest({
    id: "resilience-spring",
    name: "复原力泉水测试",
    tag: "心理复原力",
    category: "情绪健康",
    audience: "成人/学生",
    source: "original",
    positive: true,
    description: "评估你从挫折中恢复、调整和重新行动的能力。",
    questions: ["遇到挫折后，我通常能慢慢重新行动。", "我能找到至少一种让自己恢复的方法。", "我会向可信任的人寻求支持。", "困难发生时，我能先处理最重要的一步。", "我能从失败里总结经验，而不只是否定自己。", "我相信状态会变化，不会永远停在低谷。", "我能在压力中保留基本生活节律。", "我知道哪些环境和关系会帮助我恢复。"],
    labels: ["枯水复原", "浅泉复原", "活泉复原"]
  }),
  createTest({
    id: "niosh-job-stress",
    name: "NIOSH 职场压力简版",
    tag: "权威参考",
    category: "职场",
    audience: "职场人士",
    source: "niosh",
    description: "参考 NIOSH 工作压力工具的工作量、控制感、角色和支持维度。",
    questions: ["我的工作量经常超过可承受范围。", "我对工作节奏和方法缺少足够控制感。", "我的岗位责任或优先级经常不清楚。", "不同人对我的要求彼此冲突。", "我缺少完成工作所需的资源或信息。", "我很少获得主管或同事的有效支持。", "工作时间或排班影响恢复和生活。", "我对岗位未来或安全感感到不确定。"],
    labels: ["职场压力较低", "职场压力偏高", "职场压力警报"]
  }),
  createTest({
    id: "work-control",
    name: "工作控制感测试",
    tag: "自主掌控",
    category: "职场",
    audience: "职场人士",
    source: "niosh",
    positive: true,
    description: "观察你对节奏、方法、优先级和资源的掌控程度。",
    questions: ["我能影响自己工作的节奏和安排。", "我清楚哪些任务最重要。", "我有空间选择适合自己的工作方法。", "我能及时获得完成任务所需的信息。", "我可以在负荷过高时沟通调整。", "我知道遇到困难时该找谁支持。", "我的工作目标和评价标准相对清楚。", "我能在工作和生活之间保留基本边界。"],
    labels: ["控制感薄弱", "控制感中等", "控制感稳定"]
  }),
  createTest({
    id: "work-support",
    name: "同事与主管支持测试",
    tag: "职场支持",
    category: "职场",
    audience: "职场人士",
    source: "niosh",
    positive: true,
    description: "评估团队、主管和协作环境是否能提供心理支持。",
    questions: ["遇到困难时，我能得到同事的实际帮助。", "主管愿意听我说明真实负荷。", "团队沟通相对清楚，不需要大量猜测。", "我能在工作中获得基本尊重。", "发生问题时，团队更倾向于解决而不是指责。", "我能表达不同意见而不过度担心被否定。", "我知道哪些人可以提供资源或建议。", "工作关系整体不会持续消耗我。"],
    labels: ["支持不足", "支持可改善", "支持稳定"]
  }),
  createTest({
    id: "burnout-flame",
    name: "工作倦怠测试",
    tag: "职业倦怠",
    category: "职场",
    audience: "职场人士",
    source: "original",
    description: "观察耗竭感、意义感下降和工作距离感。",
    questions: ["想到工作或学习任务，我会先感到疲惫。", "我对原本在意的目标变得麻木。", "休息后也很难恢复工作热情。", "我更容易对人或事失去耐心。", "我觉得自己的付出很难被看见。", "我常在任务前感到抗拒或空掉。", "我开始怀疑这件事是否还有意义。", "我需要硬撑才能完成基本职责。"],
    labels: ["微热火光", "暗燃火光", "熄火警报"]
  }),
  createTest({
    id: "work-boundary",
    name: "工作边界测试",
    tag: "边界恢复",
    category: "职场",
    audience: "职场人士",
    source: "original",
    positive: true,
    description: "检查你是否能拒绝、下班、恢复并保护长期精力。",
    questions: ["我能在非紧急情况下拒绝不合理加塞。", "下班后我能从工作信息里抽离。", "我能分清自己的职责和别人转嫁的责任。", "我会为深度工作留出不被打扰的时间。", "我能在过度消耗前主动提出调整。", "我不会长期用牺牲睡眠来证明负责。", "我能把工作评价和自我价值分开。", "我有固定的恢复方式。"],
    labels: ["边界偏薄", "边界可训练", "边界稳固"]
  }),
  createTest({
    id: "career-fit",
    name: "职业匹配航线测试",
    tag: "职业偏好",
    category: "职场",
    audience: "学生/职场人士",
    source: "original",
    positive: true,
    description: "从兴趣、优势、节奏和价值感观察当前职业匹配度。",
    questions: ["我能在当前方向里使用自己的优势。", "工作或学习内容和我的兴趣有一定连接。", "当前节奏不会长期透支我的身体和关系。", "我能看到继续投入的意义。", "我有机会学习和成长。", "我知道自己不适合哪些环境。", "我能获得与付出相匹配的反馈。", "我愿意为当前方向继续投入一段时间。"],
    labels: ["匹配偏低", "匹配待校准", "匹配较好"]
  }),
  createTest({
    id: "couple-satisfaction",
    name: "夫妻关系满意度测试",
    tag: "关系满意",
    category: "夫妻关系",
    audience: "伴侣/夫妻",
    source: "couple",
    positive: true,
    description: "原创题，观察关系中的满意度、亲密感和共同感。",
    questions: ["我对这段关系整体感到满意。", "我们仍能感到彼此是一个团队。", "我在关系里能被看见和尊重。", "我们有让彼此放松或开心的时刻。", "我愿意把重要事情告诉对方。", "我们对未来还有共同讨论空间。", "即使有冲突，我也相信关系可以修复。", "我在这段关系中仍能保留自己。"],
    labels: ["满意度偏低", "满意度波动", "满意度较好"]
  }),
  createTest({
    id: "couple-communication",
    name: "伴侣沟通质量测试",
    tag: "沟通表达",
    category: "夫妻关系",
    audience: "伴侣/夫妻",
    source: "couple",
    positive: true,
    description: "观察表达需求、倾听、确认和避免攻击的能力。",
    questions: ["我能清楚表达自己的感受和需求。", "对方说话时，我能先听完再回应。", "我们会确认彼此的意思，而不是只靠猜。", "讨论问题时，我们尽量不翻旧账。", "我们能提出具体请求，而不是只抱怨。", "情绪强烈时，我们知道如何暂停。", "我们能为误解或伤害道歉。", "重要议题可以被认真讨论，而不是长期回避。"],
    labels: ["沟通阻塞", "沟通可修复", "沟通顺畅"]
  }),
  createTest({
    id: "couple-conflict-repair",
    name: "冲突修复力测试",
    tag: "冲突修复",
    category: "夫妻关系",
    audience: "伴侣/夫妻",
    source: "couple",
    positive: true,
    description: "看见冲突后的降温、理解、道歉和重新连接能力。",
    questions: ["冲突发生时，我们能避免升级到羞辱或威胁。", "争吵后，我们会找时间重新谈清楚。", "我能承认自己在冲突中的责任。", "对方也愿意为关系修复做一点努力。", "我们能区分问题本身和彼此的人格。", "冲突后，我不会长期用冷暴力惩罚对方。", "我们能总结下次如何避免同样循环。", "修复后，关系能慢慢回到安全状态。"],
    labels: ["修复困难", "修复不稳定", "修复力较好"]
  }),
  createTest({
    id: "couple-attachment",
    name: "亲密安全感测试",
    tag: "亲密依恋",
    category: "夫妻关系",
    audience: "伴侣/夫妻",
    source: "original",
    description: "理解你在亲密关系中的靠近、担心和回避模式。",
    questions: ["对方回复变慢时，我会明显不安。", "我想靠近对方，但又害怕被拒绝。", "我会反复确认对方是否还在乎我。", "冲突后，我很难相信关系仍然安全。", "太亲密时，我有时会想退远一点。", "我不太敢直接表达依赖和需要。", "我会因为怕失去而压下自己的感受。", "关系的不确定会占用我很多精力。"],
    labels: ["安全感较稳", "安全感波动", "安全感警觉"]
  }),
  createTest({
    id: "couple-family-workload",
    name: "家务育儿协作测试",
    tag: "家庭协作",
    category: "夫妻关系",
    audience: "伴侣/夫妻",
    source: "couple",
    positive: true,
    description: "观察家庭责任、育儿、家务和情绪劳动是否相对公平。",
    questions: ["我们能明确分担家务和家庭责任。", "育儿或照顾家人的压力不是长期落在一个人身上。", "对方能看见我在家庭中的隐形付出。", "我们能讨论分工，而不是互相指责。", "工作忙碌时，我们会重新协调责任。", "我能在家庭里获得休息时间。", "我们会共同面对外部家庭压力。", "家庭协作让关系更像团队。"],
    labels: ["协作失衡", "协作待调整", "协作较好"]
  }),
  createTest({
    id: "couple-emotional-response",
    name: "情绪回应测试",
    tag: "情绪支持",
    category: "夫妻关系",
    audience: "伴侣/夫妻",
    source: "couple",
    positive: true,
    description: "评估伴侣之间在脆弱、压力和低落时的回应质量。",
    questions: ["我难过时，对方通常愿意听我说。", "对方表达压力时，我能给予回应而不是立刻评判。", "我们能允许彼此有低谷，而不是要求马上好起来。", "我在关系里表达脆弱时相对安全。", "我们会用拥抱、陪伴或实际行动表达支持。", "我不会长期独自消化关系中的委屈。", "对方能理解我的情绪需求。", "情绪被回应后，我更愿意靠近关系。"],
    labels: ["回应不足", "回应可练习", "回应有温度"]
  }),
  createTest({
    id: "social-anxiety",
    name: "社交潮汐测试",
    tag: "社交焦虑",
    category: "生活状态",
    audience: "成人/学生",
    source: "original",
    description: "观察你在社交场景中的紧张、回避和恢复速度。",
    questions: ["进入陌生人很多的场合时，我会担心自己表现不自然。", "发出消息后，对方迟迟不回会让我反复猜测。", "在小组里表达观点前，我需要很久心理准备。", "我会为了避免尴尬而减少主动邀约或开启话题。", "社交结束后，我容易复盘自己说过的话。", "被他人注视或评价时，我的身体会明显紧绷。", "我想建立关系，但常不知道怎样靠近别人。", "一次不顺利的互动会影响我接下来很久的心情。"],
    labels: ["轻浪社交", "涨潮观察", "高浪防御"]
  }),
  createTest({
    id: "boundary-lagoon",
    name: "边界感测试",
    tag: "人际边界",
    category: "生活状态",
    audience: "成人/学生",
    source: "original",
    positive: true,
    description: "评估你拒绝、表达需求和保护精力的能力。",
    questions: ["我能在不舒服时说出自己的界限。", "拒绝别人后，我仍能允许自己不内疚太久。", "我能区分别人的情绪和我的责任。", "我会在过度消耗前主动停下来。", "我能清楚表达自己能做和不能做的事。", "面对强势的人，我也能保留基本立场。", "我不会为了维持关系长期牺牲自己。", "我能尊重别人边界，也保护自己的边界。"],
    labels: ["边界薄雾", "边界浅湾", "边界灯线"]
  }),
  createTest({
    id: "procrastination-reef",
    name: "拖延暗礁测试",
    tag: "拖延启动",
    category: "生活状态",
    audience: "成人/学生",
    source: "original",
    description: "看见拖延背后的压力、完美主义和启动困难。",
    questions: ["越重要的任务，我越容易迟迟不开始。", "我会等到状态很好时才愿意动手。", "任务一复杂，我就想先做别的小事。", "截止日期临近时，我才会突然进入高压推进。", "我害怕做得不好，所以会推迟开始。", "我常低估任务需要的时间。", "我开始前会过度准备，却迟迟不交付。", "拖延后我会明显自责。"],
    labels: ["顺流启动", "暗礁绕行", "搁浅循环"]
  }),
  createTest({
    id: "body-signal",
    name: "身体信号测试",
    tag: "身心连接",
    category: "生活状态",
    audience: "成人/学生",
    source: "original",
    description: "观察压力和情绪是否正在通过身体发出提醒。",
    questions: ["压力大时，我的身体会明显紧绷或不适。", "我常忽略疲惫，直到身体提醒我。", "我不太能及时分辨饿、累、困或情绪低落。", "我会用硬撑压过身体需要。", "紧张时，我的呼吸会变浅或变急。", "我最近有不明原因的头痛、胃部不适或肌肉紧绷。", "我很少主动做身体放松练习。", "身体不舒服会进一步影响我的情绪。"],
    labels: ["轻声信号", "涨声信号", "警报信号"]
  }),
  createTest({
    id: "life-satisfaction",
    name: "生活满意度测试",
    tag: "生活状态",
    category: "生活状态",
    audience: "成人/学生",
    source: "original",
    positive: true,
    description: "从能量、关系、目标和日常节律看见生活满意度。",
    questions: ["我对最近的生活整体还算满意。", "我每天有一些能让我恢复的小事。", "我能感受到关系中的支持和连接。", "我对未来一段时间有基本期待。", "我的生活节奏大体能被自己掌控。", "我能在压力之外保留兴趣和放松。", "我觉得自己的努力有一定意义。", "我愿意继续照顾现在的自己。"],
    labels: ["低潮生活感", "平潮生活感", "暖潮生活感"]
  }),
  createTest({
    id: "money-security",
    name: "金钱安全感测试",
    tag: "安全感",
    category: "生活状态",
    audience: "成人",
    source: "original",
    description: "观察金钱、未来不确定和安全感之间的关系。",
    questions: ["想到钱和未来，我容易感到紧张。", "即使暂时稳定，我也担心突然失去保障。", "我会因为消费而明显内疚或焦虑。", "我常把收入和自我价值绑在一起。", "我很难安心享受已经拥有的资源。", "财务计划不清楚时，我会回避查看。", "我会因比较收入或生活条件而低落。", "金钱压力会影响我的睡眠或关系。"],
    labels: ["稳币安全感", "潮币安全感", "警币安全感"]
  })
];

const categories = ["全部", "儿童", "青少年", "情绪健康", "职场", "夫妻关系", "生活状态"];
const state = { currentId: null, category: "全部", query: "" };

const list = document.querySelector("#test-list");
const filters = document.querySelector("#test-filters");
const search = document.querySelector("#test-search");
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

function getVisibleTests() {
  const query = state.query.trim().toLowerCase();
  return tests.filter((test) => {
    const inCategory = state.category === "全部" || test.category === state.category;
    const haystack = `${test.name} ${test.tag} ${test.category} ${test.audience} ${test.sourceName} ${test.description}`.toLowerCase();
    return inCategory && (!query || haystack.includes(query));
  });
}

function renderFilters() {
  filters.replaceChildren(
    ...categories.map((category) => {
      const button = createElement("button", "test-filter", category);
      button.type = "button";
      button.dataset.category = category;
      button.classList.toggle("active", state.category === category);
      return button;
    })
  );
}

function renderList() {
  const visibleTests = getVisibleTests();
  if (!visibleTests.length) {
    list.innerHTML = '<p class="form-hint">没有找到对应测试，试试搜索“焦虑”“儿童”“职场”或切换分类。</p>';
    return;
  }
  list.innerHTML = visibleTests
    .map(
      (test) => `
        <button class="test-card" type="button" data-test-id="${test.id}">
          <span>${test.audience} / ${test.sourceType}</span>
          <strong>${test.name}</strong>
          <small>${test.category} / ${test.tag} / ${test.questions.length} 题</small>
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
  document.querySelector("#test-kicker").textContent = `${test.category} / ${test.tag}`;
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
            ${test.choices
              .map(
                (choice) => `
                  <label>
                    <input type="radio" name="q${index}" value="${choice.score}" />
                    <span>${choice.label}</span>
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
    return total + getSelectedScore(test, index);
  }, 0);
}

function getSelectedScore(test, index) {
  const selected = form.querySelector(`input[name="q${index}"]:checked`);
  if (!selected) return 0;
  const value = Number(selected.value);
  if (test.reverse?.includes(index)) {
    const maxChoiceScore = Math.max(...test.choices.map((choice) => choice.score));
    return maxChoiceScore - value;
  }
  return value;
}

function hasCriticalSignal(test) {
  return Boolean(test.criticalIndexes?.some((index) => getSelectedScore(test, index) > 0));
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

function renderSourceInfo(test, result, score) {
  const sourceBlock = createElement("div", "result-source");
  const sourceTitle = createElement("strong", "", "依据来源");
  const sourceCopy = createElement("p", "", `${test.sourceType}：${test.sourceName}。${test.licenseNote}`);
  const modeCopy = createElement("p", "", `计分说明：${test.scoringMode}。本次得分 ${score} / ${test.maxScore}，对应结果为“${result.title}”。`);
  sourceBlock.append(sourceTitle, sourceCopy, modeCopy);
  if (test.sourceUrl && !test.sourceUrl.startsWith("index.html")) {
    const link = createElement("a", "", "查看来源");
    link.href = test.sourceUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    sourceBlock.append(link);
  }
  return sourceBlock;
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
  const criticalSignal = hasCriticalSignal(test);
  const result = test.results.find((item) => score >= item.min && score <= item.max) || test.results.at(-1);
  active.hidden = true;
  resultPanel.hidden = false;
  document.querySelector("#result-title").textContent = result.title;
  document.querySelector("#result-summary").textContent = result.summary;
  document.querySelector("#result-score").textContent = `${score} / ${test.maxScore}`;
  document.querySelector("#result-range").textContent = `${test.name} · ${test.audience}`;
  const advice = document.querySelector("#result-advice");
  const intro = createElement("p", "", "下一步建议：先把结果当成自我观察线索，而不是给自己贴标签。");
  const crisis = createElement("p", "crisis-note", "如果你已经出现伤害自己、伤害他人、失控或无法保证安全的风险，请不要独自停留在网页测试里，请立刻联系身边可信任的人、当地紧急电话或线下医疗/心理危机资源。");
  const adviceItems = [intro, ...result.advice.map((item) => createElement("p", "", item))];
  if (criticalSignal) adviceItems.unshift(crisis);
  advice.replaceChildren(...adviceItems, renderSourceInfo(test, result, score));
  renderConsultMatch(test, score, criticalSignal);
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderConsultMatch(test, score, criticalSignal = false) {
  const title = document.querySelector("#consult-match-title");
  const copy = document.querySelector("#consult-match-copy");
  if (!title || !copy) return;
  if (criticalSignal) {
    title.textContent = "请优先联系现实中的安全支持";
    copy.textContent = "这份结果出现了需要认真对待的安全信号。请立刻联系可信任的人、当地紧急电话或线下医疗/心理危机资源，网页测试不能替代即时帮助。";
    return;
  }
  const highScore = test.positive ? score <= test.maxScore * 0.33 : score >= test.maxScore * 0.67;
  const mediumScore = test.positive ? score <= test.maxScore * 0.67 : score >= test.maxScore * 0.33;
  if (test.category === "儿童") {
    title.textContent = highScore ? "建议家长优先做专业评估" : mediumScore ? "适合家长先做一次倾听梳理" : "适合继续家庭观察";
    copy.textContent = highScore
      ? "儿童结果需要结合年龄、学校和家庭情境解释。建议家长带着持续时间、学校反馈和具体行为，联系儿科、学校心理老师或专业咨询资源。"
      : "这份结果适合帮助家长整理观察重点，不建议让孩子独自承担结论。可以先记录一周，再决定是否进一步求助。";
    return;
  }
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

renderFilters();
renderList();

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderFilters();
  renderList();
});

search.addEventListener("input", () => {
  state.query = search.value;
  renderList();
});

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
