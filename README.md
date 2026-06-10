# 心灵岛屿

写意动漫风格的心理网站，包含首页、国际标准量表测试中心、AI 岛上精灵，以及 Supabase + Cloudflare Workers 后端骨架。

## 页面

- `index.html`：网站首页
- `tests.html`：心理测试中心
- `tests.js`：站内测试题库、计分与结果逻辑
- `styles.css`：视觉样式
- `login.html`：用户登录/注册
- `admin.html`：管理员线索后台
- `provider.html`：倾听员/咨询师工作台
- `backend-config.js`：Supabase 与 API 地址配置
- `supabase/schema.sql`：数据库表、RLS 权限和触发器
- `worker/companion-worker.js`：Cloudflare Worker API 网关与 AI 精灵接口

## GitHub Pages

这是纯静态网站，可直接通过 GitHub Pages 从 `main` 分支根目录发布。

## 后端配置

1. 创建 Supabase 项目。
2. 在 Supabase SQL Editor 执行 `supabase/schema.sql`。
3. 在 `backend-config.js` 填写：

```js
window.XINLING_BACKEND_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "你的 anon public key",
  apiBaseUrl: "https://你的-worker.workers.dev"
};
```

4. 创建 Cloudflare Worker，部署 `worker/companion-worker.js`。
5. 给 Worker 配置环境变量：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Workers AI binding：`AI`

第一版以后端线索转化为主：用户登录后可保存情绪、测试结果、AI 精灵对话摘要、匿名漂流瓶和预约线索；管理员可查看线索，倾听员/咨询师可查看被分配线索。

## 社区留存接口

Worker 额外提供这些轻量社区接口，后端未配置时前端会自动使用本机数据：

- `POST /api/bottles`：投递匿名漂流瓶，高风险内容不会进入公开池。
- `GET /api/bottles/random`：随机收到一只公开漂流瓶。
- `GET /api/island-logs`：读取公开岛民日志。
- `GET /api/stats`：读取累计登岛者、漂流瓶、今日心情和预约线索统计。

对应 Supabase 表包括 `drift_bottles`、`island_logs`，并保留 `visibility`、`moderation_status`、`risk_flag` 作为公开展示和审核边界。

## 初始化管理员

注册第一个账号后，在 Supabase SQL Editor 手动把它设为管理员：

```sql
update public.profiles
set role = 'admin'
where email = '你的邮箱@example.com';
```

创建倾听员/咨询师账号后，可将其角色设为 `listener`，再在 `providers` 表添加服务者资料。
