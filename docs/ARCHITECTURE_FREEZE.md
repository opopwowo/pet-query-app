# ARCHITECTURE FREEZE REPORT — v1.0

> 目的：在動任何程式前，凍結產品、架構、資料、決策。**通過凍結 = Phase 0 的唯一入口。**
> 規則：**在你（產品負責人）批准前，不 Coding、不建 Worker/DB/API、不改 UI。**
> 狀態：**待批准（Awaiting Sign-off）**。

---

## A. Architecture Freeze Checklist

圖例：✅ 已凍結（文件完成、決策明確）　🟡 待確認（有 Pending 決策）　⬜ 未開始

| # | 項目 | 狀態 | 依據文件 |
| --- | --- | :---: | --- |
| 1 | Product Mission | ✅ | MISSION.md |
| 2 | Product Vision | ✅ | VISION.md |
| 3 | Why / Core Value | ✅ | WHY.md, VISION.md |
| 4 | Target Customer | ✅ | VISION.md |
| 5 | Business Model | 🟡 | VISION.md（金流/發票待確認 P3） |
| 6 | System Architecture | ✅ | ARCHITECTURE.md |
| 7 | Domain Model（DDD） | ✅ | DOMAIN_MODEL.md |
| 8 | Database Model | ✅ | DATABASE.md |
| 9 | API Design | ✅ | API.md |
| 10 | Authentication | 🟡 | SECURITY.md, ADR-0004（P1/P2） |
| 11 | RBAC | ✅ | SECURITY.md |
| 12 | Multi-Tenant | ✅ | ARCHITECTURE.md, DATABASE.md（RLS） |
| 13 | Multi-Store | ✅ | ARCHITECTURE.md, DOMAIN_MODEL.md |
| 14 | Audit Log | ✅ | SECURITY.md, DATABASE.md |
| 15 | Official / Connector Framework | ✅ | OFFICIAL_CONNECTOR.md |
| 16 | AI Architecture | ✅ | AI.md |
| 17 | Plugin System | ✅ | PLUGIN_SYSTEM.md |
| 18 | Notification System | ✅ | ADR-0018, DOMAIN_MODEL.md |
| 19 | Billing | 🟡 | ADR-0019（P3） |
| 20 | Subscription | ✅ | VISION.md, DOMAIN_MODEL.md |
| 21 | Cloudflare Architecture | ✅ | 本檔 §B, TECH_STACK.md |
| 22 | Security | ✅ | SECURITY.md |
| 23 | Deployment | ✅ | ARCHITECTURE.md §7 |
| 24 | Monitoring / Observability | ✅ | SECURITY.md, TECH_STACK.md |
| 25 | Backup | ✅ | DATABASE.md §6 |
| 26 | Disaster Recovery | ✅ | DATABASE.md §6 |
| 27 | Design System | ✅ | DESIGN_SYSTEM.md |
| 28 | Testing Strategy | ✅ | TECH_STACK.md, 本檔 §E |
| 29 | CI/CD | ✅ | ARCHITECTURE.md §7 |
| 30 | Data Residency（PDPA 跨境） | 🟡 | ADR-0020（P1，**最高優先**） |

**凍結進度：24 ✅ / 6 🟡 / 0 ⬜。** 6 項 Pending 需你拍板才能 100% 凍結（見 §D）。

---

## B. Cloudflare / 資料層元件重估

> 逐一評估（優點/缺點/成本/維護/擴充）→ 推薦。

| 元件 | 優點 | 缺點 | 成本 | 維護/擴充 | 結論 |
| --- | --- | --- | --- | --- | --- |
| **Workers** | 全球邊緣、低延遲、與生態整合 | 執行時限/記憶體限制、非 Node 全相容 | 低 | 高 | ✅ **採用（核心運算）** |
| **Pages** | 前端托管、預覽環境、與 Workers 整合 | SSR 需 Functions | 低 | 高 | ✅ **採用（Console/Portal）** |
| **Neon(Postgres)** | 關聯 + RLS + pgvector + 分區、成熟 | 非 CF-native、跨區延遲 | 中 | 高 | ✅ **採用（主資料庫）** |
| **Hyperdrive** | Workers→PG 連線池 + 邊緣快取 | 多一層設定 | 低 | 高 | ✅ **採用（必要）** |
| **D1** | CF-native、便宜、邊緣讀複製 | 單庫上限、無 RLS、SQLite 限制 | 低 | 中 | ⛔ **不作主庫**；🟡 邊緣快取/離線可選 |
| **R2** | 零 egress、S3 相容 | 無 | 低 | 高 | ✅ **採用（媒體/文件/備份）** |
| **KV** | 低延遲讀、全球 | 最終一致、非交易 | 低 | 高 | ✅ **採用（設定/旗標/熱快取）** |
| **Queues** | 解耦、重試、批次 | 需設計冪等 | 低 | 高 | ✅ **採用（AI/通知/比對/文件）** |
| **Durable Objects** | 強一致協調、單點狀態、即時 | 心智較高、單物件熱點 | 低-中 | 中-高 | ✅ **採用（Sync Session/限流/即時）** |
| **Cron Triggers** | 內建排程 | 精度/觀測有限 | 低 | 高 | ✅ **採用（提醒/計費/報表）** |
| **AI Gateway** | 快取/限流/觀測/成本控管 | 多一跳 | 低 | 高 | ✅ **採用（Claude 前置）** |
| **Vectorize** | CF-native 向量庫 | 與主資料分離、需同步 | 低 | 中 | ⛔ **改用 Neon pgvector**（ADR-0016） |
| **Images** | 縮圖/轉檔/CDN | 依用量計費 | 中 | 高 | 🟡 **Phase 1+ 採用** |

**推薦組合（凍結）**：`Workers + Pages + Neon(+pgvector) + Hyperdrive + R2 + KV + Queues + Durable Objects + Cron + AI Gateway`。D1 僅作邊緣/離線可選；Vectorize 以 pgvector 取代。

---

## C. Architecture Review（重新評分 0–100）

> 兩欄：**現況（as-built 靜態 PWA）** vs **凍結架構（as-designed，紙上設計的健全度）**。
> 設計分未達滿分＝仍為未實作的紙上設計 + 有 Pending 決策。

| 面向 | 現況 | 凍結架構(設計) | 說明 |
| --- | :---: | :---: | --- |
| Scalability | 10 | 88 | RLS + 分區 + Hyperdrive + 邊緣；設計撐得住目標規模 |
| Maintainability | 30 | 85 | Clean/DDD/monorepo/型別/測試；紙上健全，待落地驗證 |
| Performance | 60 | 82 | 邊緣 + 快取；需落地做效能預算 |
| Security | 10 | 88 | 認證/RBAC/RLS/稽核/加密/PDPA；扣分於 residency/auth Pending |
| Developer Experience | 20 | 85 | TS/契約/CI/DS/Storybook |
| Operational Cost | 55 | 80 | 邊緣成本低；Neon/IdP/AI 為主要變動成本，需監控 |
| Enterprise Readiness | 10 | 84 | 多租戶/計費/稽核/SSO 路徑；扣分於 Pending 與未實作 |
| **Technical Debt（越高越好=越少債）** | 25 | 80 | 設計無重大債；風險在執行紀律 |

**綜合**：現況 ≈ **27 / 100**（優秀原型、非企業級地基）；凍結架構（設計）≈ **84 / 100**（健全、可執行，待落地與 6 項 Pending 拍板）。

---

## D. Architecture Freeze Report

### 1) ✅ 已確認（Accepted）
Modular Monolith、Postgres+RLS 多租戶、Drizzle、React SPA、Claude via AI Gateway、UUID v7、Soft delete+Audit、Monorepo、PII 加密、**Plugin System 內建**、**Connector Framework**、**AI Worker+Tool Registry**、**pgvector RAG**、**Design System(Radix+Tailwind)**、**Notification 抽象**。CF 組合如 §B。

### 2) 🟡 待確認（Pending，凍結前必解）
| 代號 | 事項 | 為何擋凍結 |
| --- | --- | --- |
| P1 | **資料落地區域 / PDPA 跨境**（ADR-0020） | 決定 DB/R2/IdP/AI 的 region 與供應商，牽一髮動全身 |
| P2 | **認證供應商**（ADR-0004） | 依 P1 與成本；影響 Phase 0 骨架 |
| P3 | **發票/金流合規**（ADR-0019） | 台灣電子發票/營業稅/在地金流 |
| P4 | **品牌名稱** | 網域/manifest/識別 |
| P5 | **AI 資料使用同意** | 客戶資料進 AI 的合規前提 |

### 3) ⛔ 不建議採用（Rejected）
純 D1 主庫、微服務起步、Client 端直呼 LLM、官方登記自動化、繼續在 localStorage 上加功能、獨立 Vectorize（改 pgvector）。

### 4) 必須立即修正的「架構」
> 目前無後端可改，「立即」＝進入 Phase 0 前的前置守則：
- **凍結現有靜態 App 的功能面**：不得再於 localStorage 架構上加任何新功能（只允許安全性修補）。
- **供應鏈**：現有 `registry.html` 由 CDN 動態載入 SheetJS（無鎖版/SRI）——新平台一律自帶/鎖版；此為已知風險，先記錄。
- **確立資料落地（P1）**：在任何真實 PII 進入系統前拍板。

### 5) Phase 0 開始前必須完成
1. 拍板 **P1–P5**（尤其 P1 資料落地）。
2. 批准本 Freeze（ADR Pending → Accepted）。
3. 佈建帳號/環境：Cloudflare、Neon、IdP、Sentry、Stripe（測試）、網域。
4. 完成一次 **Threat Model / PDPA 資料流盤點**（誰存什麼、存哪、留多久）。
5. 確認 **Domain Model 簽核**（DOMAIN_MODEL.md 的聚合/事件無異議）。
6. 定義 **Definition of Done / 測試門檻 / 效能預算 / a11y 門檻**。

---

## E. Testing / CI 策略（凍結）

- **單元**：Domain/Application 純函式（Vitest），不依賴框架。
- **整合**：Repository ↔ Neon（測試分支）、RLS 隔離測試（跨租戶不可見）。
- **契約**：OpenAPI ↔ 實作（Schemathesis），前後端型別由 Zod 單源。
- **E2E**：Playwright（關鍵流程 + 視覺回歸 + axe 無障礙）。
- **CI 門檻**：型別/lint/測試/契約/a11y 全綠才可合併；migration 需向前相容檢查。

---

## F. Sign-off

- [ ] 產品負責人批准本 Architecture Freeze
- [ ] P1–P5 決議已記錄
- [ ] ADR Pending → Accepted
- [ ] 授權開始 Phase 0（僅 PoC，範圍見 ROADMAP）

> 批准前：**不 Coding。** 本文件與 `docs/` 為唯一交付物。
