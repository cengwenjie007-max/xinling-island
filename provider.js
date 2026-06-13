const assignmentList = document.querySelector("#provider-assignment-list");
const providerStatus = document.querySelector("#provider-status-text");
const loadAssignmentsButton = document.querySelector("#load-provider-assignments");

const statusLabels = {
  assigned: "已分配",
  contacted: "已联系",
  completed: "已完成",
  unreachable: "无法联系"
};

function setProviderStatus(message) {
  providerStatus.textContent = message;
}

function appendText(parent, tag, text, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}

async function requireProvider() {
  if (!window.XinlingBackend?.isConfigured()) {
    setProviderStatus("后端尚未配置，请先填写 backend-config.js。");
    loadAssignmentsButton.disabled = true;
    return false;
  }
  try {
    const data = await XinlingBackend.getAuthProfile();
    const role = data.profile?.role;
    if (!data.user) {
      setProviderStatus("请先登录服务者或管理员账号。");
      loadAssignmentsButton.disabled = true;
      return false;
    }
    if (role !== "listener" && role !== "admin") {
      setProviderStatus("当前账号不是服务者或管理员，不能查看分配线索。");
      loadAssignmentsButton.disabled = true;
      return false;
    }
    loadAssignmentsButton.disabled = false;
    return true;
  } catch (_error) {
    setProviderStatus("无法确认服务者身份，请检查登录状态和后端配置。");
    loadAssignmentsButton.disabled = true;
    return false;
  }
}

function createStatusButton(assignmentId, nextStatus, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ghost-button";
  button.dataset.id = assignmentId;
  button.dataset.status = nextStatus;
  button.textContent = label;
  return button;
}

function renderAssignments(assignments) {
  if (!assignments.length) {
    const empty = document.createElement("p");
    empty.className = "form-hint";
    empty.textContent = "暂无分配。";
    assignmentList.replaceChildren(empty);
    return;
  }

  const cards = assignments.map((assignment) => {
    const request = assignment.consult_requests || {};
    const card = document.createElement("article");
    card.className = `portal-item ${request.risk_flag ? "urgent" : ""}`;

    appendText(card, "span", `${statusLabels[assignment.status] || assignment.status || "已分配"}${request.risk_flag ? " / 高风险" : ""}`);
    appendText(card, "strong", request.service_type || "服务线索");
    appendText(card, "p", request.topic || "未填写主题");
    appendText(card, "small", request.summary || "暂无摘要");

    const actions = document.createElement("div");
    actions.className = "portal-actions";
    actions.append(
      createStatusButton(assignment.id, "contacted", "已联系"),
      createStatusButton(assignment.id, "completed", "已完成"),
      createStatusButton(assignment.id, "unreachable", "无法联系")
    );
    card.append(actions);
    return card;
  });
  assignmentList.replaceChildren(...cards);
}

async function loadAssignments() {
  if (!(await requireProvider())) return;
  try {
    setProviderStatus("正在加载分配...");
    const data = await XinlingBackend.providerListAssignments();
    const assignments = data.assignments || [];
    renderAssignments(assignments);
    setProviderStatus(`已加载 ${assignments.length} 条分配。`);
  } catch (error) {
    setProviderStatus(error.message || "加载失败，请确认账号权限。");
  }
}

assignmentList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-id][data-status]");
  if (!button) return;
  try {
    button.disabled = true;
    await XinlingBackend.providerUpdateAssignment(button.dataset.id, button.dataset.status);
    await loadAssignments();
  } catch (error) {
    setProviderStatus(error.message || "更新失败。");
    button.disabled = false;
  }
});

loadAssignmentsButton.addEventListener("click", loadAssignments);
requireProvider().then((ok) => {
  if (ok) loadAssignments();
});
