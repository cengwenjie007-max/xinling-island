const statusEl = document.querySelector("#auth-status");

function setStatus(message) {
  statusEl.textContent = message;
}

async function refreshAuthStatus() {
  if (!window.XinlingBackend?.isConfigured()) {
    setStatus("Supabase 或 API 地址尚未配置。请先填写 backend-config.js。");
    return;
  }
  const user = await XinlingBackend.getUser();
  setStatus(user ? `已登录：${user.email}` : "尚未登录。");
}

document.querySelector("#sign-in").addEventListener("click", async () => {
  const email = document.querySelector("#auth-email").value.trim();
  const password = document.querySelector("#auth-password").value;
  try {
    const { error } = await XinlingBackend.signIn(email, password);
    if (error) throw error;
    await refreshAuthStatus();
  } catch (error) {
    setStatus(error.message || "登录失败。");
  }
});

document.querySelector("#sign-up").addEventListener("click", async () => {
  const email = document.querySelector("#auth-email").value.trim();
  const password = document.querySelector("#auth-password").value;
  const nickname = document.querySelector("#auth-nickname").value.trim();
  try {
    const { error } = await XinlingBackend.signUp(email, password, nickname);
    if (error) throw error;
    setStatus("注册成功。如果 Supabase 开启邮箱确认，请先去邮箱完成确认。");
  } catch (error) {
    setStatus(error.message || "注册失败。");
  }
});

document.querySelector("#sign-out").addEventListener("click", async () => {
  await XinlingBackend.signOut();
  await refreshAuthStatus();
});

refreshAuthStatus();
