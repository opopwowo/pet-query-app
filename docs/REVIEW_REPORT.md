# ENTERPRISE ARCHITECTURE REVIEW REPORT

> 審查對象：目前 repo（靜態 PWA：`index.html` / `registry.html` / `stats.html` / `sw.js` / `app.js` / `manifest`）。
> 審查基準：**Enterprise SaaS 目標**（10 = 亞洲最好的企業級 AI 寵物平台）。
> 立場：不客氣、不討好。**目前能動 ≠ 沒問題。**

---

## TL;DR

目前的產品是一個**做工精良的靜態 PWA 原型**（近期的深色模式 / Service Worker / 無障礙 / PWA meta 優化品質不錯，且**可複用**）。
但若以「支撐 1000+ 業者、十年演進的企業級 SaaS」為尺，**核心地基（後端、資料庫、認證、多租戶、稽核、計費）幾乎為 0**。
這不是「加功能」能解決的，需要在既有原型旁**新建平台**，並把原型的設計資產（Design tokens、無障礙、官方合規精神）遷移進去。

**Enterprise Readiness：約 2.5 / 10。**

---

## 一、Scorecard（現況 vs 企業級目標）

| 面向 | 分數 | 一句話理由 |
| --- | :---: | --- |
| Product（產品 vs 願景） | **2.0** | 目前是「查詢外殼 + 本機記事」，離「寵物一生平台」極遠 |
| Architecture | **1.5** | 無分層、無後端；UI/邏輯/資料混在單一 HTML |
| Security | **1.0** | 無認證/授權/稽核；身分證等 PII 存在本機明碼流程 |
| Performance | **6.0** | 載入快 —— 但「快」是因為功能極簡；前端 `includes()` 搜尋不可規模化 |
| Scalability | **1.0** | 單機 `localStorage`；無多租戶、無共用、無後端 |
| Maintainability | **3.0** | 可讀，但三頁複製貼上、無型別、無測試 |
| Enterprise（多租戶/RBAC/計費/稽核） | **1.0** | 這些全部不存在 |
| Developer Experience | **2.0** | 無 TS、無測試、無 CI、無 monorepo |
| UI / Apple UX | **6.5** | 近期優化後乾淨、深色/主題佳；但非成體系的 Design System / 產品級 Console |
| Accessibility | **7.5** | 剛達 WCAG 2.1 AA（強項）；距 2.2 AA 仍有缺口 |
| **Technical Debt** | **High** | 現有架構大部分需重寫才能達企業級 |

> 說明：低分是相對「企業級 SaaS 目標」，不是說原型做得差。原型在它的範疇內其實不錯。

---

## 二、Product Review

- **定位正確**（願景清楚），但**已建產品 ≠ 願景**：目前只覆蓋「晶片查詢入口、常用晶片記事、名下清冊檢視、統計」。
- **MVP 應該是**：Owner + Pet + Health + Chip 的多租戶 CRUD + 官方同步整備。**這才是取代 Excel 的核心。**
- **不是 MVP、應延後**：Billing、Marketplace、Client Portal、進階 AI、排班/庫存模組。
- **應提前**：認證 / 多租戶 / 稽核 —— 因為它們是地基，越晚做重寫成本越高。

## 三、Architecture Review（對照理想）

| 準則 | 現況 | 差距 |
| --- | --- | --- |
| Clean Architecture | ❌ 無分層 | UI+邏輯+資料同檔 |
| DDD / Bounded Context | ❌ | 無領域模型 |
| SOLID / DI | ❌ | 全域函式、直接操作 DOM/localStorage |
| Repository Pattern | ❌ | `localStorage.getItem` 散落各處 |
| Service Layer | ❌ | 無 |
| Plugin Ready | ❌ | 無模組邊界 |

→ 需依 [ARCHITECTURE.md](./ARCHITECTURE.md) 重建（Modular Monolith + DDD + Clean Architecture on Cloudflare）。

## 四、一定會出事的地方（誠實預警）

**六個月內一定會壞：**
1. `localStorage` 當資料庫 —— 一旦有「第二台裝置 / 第二位員工 / 換手機」就資料遺失、無法共用（現況已是此限制）。
2. **CDN 動態載入 SheetJS**（`registry.html`）—— 無版本鎖、無 SRI、離線失效、CDN 故障即壞（**供應鏈風險**）。
3. 一旦承載真實客戶個資，**無認證/無稽核**即為法遵與資安事故。

**一年內一定重寫：**
4. 整個「靜態 PWA + localStorage」資料層。
5. 三個複製貼上的 HTML 頁（無元件化）。
6. `innerHTML` 字串拼接渲染（`registry.html`）—— XSS 面 + 不可維護。
7. 前端 `Array.includes()` 全量搜尋 —— 資料一多即崩。

**技術債最高：**
8. **無型別（JS）、無測試、無 CI** —— 任何重構都在裸奔。
9. 商業邏輯與 DOM/儲存強耦合，無法單元測試。
10. 日期以在地字串處理（無 UTC/時區規範）—— 跨區與稽核會出錯。

> 可複用的資產（不用全丟）：**CSS design tokens（深/淺色）、無障礙模式、Service Worker 更新策略、官方「不繞驗證」的合規精神。**

---

## 五、Top 100 改善事項（依 Critical / High / Medium / Low）

> 標記：`[領域]`。Critical = 不做就不算企業級 / 有事故風險。

### 🔴 Critical（15）
1. `[Data]` 建立真正的後端與資料庫，取代 localStorage 單機儲存
2. `[Auth]` 導入認證（帳號/登入/Session）
3. `[Tenancy]` 建立多租戶模型（Organization/Store/Membership）
4. `[Security]` RBAC 授權（角色/權限）
5. `[Security]` Row-Level Security 資料隔離（DB 級縱深防禦）
6. `[Compliance]` Audit Log（所有寫入/敏感存取）
7. `[Compliance]` 個資保護：身分證/證號欄位級加密 + 遮罩（PDPA）
8. `[API]` 建立版本化 REST API 層
9. `[Infra]` 環境分離 dev/staging/prod
10. `[Quality]` CI/CD + 自動測試門檻
11. `[Data]` Schema migration 版本控管
12. `[Data]` 備份 / PITR / DR
13. `[Observability]` 錯誤追蹤 + 日誌 + 告警
14. `[Security]` 移除 CDN 動態載入 SheetJS 的供應鏈風險（自帶/鎖版/SRI + 伺服器端解析）
15. `[Frontend]` 汰除 `innerHTML` 字串拼接渲染（XSS/維護）

### 🟠 High（37）
16. `[Infra]` 建 monorepo（pnpm + Turborepo）
17. `[DX]` 全面導入 TypeScript
18. `[Architecture]` Clean Architecture 分層（Domain/App/Infra/Interface）
19. `[Architecture]` DDD Bounded Contexts 切分
20. `[Architecture]` Repository Pattern + DI 容器
21. `[UI]` 建立 Design System（tokens + 元件），停止逐頁手刻
22. `[Data]` 資料模型建置：Owner/Pet/Chip/Health
23. `[Health]` Health Center（疫苗/驅蟲/體重/病歷/用藥 + 時間軸）
24. `[Media]` Media Center：R2 照片上傳（簽章直傳/縮圖）
25. `[OfficialSync]` Official Sync Center（整備/比對/引導）
26. `[Notification]` 到期提醒（Cron + Queue + Email/推播）
27. `[Migration]` 資料遷移工具（localStorage/Excel → 平台）
28. `[API]` OpenAPI 規格 + 契約測試
29. `[API]` 游標分頁（取代無分頁）
30. `[API]` Rate limiting（每租戶/Key）
31. `[API]` Idempotency + 樂觀鎖（ETag/If-Match）
32. `[Data]` Soft delete 全表
33. `[Search]` 伺服器端全文搜尋（取代前端 includes 掃描）
34. `[Security]` Secrets 管理 + 輪替
35. `[Reliability]` 標準化錯誤處理（現多處靜默 catch 吞錯）
36. `[Frontend]` 伺服器狀態管理（TanStack Query）+ 路由
37. `[Quality]` 測試：unit / e2e / 契約
38. `[A11y]` 升級 WCAG 2.2 AA（target size 24px、focus not obscured、dragging 替代）
39. `[PWA]` Push Notification + Background Sync
40. `[Perf]` 效能預算 + bundle 分析（SPA）
41. `[Observability]` Sentry + OpenTelemetry
42. `[Admin]` 稽核與活動可視化後台
43. `[Compliance]` 官方匯出檔最小保存策略
44. `[Platform]` Feature Flags / 模組開關（KV）
45. `[Platform]` Webhook 對外整合（HMAC 簽章）
46. `[Platform]` API Key 管理
47. `[Billing]` Subscription + Billing（Stripe，方案/席次/用量）
48. `[Analytics]` Dashboard / 營運報表
49. `[Breeding]` 配種→懷孕→產仔→血統家族樹
50. `[Contract]` Contract Center + PDF 生成
51. `[AI]` AI Center v1（整理/提醒/搜尋）
52. `[Portal]` 飼主 Client Portal（唯讀一生履歷）
53. `[Data]` UUID v7 主鍵策略
54. `[Data]` 時區/日期規範（UTC 儲存、在地顯示）
55. `[Security]` IDOR/BOLA 物件層授權檢查
56. `[Security]` 檔案上傳掃描 + 私有桶 + 簽章讀取
57. `[Frontend]` 錯誤邊界 + 載入骨架 + 空狀態
58. `[Contracts]` Zod 前後端共用驗證 schema
59. `[AI]` Prompt injection 防護 + 人工確認關鍵動作
60. `[AI]` RAG 租戶隔離
61. `[AI]` AI 成本/配額/快取（AI Gateway）
62. `[Notification]` 每使用者通知偏好
63. `[i18n]` i18n 架構（繁中為主，可擴多語）
64. `[Compliance]` 資料可攜/被遺忘權（租戶級匯出/刪除）
65. `[Compliance]` 保留政策 + 排程清理
66. `[DX]` 統一 lint/format/tsconfig preset + pre-commit
67. `[DX]` 種子資料 + 本地一鍵啟動（dev seeding）
68. `[Docs]` 隱私權政策 / DPA / 使用者同意流程
69. `[RBAC]` 多門市資源 scoping 規則
70. `[RBAC]` 自訂角色 / 權限集（超越固定角色）
71. `[Security]` CSP / SRI / 安全標頭（新前端）
72. `[Quality]` 契約/回歸測試納入 CI 門檻

### 🟡 Medium（21）
73. `[Scale]` health_records 依租戶 hash 分區
74. `[Scale]` audit_logs 時間分區 + R2 歸檔（Parquet）
75. `[Scale]` Hyperdrive 連線池（Workers → Postgres）
76. `[Perf]` 消除 N+1（dataloader/join）
77. `[Perf]` KV 快取策略（熱資料/設定）
78. `[Media]` CF Images 縮圖/格式轉換
79. `[Perf]` RUM / Web Vitals 監控
80. `[Quality]` axe 無障礙自動化測試
81. `[Quality]` Playwright 視覺回歸（取代一次性截圖）
82. `[UI]` Storybook 元件文件
83. `[AI]` AI eval 集（抽取準確率/幻覺率回歸）
84. `[Import]` 官方格式 mapping 版本化 + 容錯解析
85. `[Compliance]` 稽核不可竄改（append-only + WORM）
86. `[Money]` 金額一律 numeric（金流上線前確立）
87. `[Notification]` 簡訊/Email 供應商抽象層
88. `[Data]` 讀取副本 / 查詢路由（後期）
89. `[Search]` 進階篩選 DSL（`filter[...]`）
90. `[Frontend]` 主題/深色 tokens 遷移進 DS（沿用現有基礎）
91. `[Frontend]` 動效系統 + reduced-motion（沿用現有基礎）
92. `[DX]` 環境變數/設定驗證（啟動即檢查）
93. `[Ops]` Runbook / Incident 流程 / on-call

### 🟢 Low（7）
94. `[Ecosystem]` Marketplace / 第三方 Plugin
95. `[Mobile]` 原生封裝 App（Capacitor 或 RN）
96. `[i18n]` 多語（英/日）
97. `[Module]` 排班/預約（美容/旅館）、庫存/零售（寵物店）
98. `[Contract]` 電子簽章整合
99. `[Payment]` 在地金流（TapPay）補充 Stripe
100. `[Marketing]` 會員點數 / 行銷自動化

---

## 六、里程碑目標（對應 ROADMAP）

| 里程碑 | Enterprise Score 目標 |
| --- | :---: |
| 現況 | 2.5 |
| Phase 0（地基） | 5.0 |
| Phase 2（官方同步+文件） | 6.5 |
| Phase 4（商業化） | 8.0 |
| v1.0 | 8.5+ |

---

## 七、建議的下一步（等待你批准）

1. **批准本審查與設計文件** → 轉 ADR 為 Accepted。
2. **只做 Phase 0 地基的技術驗證（PoC）**：monorepo + 一個 Worker + Neon + 一張表 + RLS + Clerk 登入 + 一條 `/v1/pets` 端到端。**不碰現有線上頁面。**
3. PoC 通過 → 依 ROADMAP 逐 Context 建置。

> 在你明確批准前，**不動任何現有功能、不開始重構**。
