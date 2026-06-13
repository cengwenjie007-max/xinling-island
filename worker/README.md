# 心灵岛屿 Cloudflare Worker

这个 Worker 用于星潮守护灵 AI 对话、情绪记录、匿名树洞、漂流瓶、预约线索和后台接口。GitHub Pages 前端不要放任何 AI 密钥或私密配置，所有 AI 调用都通过 Worker 完成。

## 部署步骤

1. 注册或登录 Cloudflare。
2. 创建一个 Worker，并启用 Workers AI binding，变量名必须填写 `AI`。
3. 配置 Worker 环境变量：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

4. 将 `companion-worker.js` 的内容部署到 Worker。
5. 部署后得到类似 `https://xinling-companion.your-name.workers.dev` 的地址。
6. 在项目根目录 `backend-config.js` 中填写公开配置：

```js
window.XINLING_BACKEND_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "你的 anon public key",
  apiBaseUrl: "https://xinling-companion.your-name.workers.dev"
};
```

`backend-config.js` 没有配置时，网页会自动进入本地陪伴模式，不会显示技术失败文案，也不会调用云端 AI。

## 前端会请求的接口

- `GET /api/health`
- `POST /api/companion`
- `GET|POST /api/moods`
- `GET|POST /api/mood-wall`
- `POST /api/tests/sessions`
- `POST /api/consult-requests`
- `POST /api/bottles`
- `GET /api/bottles/random`
- `GET /api/island-logs`
- `GET /api/stats`
- `GET /api/admin/requests`
- `GET /api/provider/assignments`

## AI 排错

- 如果页面显示“本地陪伴模式”，通常是 `backend-config.js` 的 `apiBaseUrl` 为空。
- 如果页面显示“云端暂未连上”，检查 Worker 是否部署成功，以及 `/api/health` 是否返回 `{ "ok": true }`。
- 如果 Worker 能打开但 AI 不回复，检查 Workers AI binding 是否启用，并且 binding 名称是否为 `AI`。
- 当前默认模型是 `@cf/meta/llama-3.1-8b-instruct`，可在 `companion-worker.js` 顶部 `MODEL` 常量中调整。

## 安全边界

- 前端和 Worker 都会检测高风险表达。
- 命中危机表达时不调用 AI，直接提示联系紧急电话、医院急诊或可信任的人。
- Worker 回复只用于陪伴和自助整理，不能替代心理咨询、医学诊断或危机干预。
