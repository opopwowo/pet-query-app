# CLAUDE.md — 開發指引（給 AI 與工程師）

> 動手前先讀 [`docs/`](./docs/README.md)。本檔是**護欄**：任何新功能/架構/資料/UI 都必須先符合使命。

## 我們在做什麼

**AI Powered Pet Management Platform（寵伴 Platform，暫名）** —— 台灣寵物產業的數位基礎平台，
讓合法業者每天使用，記錄一隻寵物的一生（出生→血統→配種→晶片→官方→健康→合約→終身）。
不是晶片查詢工具、不是 PWA 外殼、不是聊天機器人。

## 五條鐵律

1. **通用優先**：為 90%+ 業者設計標準流程；特殊需求走設定/權限/模組/Plugin，**不寫死單店**。
2. **Single Source of Truth**：資料只輸入一次，全系統共用。
3. **多租戶是地基**：Tenant / RBAC / Audit / RLS / Subscription 從第一天就在。
4. **合法官方同步**：只協助/比對/引導；**不繞驗證碼、不模擬登入、不存官方密碼**；使用者本人送出。
5. **長期演進 > 短期完成**：可維護、可擴充、可測試、合規優先。

## 新功能前的自我檢查（任一為否 → 重新設計）

- 能支撐未來 1000 家店共用嗎？
- 容易測試、容易維護嗎？
- 符合 Clean Architecture / DDD / Enterprise SaaS 嗎？
- 是否具長期價值、適合成為所有客戶的標準功能？
- 是否符合多租戶隔離與稽核？

## 技術基準（詳見 docs）

- 全棧 **TypeScript**；**Cloudflare**（Workers/Pages/R2/KV/Queues/DO/Cron）+ **Postgres(Neon)+Hyperdrive**。
- 架構：**Modular Monolith + DDD + Clean Architecture**；**Repository Pattern + DI**。
- 前端：**React + Vite + TanStack + Radix + Tailwind**；自建 Design System（延用現有深色/無障礙 tokens）。
- 資料：UUID v7、`tenant_id` + **RLS**、Soft delete、Audit log、UTC 時間、numeric 金額。
- API：`/v1` REST、游標分頁、Zod→OpenAPI、Idempotency、Rate limit、Webhook。
- 無障礙：**WCAG 2.2 AA**；安全：PDPA 個資、最小權限、縱深防禦。

## 現況與紅線

- 線上仍是既有靜態 PWA（`index/registry/stats.html` + `sw.js` + `app.js`）。**平台為新建，不是改這幾頁。**
- 目前處於 **設計審查階段**：`docs/` 為 Proposed。**未經批准不重構、不改現有功能。**
- 可複用資產：CSS design tokens（深/淺色）、無障礙模式、SW 更新策略、官方合規精神。

## 目錄（平台化後）

`apps/api`（Worker）· `apps/web`（Console）· `apps/portal`（飼主）·
`packages/domain|contracts|db|ui|ai|config` · `infra/` · `docs/`
