const list = document.querySelector("#admin-request-list");
const statusText = document.querySelector("#admin-status-text");
const loadButton = document.querySelector("#load-admin-requests");

function setAdminStatus(message) {
  statusText.textContent = message;
}

function appendText(parent, tag, text, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}

function formatDate(value) {
  if (!value) return "时间未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未知";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

async function requireAdmin() {
  if (!window.XinlingBackend?.isConfigured()) {
    setAdminStatus("后端尚未配置，请先填写 backend-config.js。");
    loadButton.disabled = true;
    return false;
  }
  try {
    const data = await XinlingBackend.getAuthProfile();
    if (!data.user) {
      setAdminStatus("请先登录管理员账号。");
      loadButton.disabled = true;
      return false;
    }
    if (data.profile?.role !== "admin") {
      setAdminStatus("当前账号不是管理员，不能查看预约线索。");
      loadButton.disabled = true;
      return false;
    }
    loadButton.disabled = false;
    return true;
  } catch (_error) {
    setAdminStatus("无法确认管理员身份，请检查登录状态和后端配置。");
    loadButton.disabled = true;
    return false;
  }
}

function renderRequests(requests) {
  if (!requests.length) {
    const empty = document.createElement("p");
    empty.className = "form-hint";
    empty.textContent = "暂无线索。";
    list.replaceChildren(empty);
    return;
  }

  const cards = requests.map((request) => {
    const card = document.createElement("article");
    card.className = `portal-item ${request.risk_flag ? "urgent" : ""}`;

    const meta = document.createElement("span");
    meta.textContent = `${request.status || "new"}${request.risk_flag ? " / 高风险" : ""} / ${formatDate(request.created_at)}`;
    card.append(meta);

    appendText(card, "strong", request.service_type || "服务线索");
    appendText(card, "p", request.topic || "未填写主题");
    appendText(card, "small", request.summary || "暂无摘要");

    const footer = document.createElement("small");
    footer.className = "portal-muted";
    footer.textContent = `来源：${request.source || "site"}`;
    card.append(footer);

    return card;
  });
  list.replaceChildren(...cards);
}

async function loadRequests() {
  if (!(await requireAdmin())) return;
  try {
    setAdminStatus("正在加载线索...");
    const status = document.querySelector("#admin-status").value;
    const risk = document.querySelector("#admin-risk").checked ? "true" : "";
    const data = await XinlingBackend.adminListRequests({ status, risk });
    const requests = data.requests || [];
    renderRequests(requests);
    setAdminStatus(`已加载 ${requests.length} 条线索。`);
  } catch (error) {
    setAdminStatus(error.message || "加载失败，请确认账号权限。");
  }
}

loadButton.addEventListener("click", loadRequests);
requireAdmin().then((ok) => {
  if (ok) loadRequests();
});
