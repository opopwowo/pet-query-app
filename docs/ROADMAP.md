# ROADMAP — 分階段路線圖（到 v1.0）

> 原則：每階段都端到端可用、可展示、可收費驗證。**先地基，再垂直切片，再廣度。**
> 狀態：**Proposed**。時程為相對估算（依團隊配置調整），非承諾日期。

## Gate 0 — Architecture Freeze（架構凍結）〔進行中〕
**Phase 0 的唯一入口。** 未通過凍結不得開始任何 Coding。
- 完成 `docs/` 全套設計文件（✅ 已完成草案）。
- 解決 6 項 Pending 決策（見 [ARCHITECTURE_FREEZE.md](./ARCHITECTURE_FREEZE.md) §D）：資料落地、認證、發票金流、品牌、AI 同意。
- 產品負責人 **Sign-off**，ADR Pending → Accepted。
- **出場標準**：Freeze Report 批准。

## Phase 0 — Foundation（地基）〔約 4–6 週〕
**目標：能安全承載多租戶、且可插拔的空平台。**
- Monorepo（pnpm + Turborepo）、TS 設定、CI/CD、環境（dev/staging/prod）。
- Cloudflare 基礎（Workers/Pages/R2/KV/Queues/Hyperdrive）+ Neon（含 pgvector）+ Terraform。
- 認證 + 組織/門市/成員 + **RBAC** + **RLS** 骨架 + **Audit Log**。
- **Module Registry + 擴充點契約 + Connector 介面**（Plugin/Connector 地基，先 first-party）。
- Design System v0（tokens + 核心元件；沿用既有深色/無障礙基礎）。
- 觀測（Sentry + Logpush）、錯誤/日誌規範。
- **出場標準**：可註冊組織、邀請員工、指派角色，資料受 RLS 隔離，動作進稽核；一個 first-party 模組透過擴充點掛載成功。

## Phase 1 — Core Records（核心紀錄）〔約 6–8 週〕
**目標：取代 Excel 的第一步 —— 寵物與健康。**
- Owner（CRM）+ Pet 主檔 + Chip Center。
- Health Center：疫苗/驅蟲/體重/病歷/用藥 + 時間軸。
- Media Center：R2 照片上傳（簽章直傳、縮圖）。
- 資料遷移：從既有 `localStorage` / 官方 Excel 匯入。
- **出場標準**：一家店能把現有寵物與健康資料搬進來，日常查詢/新增比 Excel 快。

## Phase 2 — Official Sync + Documents〔約 6–8 週〕
**目標：在地護城河 + 交付價值。**
- Official Sync Center：整備 → 差異比對 → 引導送出（合法）。
- Contract Center：合約/收據模板 + 生成（PDF, R2）。
- Notification：到期提醒（Cron + Queue）、Email/推播。
- **出場標準**：業者能用平台整備官方登記並產出正式文件。

## Phase 3 — Breeding + AI v1〔約 8–10 週〕
**目標：貓舍/犬舍完整生命週期 + AI 開始代勞。**
- Breeding：配種 → 懷孕 → 產仔 → 血統/家族樹。
- AI Center v1：非結構化整理、智慧提醒、自然語言搜尋。
- **出場標準**：一窩幼犬貓從出生到晶片/官方整備可端到端追蹤；AI 能把 LINE/Excel 轉結構化。

## Phase 4 — SaaS 商業化〔約 6–8 週〕
**目標：可規模化收費與整合。**
- Subscription + Billing（Stripe，方案/席次/用量）、發票。
- Plugin/模組開關（Feature Flags）、API Key、Webhook。
- 飼主 Client Portal v1（唯讀一生履歷）。
- **出場標準**：可對多家店開通、計費、限額；第三方可透過 API/Webhook 整合。

## Phase 5 — Enterprise & Intelligence → v1.0〔約 8–12 週〕
**目標：企業級與智慧化。**
- WorkOS SSO/SAML/SCIM、進階稽核/合規報表、資料可攜/刪除。
- AI v2/v3：文件自動生成、官方整備包、agentic 流程、營運洞察。
- Dashboard/報表、效能與規模強化（分區/快取/讀取副本）。
- **v1.0 出場標準**：多家真實業者每日使用、可稽核、可計費、可擴充、AI 真正省工時。

## 跨階段持續進行
- 測試（unit/e2e/契約）覆蓋率門檻、無障礙（WCAG 2.2 AA）回歸、效能預算、安全掃描、成本監控。

## 里程碑對應評分目標（見 REVIEW_REPORT）
| 里程碑 | Enterprise Score 目標 |
| --- | --- |
| Phase 0 | 3 → 5 |
| Phase 2 | 5 → 6.5 |
| Phase 4 | 6.5 → 8 |
| v1.0 | 8.5+ |
