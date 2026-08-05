# 寵伴 Platform — 設計文件中心（Enterprise Design Docs）

> 品牌名「寵伴 / Pet Companion」為暫定，可再調整。
> 本目錄為 **Enterprise Architecture Review** 與 **平台設計藍圖**。
> 狀態：**Proposed（提案中，等待批准後才進入重構）**。目前線上仍為既有的靜態 PWA。

## 閱讀順序

| # | 文件 | 內容 |
| --- | --- | --- |
| 1 | [MISSION.md](./MISSION.md) | 使命：我們為什麼做這件事 |
| 2 | [VISION.md](./VISION.md) | 願景、定位、目標客群、商業模式、競爭優勢 |
| 3 | [REVIEW_REPORT.md](./REVIEW_REPORT.md) | **Enterprise Architecture Review**：現況評分、技術債、Top 100 改善清單 |
| 4 | [TECH_STACK.md](./TECH_STACK.md) | 技術選型與理由（Cloudflare + Postgres + React + AI） |
| 5 | [ARCHITECTURE.md](./ARCHITECTURE.md) | 系統架構、Clean Architecture / DDD、Bounded Contexts、多租戶模型 |
| 6 | [DATABASE.md](./DATABASE.md) | 資料模型、Schema、索引與分區、規模驗證（1M 寵物 / 10M 紀錄） |
| 7 | [API.md](./API.md) | REST API 設計、版本、分頁、驗證、Rate Limit、OpenAPI、Webhook |
| 8 | [SECURITY.md](./SECURITY.md) | 認證/授權、RBAC、Audit、加密、PDPA 個資、OWASP 風險 |
| 9 | [AI.md](./AI.md) | AI Center：不只是聊天，如何真正節省工作 |
| 10 | [OFFICIAL_SYNC.md](./OFFICIAL_SYNC.md) | Official Sync Center：合法、安全、最佳體驗的官方同步 |
| 11 | [ROADMAP.md](./ROADMAP.md) | Phase 0 → v1.0 分階段路線圖 |
| 12 | [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records（ADR） |

## 核心原則（所有文件共用）

1. **通用優先**：為 90%+ 合法業者設計標準流程，特殊需求走設定 / 權限 / 模組 / Plugin，不寫死單店流程。
2. **資料只輸入一次，全系統共用**（Single Source of Truth）。
3. **合法性優先**：官方登記只協助、不繞過驗證、不模擬登入、不儲存官方密碼。
4. **長期演進 > 短期完成**：可維護性、可擴充性、可測試性優先。
5. **多租戶是地基，不是附加功能**：Tenant / RBAC / Audit / Subscription 從第一天就存在。

## 現有文件

- [優化說明.md](./優化說明.md) — 既有靜態 PWA 的深色模式 / SW / PWA / 無障礙優化紀錄。
