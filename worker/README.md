# 心灵岛屿 Cloudflare Worker

这个 Worker 用于岛上精灵 AI 对话。GitHub Pages 前端不要放任何 AI 密钥或私密配置，所有 AI 调用都通过 Worker 完成。

## 部署步骤

1. 注册或登录 Cloudflare。
2. 创建一个 Worker，并启用 Workers AI binding，变量名使用 `AI`。
3. 将 `companion-worker.js` 的内容粘贴到 Worker。
4. 部署后得到类似 `https://xinling-companion.your-name.workers.dev` 的地址。
5. 在项目根目录 `app.js` 中设置：

```js
const COMPANION_API_URL = "https://xinling-companion.your-name.workers.dev/api/companion";
```

如果 Worker 没有做路径路由，也可以直接填 Worker 根地址：

```js
const COMPANION_API_URL = "https://xinling-companion.your-name.workers.dev";
```

## 安全边界

- 前端和 Worker 都会检测高风险表达。
- 命中危机表达时不调用 AI，直接提示联系紧急电话、医院急诊或可信任的人。
- Worker 回复只用于陪伴和自助整理，不能替代心理咨询、医学诊断或危机干预。
