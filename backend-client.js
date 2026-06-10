(function () {
  const config = window.XINLING_BACKEND_CONFIG || {};
  const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const client = hasSupabase ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

  function isConfigured() {
    return Boolean(client && config.apiBaseUrl);
  }

  async function getSession() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session || null;
  }

  async function getUser() {
    const session = await getSession();
    return session?.user || null;
  }

  async function signIn(email, password) {
    if (!client) throw new Error("Supabase 尚未配置。");
    return client.auth.signInWithPassword({ email, password });
  }

  async function signUp(email, password, nickname) {
    if (!client) throw new Error("Supabase 尚未配置。");
    return client.auth.signUp({
      email,
      password,
      options: { data: { nickname } }
    });
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
  }

  async function apiFetch(path, options = {}) {
    if (!isConfigured()) throw new Error("后端 API 尚未配置。");
    const session = await getSession();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      ...options,
      headers
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `API 请求失败：${response.status}`);
    return data;
  }

  async function saveMood(entry) {
    return apiFetch("/api/moods", { method: "POST", body: JSON.stringify(entry) });
  }

  async function listMoods() {
    return apiFetch("/api/moods");
  }

  async function saveTestSession(session) {
    return apiFetch("/api/tests/sessions", { method: "POST", body: JSON.stringify(session) });
  }

  async function createConsultRequest(request) {
    return apiFetch("/api/consult-requests", { method: "POST", body: JSON.stringify(request) });
  }

  async function saveSpriteChat(message) {
    return apiFetch("/api/sprite-chats", { method: "POST", body: JSON.stringify(message) });
  }

  async function adminListRequests(filters = {}) {
    const query = new URLSearchParams(filters);
    return apiFetch(`/api/admin/requests?${query}`);
  }

  async function adminAssignRequest(requestId, providerId) {
    return apiFetch(`/api/admin/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ providerId })
    });
  }

  async function providerListAssignments() {
    return apiFetch("/api/provider/assignments");
  }

  async function providerUpdateAssignment(assignmentId, status) {
    return apiFetch(`/api/provider/assignments/${assignmentId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  }

  window.XinlingBackend = {
    client,
    isConfigured,
    getSession,
    getUser,
    signIn,
    signUp,
    signOut,
    apiFetch,
    saveMood,
    listMoods,
    saveTestSession,
    createConsultRequest,
    saveSpriteChat,
    adminListRequests,
    adminAssignRequest,
    providerListAssignments,
    providerUpdateAssignment
  };
})();
