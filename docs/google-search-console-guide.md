# Google Search Console 收录指南（Google Search Indexing Guide）

> 站点：https://ai-model-platform-my5.pages.dev（7 语言 / 8716 页静态站）
> API：https://ai-model-platform-api.crazynotesman.workers.dev（动态数据，无需收录）
> 更新时间：2026-08-05

## 0. 收录前置条件（已就绪 ✅）

| 项 | 状态 | 说明 |
| --- | --- | --- |
| robots.txt | ✅ | 允许全部爬取 + Sitemap 声明 |
| sitemap-index.xml | ✅ | 引用 sitemap-0.xml（8715 个 URL） |
| canonical | ✅ | 每页指向自身（pages.dev 域名） |
| hreflang | ✅ | 7 语言互链（8 个 link 标签） |
| 结构化数据 | ✅ | 首页 Organization + 模型页 Product/Offer JSON-LD |
| 404 处理 | ⚠️ | `_redirects` 已配置无效路径→404；SPA fallback 平台设置可选关闭（见 §4） |

## 1. 验证站点所有权（必需，Google 账号操作）

1. 打开 [Google Search Console](https://search.google.com/search-console)（用您的 Google 账号登录）
2. 点击「**添加资源**」→ 选择「**网址前缀**」
3. 输入：`https://ai-model-platform-my5.pages.dev`
4. 选择验证方式（推荐 **HTML 文件**）：
   - 下载 Google 提供的 `google<hash>.html` 验证文件
   - **把该文件发送给 AI 助手**（放到站点根目录 `frontend/public/` 并部署），或自行放入后触发重新部署
   - 验证文件 URL：`https://ai-model-platform-my5.pages.dev/google<hash>.html`
   - 在 Search Console 点击「验证」
5. 备选验证方式：**HTML 标记**（meta tag 加入首页 `<head>`，需代码改动；或 **DNS 记录**（需 pages.dev 域名管理权限，不推荐）

## 2. 提交 Sitemap

1. Search Console → 左侧「**Sitemap**」
2. 输入：`sitemap-index.xml`
3. 点击「提交」
4. 状态显示「成功」即完成；之后 Google 会自动抓取全部 8715 个 URL

## 3. 请求编入索引（可选加速）

- 首页：Search Console 顶部搜索栏输入 `https://ai-model-platform-my5.pages.dev/` → 点击「**请求编入索引**」
- 重点页面（如 `/en/models/`、`/en/models/openai/gpt-4o/`）可逐个提交（每日配额有限，建议只提交核心页，其余靠 sitemap）
- Google 收录节奏通常：sitemap 提交后 1–14 天开始抓取，完整收录需要数周

## 4. 可选优化（按需）

- **关闭 SPA fallback（软 404）**：Cloudflare Dashboard → Pages → `ai-model-platform` → Settings → 部署配置中若有 "Single-page application" 选项请关闭；API 暂不支持修改（2026-08 实测）。影响很小（无效 URL 不在 sitemap），但关闭后无效路径返回真 404，更规范。
- **Google Indexing API（大批量主动提交）**：需创建 GCP Service Account + 在 Search Console 添加权限，可将提交脚本接入 CI。需要时向 AI 助手提供凭据即可搭建。
- **自定义域名**：绑定自有域名后需重新验证 + 更新 canonical（当前 pages.dev 域名，无需操作）。

## 5. 收录效果监测

- Search Console →「效果」：展示点击/展示量/平均排名（提交后 1–2 天开始有数据）
- Search Console →「索引编制」→「网页」：查看已收录/未收录页面及原因
- 站点每日 Cron 快照（排名/资讯）不受影响；Google 抓取频率由站点权重决定，前期建议每周查看一次

## 6. 常见问题

- **为什么 sitemap 显示"无法获取"**：确认 URL 是 `https://ai-model-platform-my5.pages.dev/sitemap-index.xml`（无 www、无尾斜杠），且验证所有权已通过
- **页面未收录**：等待 1–2 周；用「网址检查」工具逐页查看状态（"已抓取-当前未编入索引"多为正常排队）
- **多语言收录**：hreflang 已配置，Google 会按用户语言选择展示版本，7 语言都会被收录
- **compare 页面**：8000+ 组合页全部在 sitemap 中可收录；如需控制规模可改为热门组合（见模型扩充说明）
