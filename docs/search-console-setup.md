# Google Search Console Setup

- **Date**: 2026-08-10
- **Site**: https://aimodel.100ideas.net

## Property（资源类型）

### 推荐：Domain Property
- 值：`aimodel.100ideas.net`
- 优点：一次验证覆盖该域名下所有子域名/协议（http/https、www、根域），无需重复验证

### 备用：URL Prefix
- 值：`https://aimodel.100ideas.net/`
- 说明：若仅需精确 https:// 前缀（本场景够用）；两个资源类型可同时添加

## Verification（验证方式）

### 方式 A：HTML 文件（推荐，最快）
1. Search Console → 添加资源 → 选择验证方式 → **HTML 文件**
2. 下载 `google<hash>.html` 并发送给开发助手 → 部署到站点根目录（已验证文件 URL：`https://aimodel.100ideas.net/google66c05094a2cab20f.html`——该文件当前已在站点根目录可访问，如变更则需重新部署）
3. 在 Search Console 点击「验证」

### 方式 B：DNS TXT
1. 选择「其他验证方法」→ DNS TXT 记录
2. 在 100ideas.net 域名 DNS 管理中添加 TXT 记录（值由 Search Console 提供）
3. 等待 DNS 生效后点击「验证」
4. 优点：验证一次长期有效，不依赖部署

### 方式 C：HTML 标记（meta tag）
- 在首页 `<head>` 加 `<meta name="google-site-verification" content="...">`（需代码改动 + 重新部署）

## Sitemap（提交）

1. Search Console → 左侧 **Sitemaps**
2. 输入：`sitemap-index.xml`
3. 提交后状态显示「成功」

> 站点 sitemap：`https://aimodel.100ideas.net/sitemap-index.xml` → `sitemap-0.xml`（8,715 个 URL，7 语言）

## 验证后动作

- 提交核心页「请求编入索引」（见 `priority-index-pages.md`）
- 等待 1–14 天开始抓取；「效果」报表 1–2 天内有数据
- 每周查看「索引编制」状态
