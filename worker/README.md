# 心灵岛屿 Cloudflare Worker

这个 Worker 用于星潮守护灵 AI 对话、情绪记录、匿名树洞、漂流瓶、预约线索、登录身份检查和后台接口。GitHub Pages 前端不要放任何 AI 密钥、Supabase service role key、管理员密码或私密配置。

## 部署步骤

1. 登录 Cloudflare，创建一个 Worker。
2. 启用 Workers AI binding，变量名必须填写 `AI`。
3. 配置 Worker 环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. 将 `companion-worker.js` 部署到 Worker。
5. 部署后拿到类似 `https://xinling-companion.your-name.workers.dev` 的地址。
6. 在项目根目录 `backend-config.js` 填写公开配置：

```js
window.XINLING_BACKEND_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "你的 anon public key",
  apiBaseUrl: "https://xinling-companion.your-name.workers.dev"
};
```

`backend-config.js` 只能放 Supabase anon public key 和 Worker 地址。`SUPABASE_SERVICE_ROLE_KEY` 只能放在 Cloudflare Worker 环境变量里。

## 登录与管理员初始化

- 客户注册长期开放，默认角色为 `user`。
- 管理员只允许首次初始化：`GET /api/auth/bootstrap-status` 返回 `canBootstrap: true` 时，登录页会显示初始化入口。
- 初始化接口 `POST /api/auth/bootstrap-admin` 需要当前用户已登录，并且系统里没有任何 admin。
- 初始化成功后该账号 role 会变为 `admin`，再次调用初始化接口会失败。

## 前端会请求的接口

- `GET /api/health`
- `GET /api/auth/me`
- `GET /api/auth/bootstrap-status`
- `POST /api/auth/bootstrap-admin`
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

## 安全边界

- Worker 对后台接口做登录校验和角色校验。
- 公开树洞和漂流瓶接口只返回匿名展示字段，不返回邮箱、user_id、昵称或 profile。
- 管理员后台默认只展示线索摘要，不在列表里暴露客户邮箱。
- 普通用户不能自己修改 `profiles.role`；数据库 RLS 和 trigger 会拦截。
- 用户输入会做长度限制，危机内容不会进入公开池。
- 错误信息返回给用户时保持简短，不暴露数据库表名、SQL 细节或密钥。

## AI 排错

- 页面显示“本地陪伴模式”通常是 `backend-config.js` 的 `apiBaseUrl` 为空。
- Worker 可打开但 AI 不回复时，检查 Workers AI binding 是否启用，binding 名称是否为 `AI`。
- 健康检查地址：`/api/health` 应返回 `{ "ok": true }`。
- 当前默认模型是 `@cf/meta/llama-3.1-8b-instruct`，可在 `companion-worker.js` 顶部 `MODEL` 常量中调整。
