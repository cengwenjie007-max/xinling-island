const list = document.querySelector("#admin-request-list");
const statusText = document.querySelector("#admin-status-text");

function setAdminStatus(message) {
  statusText.textContent = message;
}

function renderRequests(requests) {
  if (!requests.length) {
    list.replaceChildren(Object.assign(document.createElement("p"), { className: "form-hint", textContent: "暂无线索。" }));
    return;
  }
  list.replaceChildren(
    ...requests.map((request) => {
      const card = document.createElement("article");
      card.className = `portal-item ${request.risk_flag ? "urgent" : ""}`;
      card.innerHTML = `
        <span>${request.status}${request.risk_flag ? " / 高风险" : ""}</span>
        <strong>${request.service_type}</strong>
        <p>${request.topic || "未填写主题"}</p>
        <small>${request.summary || "暂无摘要"}</small>
      `;
      return card;
    })
  );
}

async function loadRequests() {
  if (!window.XinlingBackend?.isConfigured()) {
    setAdminStatus("后端尚未配置，请先填写 backend-config.js。");
    return;
  }
  try {
    setAdminStatus("正在加载线索...");
    const status = document.querySelector("#admin-status").value;
    const risk = document.querySelector("#admin-risk").checked ? "true" : "";
    const data = await XinlingBackend.adminListRequests({ status, risk });
    renderRequests(data.requests || []);
    setAdminStatus(`已加载 ${(data.requests || []).length} 条线索。`);
  } catch (error) {
    setAdminStatus(error.message || "加载失败，请确认账号是 admin。");
  }
}

document.querySelector("#load-admin-requests").addEventListener("click", loadRequests);
loadRequests();
