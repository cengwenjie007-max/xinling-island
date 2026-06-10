# 心灵岛屿 Cloudflare Worker

这个 Worker 用于岛上精灵 AI 对话。GitHub Pages 前端不要放任何 AI 密钥或私密配置，所有 AI 调用都通过 Worker 完成。

## 部署步骤

1. 注册或登录 Cloudflare。
2. 创建一个 Worker，并启用 Workers AI binding，变量名使用 `AI`。
3. 配置 Worker 环境变量：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

4. 将 `companion-worker.js` 的内容粘贴到 Worker。
5. 部署后得到类似 `https://xinling-companion.your-name.workers.dev` 的地址。
6. 在项目根目录 `backend-config.js` 中设置：

```js
window.XINLING_BACKEND_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "你的 anon public key",
  apiBaseUrl: "https://xinling-companion.your-name.workers.dev"
};
```

前端会请求：

- `/api/companion`
- `/api/moods`
- `/api/tests/sessions`
- `/api/consult-requests`
- `/api/admin/requests`
- `/api/provider/assignments`

## 安全边界

- 前端和 Worker 都会检测高风险表达。
- 命中危机表达时不调用 AI，直接提示联系紧急电话、医院急诊或可信任的人。
- Worker 回复只用于陪伴和自助整理，不能替代心理咨询、医学诊断或危机干预。
