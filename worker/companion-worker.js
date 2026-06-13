const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const CRISIS_PATTERN = /自杀|想死|不想活|活不下去|伤害自己|伤害别人|结束生命|轻生|割腕|跳楼|没必要活|无法保证安全|撑不下去/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function requiredEnv(env) {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra
  };
}

async function supabaseFetch(env, path, options = {}) {
  if (!requiredEnv(env)) return { error: "Supabase env is not configured.", status: 500 };
  const response = await fetch(`${env.SUPABASE_URL}${path}`, {
    ...options,
    headers: supabaseHeaders(env, options.headers)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return { error: data?.message || data?.error || "Supabase request failed.", status: response.status };
  }
  return { data, status: response.status };
}

async function getCurrentUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) return null;
  return response.json();
}

async function getProfile(env, userId) {
  const result = await supabaseFetch(env, `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,email,nickname,role,status`);
  return result.data?.[0] || null;
}

function publicProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email || "",
    nickname: profile.nickname || "",
    role: profile.role || "user",
    status: profile.status || "active"
  };
}

async function ensureProfileForUser(env, user) {
  const current = await getProfile(env, user.id);
  if (current) return current;
  const row = {
    id: user.id,
    email: user.email || "",
    nickname: user.user_metadata?.nickname || (user.email ? user.email.split("@")[0] : "岛民"),
    role: "user",
    status: "active"
  };
  const result = await supabaseFetch(env, "/rest/v1/profiles", {
    method: "POST",
    body: JSON.stringify([row])
  });
  return result.data?.[0] || null;
}

async function countAdmins(env) {
  const result = await supabaseFetch(env, "/rest/v1/profiles?select=id&role=eq.admin&limit=1");
  if (result.error) return { count: 0, error: result };
  return { count: Array.isArray(result.data) ? result.data.length : 0 };
}

async function handleAuthMe(env, user) {
  if (!user?.id) return json({ user: null, profile: null });
  const profile = await ensureProfileForUser(env, user);
  return json({
    user: {
      id: user.id,
      email: user.email || ""
    },
    profile: publicProfile(profile)
  });
}

async function handleBootstrapStatus(env) {
  const admins = await countAdmins(env);
  if (admins.error) return json({ error: "暂时无法检查管理员状态。" }, admins.error.status || 500);
  return json({ canBootstrap: admins.count === 0, hasAdmin: admins.count > 0 });
}

async function handleBootstrapAdmin(env, user) {
  const authError = requireUser(user);
  if (authError) return authError;
  const admins = await countAdmins(env);
  if (admins.error) return json({ error: "暂时无法初始化管理员。" }, admins.error.status || 500);
  if (admins.count > 0) return json({ error: "管理员已经初始化，入口已关闭。" }, 403);

  const profile = await ensureProfileForUser(env, user);
  if (!profile) return json({ error: "无法创建账号资料，请稍后再试。" }, 500);

  const result = await supabaseFetch(env, `/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ role: "admin", status: "active" })
  });
  if (result.error) return json({ error: "管理员初始化失败。" }, result.status || 500);
  await supabaseFetch(env, "/rest/v1/audit_logs", {
    method: "POST",
    body: JSON.stringify([{ actor_id: user.id, action: "bootstrap_admin", target_table: "profiles", target_id: user.id, metadata: {} }])
  });
  return json({ profile: publicProfile(result.data?.[0]) });
}

function requireUser(user) {
  if (!user?.id) return json({ error: "请先登录。" }, 401);
  return null;
}

async function requireRole(env, user, roles) {
  const authError = requireUser(user);
  if (authError) return { error: authError };
  const profile = await getProfile(env, user.id);
  if (!profile || !roles.includes(profile.role)) return { error: json({ error: "权限不足。" }, 403) };
  return { profile };
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

async function handleCompanion(request, env, user) {
  const payload = await request.json().catch(() => ({}));
  const message = String(payload.message || "").trim().slice(0, 500);
  if (!message) return json({ error: "Message is required" }, 400);
  const safety = CRISIS_PATTERN.test(message) ? "crisis" : "normal";
  if (user?.id) {
    await supabaseFetch(env, "/rest/v1/sprite_chats", {
      method: "POST",
      body: JSON.stringify([{ user_id: user.id, role: "user", content: message, safety }])
    });
  }
  if (safety === "crisis") {
    const reply = crisisReply();
    if (user?.id) {
      await supabaseFetch(env, "/rest/v1/sprite_chats", {
        method: "POST",
        body: JSON.stringify([{ user_id: user.id, role: "assistant", content: reply, safety: "crisis" }])
      });
    }
    return json({ reply, safety: "crisis" });
  }

  const history = sanitizeHistory(payload.history);
  const system = [
    "你是心灵岛屿网站里的星潮守护灵，一个温柔、简短、陪伴型的中文心理自助助手。",
    "你可以帮助用户命名感受、降低压力、提出低门槛下一步。",
    "你不能诊断疾病，不能替代心理咨询、医学诊断或紧急帮助。",
    "遇到危机、自伤、自杀、伤害他人或无法保持安全，必须建议用户立刻联系当地紧急电话、医院急诊或身边可信任的人。",
    "回复控制在 80 到 160 个中文字符，语气温柔、具体，不恐吓，不夸大。"
  ].join("");

  try {
    const result = await env.AI.run(MODEL, {
      messages: [{ role: "system", content: system }, ...history, { role: "user", content: message }],
      max_tokens: 220
    });
    const reply = String(result.response || result.reply || "").trim() || "我听见了。先把呼吸放慢一点，我们只处理眼前最小的一步。";
    if (user?.id) {
      await supabaseFetch(env, "/rest/v1/sprite_chats", {
        method: "POST",
        body: JSON.stringify([{ user_id: user.id, role: "assistant", content: reply, safety: "normal" }])
      });
    }
    return json({ reply, safety: "normal" });
  } catch (_error) {
    return json({ error: "AI service unavailable" }, 503);
  }
}

async function handleMoods(request, env, user) {
  const authError = requireUser(user);
  if (authError) return authError;
  if (request.method === "GET") {
    const result = await supabaseFetch(env, `/rest/v1/mood_entries?user_id=eq.${user.id}&select=*&order=created_at.desc&limit=30`);
    if (result.error) return json({ error: result.error }, result.status);
    return json({ moods: result.data || [] });
  }
  const payload = await request.json().catch(() => ({}));
  const entry = {
    user_id: user.id,
    mood: String(payload.mood || "未命名").slice(0, 20),
    energy: Math.max(1, Math.min(10, Number(payload.energy || 5))),
    note: String(payload.note || "").slice(0, 500)
  };
  const result = await supabaseFetch(env, "/rest/v1/mood_entries", { method: "POST", body: JSON.stringify([entry]) });
  if (result.error) return json({ error: result.error }, result.status);
  return json({ mood: result.data?.[0] });
}

async function handleTestSession(request, env, user) {
  const authError = requireUser(user);
  if (authError) return authError;
  const payload = await request.json().catch(() => ({}));
  const session = {
    user_id: user.id,
    test_id: String(payload.testId || "").slice(0, 80),
    test_name: String(payload.testName || "").slice(0, 120),
    score: Number(payload.score || 0),
    max_score: Number(payload.maxScore || 0),
    result_title: String(payload.resultTitle || "").slice(0, 120),
    risk_flag: Boolean(payload.riskFlag),
    report: payload.report && typeof payload.report === "object" ? payload.report : {}
  };
  const result = await supabaseFetch(env, "/rest/v1/test_sessions", { method: "POST", body: JSON.stringify([session]) });
  if (result.error) return json({ error: result.error }, result.status);
  return json({ session: result.data?.[0] });
}

async function handleConsultRequest(request, env, user) {
  const payload = await request.json().catch(() => ({}));
  const topic = String(payload.topic || "").trim().slice(0, 500);
  if (!topic) return json({ error: "请填写求助主题。" }, 400);
  const riskFlag = Boolean(payload.riskFlag) || CRISIS_PATTERN.test(topic);
  const row = {
    user_id: user?.id || null,
    service_type: String(payload.serviceType || "倾听员陪伴").slice(0, 60),
    topic,
    summary: String(payload.summary || "").slice(0, 800),
    risk_flag: riskFlag,
    source: String(payload.source || "site").slice(0, 50),
    test_session_id: payload.testSessionId || null
  };
  const result = await supabaseFetch(env, "/rest/v1/consult_requests", { method: "POST", body: JSON.stringify([row]) });
  if (result.error) return json({ error: result.error }, result.status);
  return json({ request: result.data?.[0] });
}

async function handleSpriteChatSave(request, env, user) {
  const authError = requireUser(user);
  if (authError) return authError;
  const payload = await request.json().catch(() => ({}));
  const row = {
    user_id: user.id,
    role: payload.role === "assistant" ? "assistant" : "user",
    content: String(payload.content || "").slice(0, 500),
    safety: CRISIS_PATTERN.test(String(payload.content || "")) ? "crisis" : "normal"
  };
  const result = await supabaseFetch(env, "/rest/v1/sprite_chats", { method: "POST", body: JSON.stringify([row]) });
  if (result.error) return json({ error: result.error }, result.status);
  return json({ chat: result.data?.[0] });
}

function normalizeBottleContent(content) {
  return String(content || "").replace(/\s+/g, " ").trim().slice(0, 180);
}

function publicCommunityItem(item) {
  if (!item) return null;
  return {
    islander_no: item.islander_no,
    mood: item.mood || null,
    content: item.content,
    created_at: item.created_at
  };
}

async function handleBottleCreate(request, env, user) {
  const payload = await request.json().catch(() => ({}));
  const content = normalizeBottleContent(payload.content);
  if (!content) return json({ error: "请先写下一句话。" }, 400);
  if (CRISIS_PATTERN.test(content)) {
    return json({
      bottle: null,
      safety: "crisis",
      reply: crisisReply()
    });
  }
  const row = {
    user_id: user?.id || null,
    content,
    mood: String(payload.mood || "").slice(0, 20) || null,
    visibility: "public",
    moderation_status: "approved",
    risk_flag: false
  };
  const result = await supabaseFetch(env, "/rest/v1/drift_bottles", {
    method: "POST",
    body: JSON.stringify([row])
  });
  if (result.error) return json({ error: result.error }, result.status);
  await supabaseFetch(env, "/rest/v1/island_logs", {
    method: "POST",
    body: JSON.stringify([{ ...row, mood: undefined }])
  });
  return json({ bottle: publicCommunityItem(result.data?.[0]), safety: "normal" });
}

async function handleRandomBottle(env) {
  const result = await supabaseFetch(
    env,
    "/rest/v1/drift_bottles?select=islander_no,mood,content,created_at&visibility=eq.public&moderation_status=eq.approved&risk_flag=eq.false&order=created_at.desc&limit=80"
  );
  if (result.error) return json({ error: result.error }, result.status);
  const bottles = result.data || [];
  const bottle = bottles.length ? bottles[Math.floor(Math.random() * bottles.length)] : null;
  return json({ bottle });
}

async function handleMoodWall(request, env, user) {
  if (request.method === "GET") {
    const result = await supabaseFetch(
      env,
      "/rest/v1/mood_wall_posts?select=islander_no,mood,content,created_at&visibility=eq.public&moderation_status=eq.approved&risk_flag=eq.false&order=created_at.desc&limit=24"
    );
    if (result.error) return json({ error: result.error }, result.status);
    return json({ posts: result.data || [] });
  }

  const authError = requireUser(user);
  if (authError) return authError;
  const payload = await request.json().catch(() => ({}));
  const content = normalizeBottleContent(payload.content);
  if (!content) return json({ error: "请先写下一句话。" }, 400);
  if (CRISIS_PATTERN.test(content)) {
    return json({
      post: null,
      safety: "crisis",
      reply: crisisReply()
    });
  }
  const row = {
    user_id: user.id,
    mood: String(payload.mood || "未命名").slice(0, 20),
    content,
    visibility: "public",
    moderation_status: "approved",
    risk_flag: false
  };
  const result = await supabaseFetch(env, "/rest/v1/mood_wall_posts", {
    method: "POST",
    body: JSON.stringify([row])
  });
  if (result.error) return json({ error: result.error }, result.status);
  const post = result.data?.[0];
  return json({
    post: post
      ? {
          islander_no: post.islander_no,
          mood: post.mood,
          content: post.content,
          created_at: post.created_at
        }
      : null,
    safety: "normal"
  });
}

async function handleIslandLogs(env) {
  const result = await supabaseFetch(
    env,
    "/rest/v1/island_logs?select=islander_no,content,created_at&visibility=eq.public&moderation_status=eq.approved&risk_flag=eq.false&order=created_at.desc&limit=8"
  );
  if (result.error) return json({ error: result.error }, result.status);
  return json({ logs: result.data || [] });
}

async function countRows(env, path) {
  const result = await supabaseFetch(env, path);
  if (result.error) return 0;
  return Array.isArray(result.data) ? result.data.length : 0;
}

async function handleStats(env) {
  const today = new Date().toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00.000Z`;
  const [profiles, bottles, moods, wallMoods, requests, moodRows, wallMoodRows] = await Promise.all([
    countRows(env, "/rest/v1/profiles?select=id&limit=1000"),
    countRows(env, "/rest/v1/drift_bottles?select=id&visibility=eq.public&moderation_status=eq.approved&risk_flag=eq.false&limit=1000"),
    countRows(env, `/rest/v1/mood_entries?select=id&created_at=gte.${encodeURIComponent(todayStart)}&limit=1000`),
    countRows(env, `/rest/v1/mood_wall_posts?select=id&visibility=eq.public&moderation_status=eq.approved&risk_flag=eq.false&created_at=gte.${encodeURIComponent(todayStart)}&limit=1000`),
    countRows(env, "/rest/v1/consult_requests?select=id&limit=1000"),
    supabaseFetch(env, `/rest/v1/mood_entries?select=mood&created_at=gte.${encodeURIComponent(todayStart)}&limit=1000`),
    supabaseFetch(env, `/rest/v1/mood_wall_posts?select=mood&visibility=eq.public&moderation_status=eq.approved&risk_flag=eq.false&created_at=gte.${encodeURIComponent(todayStart)}&limit=1000`)
  ]);
  const moodCounts = {};
  [...(moodRows.data || []), ...(wallMoodRows.data || [])].forEach((entry) => {
    const mood = entry.mood || "未命名";
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });
  const total = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
  const moodStats = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([mood, count]) => ({ mood, count, percent: total ? Math.round((count / total) * 100) : 0 }));
  return json({
    source: "cloud",
    stats: {
      islanders: profiles,
      bottles,
      todayMoods: moods + wallMoods,
      consultRequests: requests
    },
    moodStats
  });
}

async function handleAdminRequests(request, env, user, pathname) {
  const role = await requireRole(env, user, ["admin"]);
  if (role.error) return role.error;
  if (request.method === "GET") {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const risk = url.searchParams.get("risk");
    let query = "/rest/v1/consult_requests?select=id,service_type,topic,summary,risk_flag,source,status,created_at,updated_at,assignments(id,status,providers(display_name,title))&order=created_at.desc&limit=100";
    if (status) query += `&status=eq.${encodeURIComponent(status)}`;
    if (risk === "true") query += "&risk_flag=eq.true";
    const result = await supabaseFetch(env, query);
    if (result.error) return json({ error: "线索加载失败，请稍后再试。" }, result.status);
    return json({ requests: result.data || [] });
  }
  const id = pathname.split("/").at(-1);
  const payload = await request.json().catch(() => ({}));
  const providerId = payload.providerId;
  if (!id || !providerId) return json({ error: "缺少线索或服务者 ID。" }, 400);
  const assignment = await supabaseFetch(env, "/rest/v1/assignments", {
    method: "POST",
    body: JSON.stringify([{ consult_request_id: id, provider_id: providerId, status: "assigned" }])
  });
  if (assignment.error) return json({ error: "分配失败，请稍后再试。" }, assignment.status);
  await supabaseFetch(env, `/rest/v1/consult_requests?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "assigned" })
  });
  await supabaseFetch(env, "/rest/v1/audit_logs", {
    method: "POST",
    body: JSON.stringify([{ actor_id: user.id, action: "assign_consult_request", target_table: "consult_requests", target_id: id, metadata: { providerId } }])
  });
  return json({ assignment: assignment.data?.[0] });
}

async function handleProviderAssignments(request, env, user, pathname) {
  const role = await requireRole(env, user, ["listener", "admin"]);
  if (role.error) return role.error;
  const providers = await supabaseFetch(env, `/rest/v1/providers?profile_id=eq.${user.id}&select=id`);
  const providerIds = (providers.data || []).map((provider) => provider.id);
  if (!providerIds.length && role.profile.role !== "admin") return json({ assignments: [] });
  if (request.method === "GET") {
    const filter = role.profile.role === "admin" ? "" : `&provider_id=in.(${providerIds.join(",")})`;
    const result = await supabaseFetch(env, `/rest/v1/assignments?select=id,status,created_at,consult_requests(id,service_type,topic,summary,risk_flag,source,status,created_at),providers(display_name,title)&order=created_at.desc${filter}`);
    if (result.error) return json({ error: "分配加载失败，请稍后再试。" }, result.status);
    return json({ assignments: result.data || [] });
  }
  const id = pathname.split("/").at(-1);
  const payload = await request.json().catch(() => ({}));
  const nextStatus = ["assigned", "contacted", "completed", "unreachable"].includes(payload.status) ? payload.status : "contacted";
  const result = await supabaseFetch(env, `/rest/v1/assignments?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: nextStatus })
  });
  if (result.error) return json({ error: "状态更新失败，请稍后再试。" }, result.status);
  return json({ assignment: result.data?.[0] });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, "");
    const user = await getCurrentUser(request, env);

    try {
      if (pathname === "" || pathname === "/api/health") return json({ ok: true, service: "xinling-island-api" });
      if (pathname === "/api/auth/me" && request.method === "GET") return handleAuthMe(env, user);
      if (pathname === "/api/auth/bootstrap-status" && request.method === "GET") return handleBootstrapStatus(env);
      if (pathname === "/api/auth/bootstrap-admin" && request.method === "POST") return handleBootstrapAdmin(env, user);
      if (pathname === "/api/companion" && request.method === "POST") return handleCompanion(request, env, user);
      if (pathname === "/api/moods") return handleMoods(request, env, user);
      if (pathname === "/api/tests/sessions" && request.method === "POST") return handleTestSession(request, env, user);
      if (pathname === "/api/consult-requests" && request.method === "POST") return handleConsultRequest(request, env, user);
      if (pathname === "/api/sprite-chats" && request.method === "POST") return handleSpriteChatSave(request, env, user);
      if (pathname === "/api/bottles" && request.method === "POST") return handleBottleCreate(request, env, user);
      if (pathname === "/api/bottles/random" && request.method === "GET") return handleRandomBottle(env);
      if (pathname === "/api/mood-wall") return handleMoodWall(request, env, user);
      if (pathname === "/api/island-logs" && request.method === "GET") return handleIslandLogs(env);
      if (pathname === "/api/stats" && request.method === "GET") return handleStats(env);
      if (pathname === "/api/admin/requests" || pathname.startsWith("/api/admin/requests/")) return handleAdminRequests(request, env, user, pathname);
      if (pathname === "/api/provider/assignments" || pathname.startsWith("/api/provider/assignments/")) return handleProviderAssignments(request, env, user, pathname);
      return json({ error: "Not found" }, 404);
    } catch (_error) {
      return json({ error: "Server error" }, 500);
    }
  }
};
