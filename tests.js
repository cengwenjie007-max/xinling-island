const likertFrequency4 = [
  { label: "完全没有", score: 0 },
  { label: "几天", score: 1 },
  { label: "一半以上天数", score: 2 },
  { label: "几乎每天", score: 3 }
];

const pscChoices = [
  { label: "从不", score: 0 },
  { label: "有时", score: 1 },
  { label: "经常", score: 2 }
];

const who5Choices = [
  { label: "完全没有", score: 0 },
  { label: "偶尔", score: 1 },
  { label: "少于一半时间", score: 2 },
  { label: "超过一半时间", score: 3 },
  { label: "大部分时间", score: 4 },
  { label: "一直如此", score: 5 }
];

const nioshChoices = [
  { label: "非常不同意", score: 1 },
  { label: "不同意", score: 2 },
  { label: "同意", score: 3 },
  { label: "非常同意", score: 4 }
];

const csiChoices = [
  { label: "完全不符合", score: 0 },
  { label: "比较不符合", score: 1 },
  { label: "有点不符合", score: 2 },
  { label: "有点符合", score: 3 },
  { label: "比较符合", score: 4 },
  { label: "非常符合", score: 5 }
];

function standardTest(config) {
  const choices = config.choices || likertFrequency4;
  const maxScore = config.maxScore ?? config.questions.length * Math.max(...choices.map((choice) => choice.score));
  return {
    riskLevel: "标准筛查",
    time: `${config.questions.length <= 8 ? 2 : 3} 分钟`,
    choices,
    maxScore,
    ...config
  };
}

const tests = [
  standardTest({
    id: "phq-9",
    name: "PHQ-9 抑郁症状筛查",
    tag: "抑郁筛查",
    category: "情绪健康",
    audience: "成人/青少年",
    standardName: "Patient Health Questionnaire-9",
    standardVersion: "PHQ-9",
    sourceUrl: "https://www.nih.gov/node/19946",
    licenseStatus: "NIH CDE 页面标注 Copyright: No；本站保留来源和非诊断声明。",
    validationNote: "PHQ-9 是国际常用抑郁症状筛查工具，分数反映近两周症状频率和严重程度线索，不能单独诊断。",
    interpretationWarning: "如果第 9 题非 0，需优先处理安全支持，而不是只看总分。",
    scoringMode: "0-3 分频率计分，总分 0-27；常用区间为 0-4、5-9、10-14、15-19、20-27。",
    maxScore: 27,
    criticalIndexes: [8],
    description: "请根据过去两周的真实情况作答。结果用于筛查，不等于诊断。",
    questions: [
      "做事情时兴趣或乐趣明显减少。",
      "感到情绪低落、沮丧或没有希望。",
      "入睡困难、睡不安稳，或睡得过多。",
      "感到疲倦或没有精力。",
      "食欲不佳，或吃得过多。",
      "觉得自己很糟，或觉得自己让自己/家人失望。",
      "难以集中注意力，例如读书、工作或看内容。",
      "动作或说话变慢到别人可能注意到，或相反地坐立不安。",
      "出现过伤害自己，或觉得自己不如离开的想法。"
    ],
    cutoffs: "0-4 极轻微；5-9 轻度；10-14 中度；15-19 中重度；20-27 重度。",
    results: [
      { min: 0, max: 4, title: "极轻微或无明显抑郁症状", summary: "当前分数处于较低区间，适合继续做生活维护和周期性复测。", advice: ["保留睡眠、运动和现实连接。", "如果状态突然变化，及时记录触发因素。", "本结果不排除其他心理困扰。"] },
      { min: 5, max: 9, title: "轻度抑郁相关症状", summary: "近期可能有低落、兴趣下降或精力减少，建议主动照顾。", advice: ["把最困扰的症状写下来。", "减少独自硬撑，和可信任的人说说。", "若持续两周以上或加重，建议咨询专业人员。"] },
      { min: 10, max: 14, title: "中度抑郁相关症状", summary: "分数提示需要进一步评估，尤其当生活功能已经受影响。", advice: ["建议联系心理咨询师、医生或学校/单位支持资源。", "优先稳定睡眠、饮食和日常安排。", "如果出现强烈危机感，请立即联系身边可信任的人或当地紧急资源。"] },
      { min: 15, max: 19, title: "中重度抑郁相关症状", summary: "当前症状可能已经明显影响生活，不建议只依赖自助工具。", advice: ["建议尽快寻求专业评估。", "把持续时间、功能影响和测试结果带给专业人员。", "请让身边可信任的人知道你的状态。"] },
      { min: 20, max: 27, title: "重度抑郁相关症状", summary: "结果提示困扰较重，需要优先获得现实中的专业支持。", advice: ["尽快联系线下医疗或心理专业资源。", "不要独自承受高风险状态。", "如有现实危险或失控感，请立即使用紧急求助资源。"] }
    ]
  }),
  standardTest({
    id: "gad-7",
    name: "GAD-7 广泛性焦虑筛查",
    tag: "焦虑筛查",
    category: "情绪健康",
    audience: "成人/青少年",
    standardName: "Generalized Anxiety Disorder-7",
    standardVersion: "GAD-7",
    sourceUrl: "https://deploymentpsych.org/sites/default/files/member_resource/COP_Toolkit/Metrics_Series-Generalized_Anxiety_Disorder_Scale_GAD.pdf",
    licenseStatus: "公开资料说明 GAD-7 为 public domain；本站保留来源和非诊断声明。",
    validationNote: "GAD-7 是国际常用焦虑筛查工具，常用临界值为 5、10、15。",
    interpretationWarning: "高分代表焦虑症状明显，仍需结合访谈、持续时间和功能受损判断。",
    scoringMode: "0-3 分频率计分，总分 0-21；5/10/15 常用于轻度、中度、重度区间。",
    maxScore: 21,
    description: "请根据过去两周焦虑和担忧的频率作答。",
    questions: [
      "感到紧张、焦虑或急切。",
      "不能停止或控制担忧。",
      "对各种各样的事情担忧过多。",
      "很难放松下来。",
      "坐立不安，难以安静待着。",
      "变得容易烦恼或急躁。",
      "感到好像会发生可怕的事情。"
    ],
    cutoffs: "0-4 极轻微；5-9 轻度；10-14 中度；15-21 重度。",
    results: [
      { min: 0, max: 4, title: "焦虑症状不明显", summary: "当前焦虑分数较低，适合继续维护稳定节律。", advice: ["保持睡眠和运动。", "把偶发担心写成具体问题。", "状态变化时再复测。"] },
      { min: 5, max: 9, title: "轻度焦虑症状", summary: "担心和紧张有所增加，需要主动降低警觉。", advice: ["每天安排短时放松练习。", "区分可控制和不可控制事项。", "减少反复确认和过度搜索。"] },
      { min: 10, max: 14, title: "中度焦虑症状", summary: "分数提示可能需要进一步评估，尤其当睡眠或学习工作受影响。", advice: ["可先预约倾听员梳理压力源。", "如果持续或加重，建议寻求心理咨询。", "把持续时间、触发点和身体反应记录下来。"] },
      { min: 15, max: 21, title: "重度焦虑症状", summary: "焦虑可能已经显著影响生活，建议尽快获得专业支持。", advice: ["优先处理睡眠、身体紧绷和现实安全感。", "联系专业咨询或医疗资源。", "若出现强烈失控感，请立即联系可信任的人或紧急资源。"] }
    ]
  }),
  standardTest({
    id: "who-5",
    name: "WHO-5 幸福感指数",
    tag: "幸福感",
    category: "情绪健康",
    audience: "成人/青少年",
    standardName: "WHO-5 Well-Being Index",
    standardVersion: "WHO-5",
    sourceUrl: "https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01",
    licenseStatus: "WHO-5 资料采用 CC-BY-NC-SA 3.0 IGO；本站署名来源并按非诊断自评展示。",
    validationNote: "WHO-5 是国际常用主观幸福感筛查工具，原始分 0-25 可乘 4 转换为 0-100。",
    interpretationWarning: "低分提示幸福感偏低或需要进一步评估，不能单独诊断抑郁。",
    scoringMode: "0-5 分频率计分，总分 0-25；总分乘 4 可得百分制幸福感分数。",
    choices: who5Choices,
    maxScore: 25,
    positive: true,
    description: "请根据过去两周的感受作答。分数越高代表幸福感越充足。",
    questions: [
      "我感到心情愉快、精神状态良好。",
      "我感到平静和放松。",
      "我感到充满活力、精力充沛。",
      "醒来后，我感到清新且休息充分。",
      "我的日常生活中有让我感兴趣的事情。"
    ],
    cutoffs: "原始分 0-12 常提示幸福感偏低；13-25 表示幸福感相对较好。",
    results: [
      { min: 0, max: 7, title: "幸福感明显偏低", summary: "近期积极感、活力和恢复感偏少，建议认真看见状态。", advice: ["每天安排一件微小但确定的恢复活动。", "减少独处硬撑，寻找可信任的人说说。", "若低分持续，建议寻求专业支持。"] },
      { min: 8, max: 12, title: "幸福感偏低", summary: "你的幸福感资源可能正在被压力或疲惫削弱。", advice: ["记录让你稍微好一点的时刻。", "维护睡眠、饮食和运动。", "一周后复测观察趋势。"] },
      { min: 13, max: 25, title: "幸福感相对稳定", summary: "你近期有一定积极情绪和恢复资源。", advice: ["继续保持让你有活力的习惯。", "把有效经验保存下来。", "状态下滑时及时回到情绪记录。"] }
    ]
  }),
  standardTest({
    id: "psc-17-parent",
    name: "PSC-17 儿童心理社会筛查",
    tag: "家长版",
    category: "儿童/青少年",
    audience: "4-16岁儿童青少年家长",
    standardName: "Pediatric Symptom Checklist-17",
    standardVersion: "PSC-17 Parent",
    sourceUrl: "https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist/",
    licenseStatus: "使用官方 PSC-17 公开资料的维度和计分结构；建议上线前再次确认中文译本授权。",
    validationNote: "PSC-17 用于儿童青少年心理社会问题筛查，包含内化、注意、外化三个分量表。",
    interpretationWarning: "儿童结果必须结合年龄、学校反馈和家长访谈，不能单独诊断。",
    scoringMode: "每题 0-2 分，总分 0-34；常用阳性总分临界为 15，分量表也需参考。",
    choices: pscChoices,
    maxScore: 34,
    description: "请家长根据孩子最近一段时间的表现作答。",
    questions: [
      "孩子容易感到伤心或不开心。",
      "孩子感到没有希望。",
      "孩子情绪低落或对事情兴趣减少。",
      "孩子常常担心。",
      "孩子看起来很容易害怕。",
      "孩子坐不住或过于活跃。",
      "孩子经常分心、注意力不集中。",
      "孩子很难完成一件事情。",
      "孩子做事前不太思考。",
      "孩子学习或做事时容易粗心。",
      "孩子容易和别人争吵。",
      "孩子不听规则或不服从。",
      "孩子不理解别人的感受。",
      "孩子会责怪别人。",
      "孩子会拿不属于自己的东西。",
      "孩子不愿分享或合作。",
      "孩子的这些表现影响了学习、家庭或同伴关系。"
    ],
    subscales: [
      { name: "内化", indexes: [0, 1, 2, 3, 4], cutoff: 5 },
      { name: "注意", indexes: [5, 6, 7, 8, 9], cutoff: 7 },
      { name: "外化", indexes: [10, 11, 12, 13, 14, 15, 16], cutoff: 7 }
    ],
    cutoffs: "总分 15 及以上常提示需要进一步评估；内化 5、注意 7、外化 7 可作为分量表参考。",
    results: [
      { min: 0, max: 14, title: "PSC-17 未达常用阳性临界", summary: "总分低于常用临界，但仍应关注具体分量表和现实功能。", advice: ["继续观察孩子在家庭、学校和同伴中的稳定性。", "如果某一类问题持续突出，可和老师或专业人员沟通。", "本结果不能排除所有心理社会困难。"] },
      { min: 15, max: 34, title: "PSC-17 达到进一步评估区间", summary: "总分达到常用筛查阳性区间，建议结合分量表和现实功能进一步评估。", advice: ["建议家长记录持续时间、学校反馈和具体行为。", "可联系学校心理老师、儿科或儿童青少年心理专业资源。", "不要把结果作为给孩子贴标签的依据。"] }
    ]
  }),
  standardTest({
    id: "psc-17-youth",
    name: "PSC-17 青少年自评筛查",
    tag: "青少年自评",
    category: "儿童/青少年",
    audience: "11-18岁青少年",
    standardName: "Pediatric Symptom Checklist-17 Youth Self Report",
    standardVersion: "PSC-17-Y",
    sourceUrl: "https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist/",
    licenseStatus: "使用官方 PSC-17 公开资料的维度和计分结构；建议上线前再次确认中文译本授权。",
    validationNote: "PSC-17 青少年自评用于筛查内化、注意和外化相关困难。",
    interpretationWarning: "未成年人结果应有监护人或可信任成人参与解释；高困扰时请优先线下支持。",
    scoringMode: "每题 0-2 分，总分 0-34；总分和分量表均为筛查线索。",
    choices: pscChoices,
    maxScore: 34,
    description: "请根据自己最近一段时间的真实感受作答。如果结果让你担心，请告诉可信任的大人。",
    questions: [
      "我经常觉得难过或不开心。",
      "我觉得事情没有希望。",
      "我对原本喜欢的事兴趣减少。",
      "我经常担心。",
      "我很容易害怕。",
      "我很难安静坐着。",
      "我经常分心或注意力不集中。",
      "我很难把事情做完。",
      "我常常没想清楚就行动。",
      "我做事时容易粗心。",
      "我容易和别人争吵。",
      "我不太愿意遵守规则。",
      "我不太能理解别人的感受。",
      "我会把问题怪到别人身上。",
      "我有时会拿不属于自己的东西。",
      "我不太愿意分享或合作。",
      "这些情况影响了我的学习、家庭或同伴关系。"
    ],
    subscales: [
      { name: "内化", indexes: [0, 1, 2, 3, 4], cutoff: 5 },
      { name: "注意", indexes: [5, 6, 7, 8, 9], cutoff: 7 },
      { name: "外化", indexes: [10, 11, 12, 13, 14, 15, 16], cutoff: 7 }
    ],
    cutoffs: "总分 15 及以上常提示需要进一步评估；内化 5、注意 7、外化 7 可作为分量表参考。",
    results: [
      { min: 0, max: 14, title: "PSC-17-Y 未达常用阳性临界", summary: "总分低于常用临界，但如果某些问题持续影响生活，仍值得告诉可信任的大人。", advice: ["观察哪些场景最容易让你不舒服。", "把困扰告诉家长、老师或可信任的人。", "不要只用一次分数评价自己。"] },
      { min: 15, max: 34, title: "PSC-17-Y 达到进一步评估区间", summary: "总分达到筛查阳性区间，建议让可信任成人参与，寻找更正式的支持。", advice: ["不要独自承担结果。", "可以带着结果和具体例子找学校心理老师或专业人员。", "如果你感到不安全，请立刻联系身边可信任的人。"] }
    ]
  }),
  standardTest({
    id: "niosh-job-demands",
    name: "NIOSH 工作需求量表",
    tag: "工作负荷",
    category: "职场",
    audience: "职场人士",
    standardName: "NIOSH Generic Job Stress Questionnaire",
    standardVersion: "Job Demands Short Form",
    sourceUrl: "https://archive.cdc.gov/www_cdc_gov/niosh/topics/workorg/detail088.html",
    licenseStatus: "NIOSH Generic Job Stress Questionnaire 标注 Public Domain。",
    validationNote: "NIOSH 工具用于评估工作组织与压力相关心理社会因素；此处按公开维度做网页短版呈现。",
    interpretationWarning: "工作压力结果应结合岗位、工时、组织制度和健康状态解释。",
    scoringMode: "1-4 分同意度计分；分数越高表示工作需求越高。",
    choices: nioshChoices,
    maxScore: 20,
    description: "评估工作节奏、工作量和时间压力。",
    questions: [
      "我的工作要求我工作得很快。",
      "我的工作要求我非常努力。",
      "我的工作量经常超过可承受范围。",
      "我没有足够时间完成工作。",
      "我经常需要同时处理多个紧急任务。"
    ],
    cutoffs: "本短版用于趋势观察；高分提示工作需求偏高，需结合其他 NIOSH 维度解释。",
    results: [
      { min: 5, max: 10, title: "工作需求较低", summary: "当前工作需求压力相对可控。", advice: ["继续维护节奏和恢复时间。", "观察高峰期是否会明显变化。", "保留有效的任务排序方法。"] },
      { min: 11, max: 15, title: "工作需求偏高", summary: "工作节奏和任务量已经需要主动管理。", advice: ["识别最消耗的任务来源。", "和主管沟通优先级和资源。", "避免长期用睡眠透支换进度。"] },
      { min: 16, max: 20, title: "工作需求很高", summary: "工作需求可能已明显增加压力和倦怠风险。", advice: ["尽快评估工作量、支持和边界。", "寻求组织层面的资源调整。", "如已影响身心健康，建议专业支持。"] }
    ]
  }),
  standardTest({
    id: "niosh-job-control",
    name: "NIOSH 工作控制感量表",
    tag: "控制感",
    category: "职场",
    audience: "职场人士",
    standardName: "NIOSH Generic Job Stress Questionnaire",
    standardVersion: "Job Control Short Form",
    sourceUrl: "https://archive.cdc.gov/www_cdc_gov/niosh/topics/workorg/detail088.html",
    licenseStatus: "NIOSH Generic Job Stress Questionnaire 标注 Public Domain。",
    validationNote: "工作控制感是职业压力研究中的重要心理社会因素。",
    interpretationWarning: "低控制感并不代表个人能力不足，常与岗位设计和组织制度相关。",
    scoringMode: "1-4 分同意度计分；分数越高表示工作控制感越充足。",
    choices: nioshChoices,
    maxScore: 20,
    positive: true,
    description: "评估你对工作节奏、方法和决策的自主程度。",
    questions: [
      "我能决定自己如何完成工作。",
      "我能影响工作的节奏和顺序。",
      "我有机会在工作中使用自己的判断。",
      "我能参与影响自己工作的决定。",
      "我有足够空间选择合适的工作方法。"
    ],
    cutoffs: "本短版用于趋势观察；低分提示工作控制感不足。",
    results: [
      { min: 5, max: 10, title: "工作控制感不足", summary: "你可能缺少对节奏、方法或决策的影响力。", advice: ["优先争取任务优先级和资源信息。", "把不可控事项和可沟通事项分开。", "如果长期低控制且高需求，倦怠风险会增加。"] },
      { min: 11, max: 15, title: "工作控制感中等", summary: "你有一定自主空间，但压力高时可能不够稳定。", advice: ["明确哪些决策可以自己掌握。", "提前沟通关键任务边界。", "保留深度工作的时间块。"] },
      { min: 16, max: 20, title: "工作控制感较好", summary: "你对工作节奏和方法有较好的掌控资源。", advice: ["继续维护自主空间。", "把有效方法沉淀为流程。", "关注工作需求是否同步升高。"] }
    ]
  }),
  standardTest({
    id: "niosh-role-conflict",
    name: "NIOSH 角色冲突量表",
    tag: "角色压力",
    category: "职场",
    audience: "职场人士",
    standardName: "NIOSH Generic Job Stress Questionnaire",
    standardVersion: "Role Conflict Short Form",
    sourceUrl: "https://archive.cdc.gov/www_cdc_gov/niosh/topics/workorg/detail088.html",
    licenseStatus: "NIOSH Generic Job Stress Questionnaire 标注 Public Domain。",
    validationNote: "角色冲突和角色模糊是职业压力研究中的经典风险因素。",
    interpretationWarning: "角色冲突通常需要组织沟通和职责澄清，而不只是个人调节。",
    scoringMode: "1-4 分同意度计分；分数越高表示角色冲突越明显。",
    choices: nioshChoices,
    maxScore: 20,
    description: "评估工作中要求冲突、职责不清和优先级混乱程度。",
    questions: [
      "我经常收到彼此冲突的工作要求。",
      "我必须做一些与岗位目标不一致的事情。",
      "我不清楚哪些任务应该优先完成。",
      "不同人对我的期待常常不一致。",
      "我经常在没有足够说明的情况下承担责任。"
    ],
    cutoffs: "本短版用于趋势观察；高分提示角色冲突或职责模糊偏高。",
    results: [
      { min: 5, max: 10, title: "角色压力较低", summary: "当前职责和优先级相对清楚。", advice: ["继续保留任务确认习惯。", "遇到变化时及时记录新要求。", "保持和关键协作者的沟通。"] },
      { min: 11, max: 15, title: "角色压力偏高", summary: "你可能正在被多重期待拉扯。", advice: ["把冲突要求写下来并确认优先级。", "减少私下独自消化模糊任务。", "向主管或团队请求职责澄清。"] },
      { min: 16, max: 20, title: "角色压力很高", summary: "角色冲突可能已经明显增加压力和无力感。", advice: ["优先推动职责边界和汇报关系清晰化。", "保留书面确认，降低反复返工。", "若压力持续影响身心，可寻求咨询支持。"] }
    ]
  }),
  standardTest({
    id: "niosh-social-support",
    name: "NIOSH 职场支持量表",
    tag: "职场支持",
    category: "职场",
    audience: "职场人士",
    standardName: "NIOSH Generic Job Stress Questionnaire",
    standardVersion: "Social Support Short Form",
    sourceUrl: "https://archive.cdc.gov/www_cdc_gov/niosh/topics/workorg/detail088.html",
    licenseStatus: "NIOSH Generic Job Stress Questionnaire 标注 Public Domain。",
    validationNote: "主管和同事支持是工作压力缓冲因素之一。",
    interpretationWarning: "低支持感常与团队氛围、管理方式和资源配置相关。",
    scoringMode: "1-4 分同意度计分；分数越高表示职场支持越充足。",
    choices: nioshChoices,
    maxScore: 20,
    positive: true,
    description: "评估你在工作中获得主管、同事和团队支持的程度。",
    questions: [
      "主管愿意听我说明工作困难。",
      "主管能提供实际帮助或资源。",
      "同事之间愿意互相支持。",
      "团队沟通相对清楚，不需要大量猜测。",
      "我在工作中能获得基本尊重。"
    ],
    cutoffs: "本短版用于趋势观察；低分提示职场支持不足。",
    results: [
      { min: 5, max: 10, title: "职场支持不足", summary: "你可能缺少来自主管或同事的实际支持。", advice: ["明确你最需要哪一种支持。", "先向最可靠的人提出具体请求。", "长期低支持时，需评估团队和岗位风险。"] },
      { min: 11, max: 15, title: "职场支持中等", summary: "你有一些支持资源，但在高压期可能不够。", advice: ["提前建立协作和反馈机制。", "把支持需求具体化。", "减少只靠个人硬撑。"] },
      { min: 16, max: 20, title: "职场支持较好", summary: "你有较好的团队和主管支持资源。", advice: ["继续维护信任关系。", "在压力上升时主动使用支持资源。", "也要留意自己的边界。"] }
    ]
  }),
  standardTest({
    id: "niosh-job-insecurity",
    name: "NIOSH 工作不安全感量表",
    tag: "工作安全",
    category: "职场",
    audience: "职场人士",
    standardName: "NIOSH Generic Job Stress Questionnaire",
    standardVersion: "Job Insecurity Short Form",
    sourceUrl: "https://archive.cdc.gov/www_cdc_gov/niosh/topics/workorg/detail088.html",
    licenseStatus: "NIOSH Generic Job Stress Questionnaire 标注 Public Domain。",
    validationNote: "工作不安全感与压力、焦虑和职业倦怠相关。",
    interpretationWarning: "结果需要结合行业、组织变化和个人资源判断。",
    scoringMode: "1-4 分同意度计分；分数越高表示工作不安全感越明显。",
    choices: nioshChoices,
    maxScore: 20,
    description: "评估岗位稳定性、未来不确定和职业安全感压力。",
    questions: [
      "我担心未来会失去当前工作。",
      "我对岗位或组织未来缺少安全感。",
      "组织变化让我难以安心工作。",
      "我担心自己的技能无法适应未来要求。",
      "工作不确定性已经影响我的情绪或睡眠。"
    ],
    cutoffs: "本短版用于趋势观察；高分提示工作安全感压力偏高。",
    results: [
      { min: 5, max: 10, title: "工作安全感较稳", summary: "当前工作不确定带来的压力相对较低。", advice: ["继续维护职业资源。", "定期更新简历和技能。", "不要因低风险而完全忽视变化。"] },
      { min: 11, max: 15, title: "工作安全感波动", summary: "不确定性已经开始影响你的心理负荷。", advice: ["把现实风险和想象风险分开。", "制定技能和财务缓冲计划。", "减少反复搜索带来的焦虑放大。"] },
      { min: 16, max: 20, title: "工作不安全感很高", summary: "工作不确定可能已经明显影响身心状态。", advice: ["优先做现实风险盘点。", "寻找职业咨询、同伴或专业支持。", "关注睡眠、焦虑和关系受影响程度。"] }
    ]
  }),
  standardTest({
    id: "csi-4",
    name: "CSI-4 伴侣满意度筛查",
    tag: "伴侣关系",
    category: "夫妻关系",
    audience: "伴侣/夫妻",
    standardName: "Couples Satisfaction Index",
    standardVersion: "CSI-4",
    sourceUrl: "https://couples-research.com/wp-content/uploads/2017/06/CSI-32.docx",
    licenseStatus: "CSI 作者公开提供量表文档；上线前建议再次确认商业网站使用条件。",
    validationNote: "CSI 系列用于评估伴侣关系满意度，短版适合快速筛查，不能替代伴侣治疗评估。",
    interpretationWarning: "关系满意度需要结合双方访谈、冲突模式和安全边界解释。",
    scoringMode: "0-5 分满意度计分，总分 0-20；分数越高代表关系满意度越高。",
    choices: csiChoices,
    maxScore: 20,
    positive: true,
    description: "请根据你对当前伴侣关系的整体感受作答。",
    questions: [
      "整体而言，我对这段伴侣关系感到满意。",
      "这段关系让我感到幸福和被滋养。",
      "我和伴侣之间的关系接近我期待的样子。",
      "如果重新选择，我仍愿意选择这段关系。"
    ],
    cutoffs: "CSI-4 常用于快速筛查关系满意度；低分提示关系困扰或需要进一步评估。",
    results: [
      { min: 0, max: 8, title: "关系满意度偏低", summary: "当前关系满意度较低，建议认真看见关系困扰。", advice: ["先识别最影响关系的一个问题。", "避免只用指责表达需要。", "如有持续冲突、冷暴力或安全风险，建议寻求伴侣咨询或个体支持。"] },
      { min: 9, max: 15, title: "关系满意度中等", summary: "关系仍有资源，但存在需要沟通和修复的区域。", advice: ["安排一次具体议题的温和沟通。", "把需求说成可执行请求。", "必要时可用倾听或咨询帮助双方整理。"] },
      { min: 16, max: 20, title: "关系满意度较高", summary: "你对关系整体满意度较高，适合继续维护连接和修复习惯。", advice: ["继续保持表达感谢和共同时间。", "冲突时优先修复而非胜负。", "把有效相处方式保留下来。"] }
    ]
  })
];

const categories = ["全部", "情绪健康", "儿童/青少年", "职场", "夫妻关系"];
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
    const haystack = `${test.name} ${test.tag} ${test.category} ${test.audience} ${test.standardName} ${test.standardVersion} ${test.description}`.toLowerCase();
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
    list.innerHTML = '<p class="form-hint">没有找到对应标准量表，试试搜索“PHQ”“GAD”“儿童”“职场”。</p>';
    return;
  }
  list.innerHTML = visibleTests
    .map(
      (test) => `
        <button class="test-card" type="button" data-test-id="${test.id}">
          <span>${test.audience} / ${test.standardVersion}</span>
          <strong>${test.name}</strong>
          <small>${test.category} / ${test.questions.length} 题 / ${test.riskLevel}</small>
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
  document.querySelector("#test-kicker").textContent = `${test.category} / ${test.standardVersion}`;
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

function getScore(test) {
  return test.questions.reduce((total, _question, index) => total + getSelectedScore(test, index), 0);
}

function answeredCount(test) {
  return test.questions.filter((_question, index) => form.querySelector(`input[name="q${index}"]:checked`)).length;
}

function hasCriticalSignal(test) {
  return Boolean(test.criticalIndexes?.some((index) => getSelectedScore(test, index) > 0));
}

function getSubscaleLines(test) {
  if (!test.subscales) return [];
  return test.subscales.map((subscale) => {
    const score = subscale.indexes.reduce((total, index) => total + getSelectedScore(test, index), 0);
    const status = score >= subscale.cutoff ? "达到参考临界" : "未达参考临界";
    return `${subscale.name}：${score} 分，${status}`;
  });
}

function updateProgress() {
  const test = getTest(state.currentId);
  const percent = Math.round((answeredCount(test) / test.questions.length) * 100);
  document.querySelector("#progress-bar").style.width = `${percent}%`;
  testAlert.textContent = "";
}

function renderStandardInfo(test, result, score) {
  const sourceBlock = createElement("div", "result-source");
  const sourceTitle = createElement("strong", "", "标准依据与准确程度");
  const standard = createElement("p", "", `${test.standardName}（${test.standardVersion}）。${test.validationNote}`);
  const cutoffs = createElement("p", "", `计分：${test.scoringMode} 临界值：${test.cutoffs}`);
  const current = createElement("p", "", `本次得分 ${score} / ${test.maxScore}，对应结果为“${result.title}”。${test.interpretationWarning}`);
  const license = createElement("p", "", `授权/使用边界：${test.licenseStatus}`);
  const subscaleLines = getSubscaleLines(test).map((line) => createElement("p", "subscale-line", line));
  sourceBlock.append(sourceTitle, standard, cutoffs, current, ...subscaleLines, license);
  if (test.sourceUrl) {
    const link = createElement("a", "", "查看量表来源");
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
  document.querySelector("#result-range").textContent = `${test.standardVersion} · ${test.audience}`;
  const advice = document.querySelector("#result-advice");
  const intro = createElement("p", "", "本报告是标准筛查结果，不是诊断结论。请结合持续时间、现实功能影响和专业评估理解。");
  const crisis = createElement("p", "crisis-note", "如果你已经出现伤害自己、伤害他人、失控或无法保证安全的风险，请不要独自停留在网页测试里，请立刻联系身边可信任的人、当地紧急电话或线下医疗/心理危机资源。");
  const adviceItems = [intro, ...result.advice.map((item) => createElement("p", "", item))];
  if (criticalSignal) adviceItems.unshift(crisis);
  advice.replaceChildren(...adviceItems, renderStandardInfo(test, result, score));
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
  const highScore = test.positive ? score <= test.maxScore * 0.35 : score >= test.maxScore * 0.65;
  const mediumScore = test.positive ? score <= test.maxScore * 0.65 : score >= test.maxScore * 0.35;
  if (test.category === "儿童/青少年") {
    title.textContent = highScore ? "建议监护人参与进一步评估" : mediumScore ? "适合先做一次家长/青少年倾听梳理" : "适合继续观察与复测";
    copy.textContent = highScore
      ? "儿童青少年结果需要结合年龄、学校反馈和家庭情境解释。建议带着分数、持续时间和具体例子，联系学校心理老师、儿科或专业咨询资源。"
      : "这份结果适合整理观察重点，不建议让未成年人独自承担结论。可以记录一周状态，再决定是否进一步求助。";
    return;
  }
  if (highScore) {
    title.textContent = "建议进一步专业评估";
    copy.textContent = "这份标准筛查提示当前议题可能已经明显影响生活。建议带着测试结果、持续时间和最困扰的问题，寻找正规心理咨询或医疗资源。";
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
