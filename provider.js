const assignmentList = document.querySelector("#provider-assignment-list");
const providerStatus = document.querySelector("#provider-status-text");

function setProviderStatus(message) {
  providerStatus.textContent = message;
}

function renderAssignments(assignments) {
  if (!assignments.length) {
    assignmentList.replaceChildren(Object.assign(document.createElement("p"), { className: "form-hint", textContent: "暂无分配。" }));
    return;
  }
  assignmentList.replaceChildren(
    ...assignments.map((assignment) => {
      const request = assignment.consult_requests || {};
      const card = document.createElement("article");
      card.className = `portal-item ${request.risk_flag ? "urgent" : ""}`;
      card.innerHTML = `
        <span>${assignment.status}${request.risk_flag ? " / 高风险" : ""}</span>
        <strong>${request.service_type || "服务线索"}</strong>
        <p>${request.topic || "未填写主题"}</p>
        <small>${request.summary || "暂无摘要"}</small>
        <div class="portal-actions">
          <button type="button" class="ghost-button" data-status="contacted" data-id="${assignment.id}">已联系</button>
          <button type="button" class="ghost-button" data-status="completed" data-id="${assignment.id}">已完成</button>
          <button type="button" class="ghost-button" data-status="unreachable" data-id="${assignment.id}">无法联系</button>
        </div>
      `;
      return card;
    })
  );
}

async function loadAssignments() {
  if (!window.XinlingBackend?.isConfigured()) {
    setProviderStatus("后端尚未配置，请先填写 backend-config.js。");
    return;
  }
  try {
    setProviderStatus("正在加载分配...");
    const data = await XinlingBackend.providerListAssignments();
    renderAssignments(data.assignments || []);
    setProviderStatus(`已加载 ${(data.assignments || []).length} 条分配。`);
  } catch (error) {
    setProviderStatus(error.message || "加载失败，请确认账号是 listener 或 admin。");
  }
}

assignmentList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-id][data-status]");
  if (!button) return;
  try {
    await XinlingBackend.providerUpdateAssignment(button.dataset.id, button.dataset.status);
    await loadAssignments();
  } catch (error) {
    setProviderStatus(error.message || "更新失败。");
  }
});

document.querySelector("#load-provider-assignments").addEventListener("click", loadAssignments);
loadAssignments();
