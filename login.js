const statusEl = document.querySelector("#auth-status");
const sessionPanel = document.querySelector("#session-panel");
const sessionRole = document.querySelector("#session-role");
const sessionEmail = document.querySelector("#session-email");
const sessionActions = document.querySelector("#session-actions");
const bootstrapPanel = document.querySelector("#bootstrap-panel");

const roleLabels = {
  user: "客户",
  listener: "服务者",
  admin: "管理员"
};

let canBootstrap = false;

function setStatus(message) {
  statusEl.textContent = message;
}

function normalizeInput(selector, limit = 120) {
  return document.querySelector(selector).value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function setLoading(button, loading) {
  button.disabled = loading;
  button.dataset.loading = loading ? "true" : "false";
}

function friendlyError(error, fallback) {
  const message = String(error?.message || error || "");
  if (/Invalid login credentials/i.test(message)) return "邮箱或密码不正确。";
  if (/Email not confirmed/i.test(message)) return "请先完成邮箱确认，再回来登录。";
  if (/already registered|already been registered|User already registered/i.test(message)) return "这个邮箱已经注册，请直接登录。";
  if (/password/i.test(message)) return "密码不符合要求，请至少设置 6 位，管理员建议 8 位以上。";
  return fallback;
}

function createActionLink(label, href) {
  const link = document.createElement("a");
  link.className = "ghost-button";
  link.href = href;
  link.textContent = label;
  return link;
}

function renderSession(profile, user) {
  sessionActions.replaceChildren();

  if (!user) {
    sessionPanel.hidden = true;
    return;
  }

  const role = profile?.role || "user";
  sessionPanel.hidden = false;
  sessionRole.textContent = roleLabels[role] || "客户";
  sessionEmail.textContent = user.email || "已登录账号";

  sessionActions.append(createActionLink("回到首页", "index.html"));
  sessionActions.append(createActionLink("心理测试", "tests.html"));
  if (role === "listener" || role === "admin") {
    sessionActions.append(createActionLink("服务者后台", "provider.html"));
  }
  if (role === "admin") {
    sessionActions.append(createActionLink("管理员后台", "admin.html"));
  }
}

async function refreshAuthStatus() {
  if (!window.XinlingBackend?.hasSupabase()) {
    setStatus("后端还没有配置：请先在 backend-config.js 填入 Supabase URL、anon key 和 Worker 地址。");
    bootstrapPanel.hidden = true;
    renderSession(null, null);
    return;
  }

  if (!window.XinlingBackend.hasApi()) {
    const user = await XinlingBackend.getUser();
    bootstrapPanel.hidden = true;
    renderSession(null, user);
    setStatus(user ? "已登录，但 Worker 地址尚未配置；云端 API 功能暂不可用。" : "Supabase 已配置，但 Worker 地址尚未配置；客户可注册登录，后台入口暂不可用。");
    return;
  }

  try {
    const [bootstrap, auth] = await Promise.all([
      XinlingBackend.getBootstrapStatus().catch(() => ({ canBootstrap: false, hasAdmin: true })),
      XinlingBackend.getAuthProfile().catch(async () => {
        const user = await XinlingBackend.getUser();
        return { user, profile: null };
      })
    ]);
    canBootstrap = Boolean(bootstrap.canBootstrap);
    bootstrapPanel.hidden = !canBootstrap;
    renderSession(auth.profile, auth.user);

    if (auth.user) {
      const roleText = roleLabels[auth.profile?.role || "user"] || "客户";
      setStatus(`已登录：${auth.user.email || "当前账号"}，身份为${roleText}。`);
      return;
    }
    setStatus(canBootstrap ? "系统还没有管理员。你可以先初始化管理员，客户注册仍会保留。" : "尚未登录。客户可注册普通账号，后台入口仅在对应角色登录后显示。");
  } catch (_error) {
    bootstrapPanel.hidden = true;
    setStatus("暂时无法连接后端。请检查 backend-config.js、Worker 地址和 Supabase 配置。");
  }
}

async function signInFrom(selectorPrefix) {
  const email = normalizeInput(`${selectorPrefix}-email`);
  const password = document.querySelector(`${selectorPrefix}-password`).value;
  if (!email || !password) {
    setStatus("请填写邮箱和密码。");
    return false;
  }
  const { error } = await XinlingBackend.signIn(email, password);
  if (error) throw error;
  await refreshAuthStatus();
  return true;
}

async function signUpAccount(email, password, nickname) {
  if (!email || !password) throw new Error("请填写邮箱和密码。");
  const { error, data } = await XinlingBackend.signUp(email, password, nickname);
  if (error) throw error;
  return data;
}

document.querySelector("#sign-in").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    setLoading(button, true);
    await signInFrom("#login");
    setStatus("登录成功，欢迎回到心灵岛屿。");
  } catch (error) {
    setStatus(friendlyError(error, "登录失败，请检查邮箱和密码。"));
  } finally {
    setLoading(button, false);
  }
});

document.querySelector("#customer-sign-up").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const nickname = normalizeInput("#register-nickname", 30);
  const email = normalizeInput("#register-email");
  const password = document.querySelector("#register-password").value;
  try {
    setLoading(button, true);
    await signUpAccount(email, password, nickname);
    setStatus("客户注册已提交。若开启邮箱确认，请先去邮箱完成确认；否则可以直接登录。");
    await refreshAuthStatus();
  } catch (error) {
    setStatus(friendlyError(error, "注册失败，请稍后再试。"));
  } finally {
    setLoading(button, false);
  }
});

document.querySelector("#bootstrap-admin").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  if (!canBootstrap) {
    setStatus("管理员已经初始化，入口已关闭。");
    return;
  }
  const nickname = normalizeInput("#bootstrap-nickname", 30);
  const email = normalizeInput("#bootstrap-email");
  const password = document.querySelector("#bootstrap-password").value;
  try {
    setLoading(button, true);
    await signUpAccount(email, password, nickname || "站长");
    const user = await XinlingBackend.getUser();
    if (!user) {
      setStatus("管理员账号已注册。若开启邮箱确认，请确认邮箱后登录，再点击“使用当前登录账号初始化”。");
      return;
    }
    await XinlingBackend.bootstrapAdmin();
    setStatus("管理员初始化成功。入口已关闭，请进入管理员后台。");
    await refreshAuthStatus();
  } catch (error) {
    if (/already registered|already been registered|User already registered/i.test(String(error?.message || ""))) {
      setStatus("这个邮箱已经注册。请先用该账号登录，再点击“使用当前登录账号初始化”。");
    } else {
      setStatus(friendlyError(error, "管理员初始化失败，请检查配置后再试。"));
    }
  } finally {
    setLoading(button, false);
  }
});

document.querySelector("#bootstrap-current").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  if (!canBootstrap) {
    setStatus("管理员已经初始化，入口已关闭。");
    return;
  }
  try {
    setLoading(button, true);
    await XinlingBackend.bootstrapAdmin();
    setStatus("当前账号已初始化为管理员。");
    await refreshAuthStatus();
  } catch (error) {
    setStatus(friendlyError(error, "初始化失败：请先登录你要作为管理员的账号。"));
  } finally {
    setLoading(button, false);
  }
});

document.querySelector("#sign-out").addEventListener("click", async () => {
  await XinlingBackend.signOut();
  setStatus("已经退出登录。");
  await refreshAuthStatus();
});

refreshAuthStatus();
