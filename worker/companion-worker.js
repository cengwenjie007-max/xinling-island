const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const CRISIS_PATTERN = /自杀|想死|不想活|活不下去|伤害自己|伤害别人|结束生命|轻生|割腕|跳楼|没必要活|无法保证安全|撑不下去/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function crisisReply() {
  return "我很在意你现在的安全。请立刻联系身边可信任的人、当地紧急电话或医院急诊；如果可以，请现在走到有人在的地方，不要独自承受。网页 AI 不能替代即时危机帮助。";
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
    .slice(-6)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 500)
    }));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (_error) {
      return json({ error: "Invalid JSON" }, 400);
    }

    const message = String(payload.message || "").trim().slice(0, 500);
    if (!message) {
      return json({ error: "Message is required" }, 400);
    }
    if (CRISIS_PATTERN.test(message)) {
      return json({ reply: crisisReply(), safety: "crisis" });
    }

    const history = sanitizeHistory(payload.history);
    const system = [
      "你是心灵岛屿网站里的萤火精灵，一个温柔、简短、陪伴型的中文心理自助助手。",
      "你可以帮助用户命名感受、降低压力、提出低门槛下一步。",
      "你不能诊断疾病，不能替代心理咨询、医学诊断或紧急帮助。",
      "遇到危机、自伤、自杀、伤害他人或无法保持安全，必须建议用户立刻联系当地紧急电话、医院急诊或身边可信任的人。",
      "回复控制在 80 到 160 个中文字符，语气温柔、具体，不恐吓，不夸大。"
    ].join("");

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: message }
        ],
        max_tokens: 220
      });
      const reply = String(result.response || result.reply || "").trim();
      return json({
        reply: reply || "我听见了。先把呼吸放慢一点，我们只处理眼前最小的一步。",
        safety: "normal"
      });
    } catch (_error) {
      return json({ error: "AI service unavailable" }, 503);
    }
  }
};
