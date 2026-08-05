# 寵伴 Platform — 設計文件中心（Enterprise Design Docs）

> 品牌名「寵伴 / Pet Companion」為暫定，可再調整。
> 本目錄為 **Enterprise Architecture Review** 與 **平台設計藍圖**。
> 狀態：**Proposed（提案中，等待批准後才進入重構）**。目前線上仍為既有的靜態 PWA。

## 閱讀順序

**先讀凍結報告** → [ARCHITECTURE_FREEZE.md](./ARCHITECTURE_FREEZE.md)（Checklist、Cloudflare 重估、0–100 評分、Accepted/Pending/Rejected）。

| # | 文件 | 內容 |
| --- | --- | --- |
| 0 | [ARCHITECTURE_FREEZE.md](./ARCHITECTURE_FREEZE.md) | **架構凍結報告**（Phase 0 的入口） |
| 1 | [WHY.md](./WHY.md) | 第一性原理：為什麼做、為什麼是平台 |
| 2 | [MISSION.md](./MISSION.md) | 使命 |
| 3 | [VISION.md](./VISION.md) | 願景、定位、客群、商業模式、競爭優勢 |
| 4 | [REVIEW_REPORT.md](./REVIEW_REPORT.md) | Enterprise Review：評分、技術債、Top 100 |
| 5 | [TECH_STACK.md](./TECH_STACK.md) | 技術選型（Cloudflare + Postgres + React + AI） |
| 6 | [ARCHITECTURE.md](./ARCHITECTURE.md) | 系統架構、Clean Architecture / DDD、多租戶 |
| 7 | [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) | 領域模型：聚合/實體/值物件/事件/不變式 |
| 8 | [DATABASE.md](./DATABASE.md) | 資料模型、索引、分區、規模驗證 |
| 9 | [API.md](./API.md) | REST API 設計 |
| 10 | [SECURITY.md](./SECURITY.md) | 認證/授權/RBAC/Audit/加密/PDPA |
| 11 | [OFFICIAL_CONNECTOR.md](./OFFICIAL_CONNECTOR.md) | 政府/外部連接器框架（含 pet.gov.tw） |
| 12 | [OFFICIAL_SYNC.md](./OFFICIAL_SYNC.md) | pet.gov.tw connector 實例（同步中心） |
| 13 | [AI.md](./AI.md) | AI Center + AI Worker 架構 |
| 14 | [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md) | 插件架構（第一天內建） |
| 15 | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | 設計系統（Radix + Tailwind + tokens） |
| 16 | [ROADMAP.md](./ROADMAP.md) | Architecture Freeze → Phase 0 → v1.0 |
| 17 | [ADR.md](./ADR.md) | 決策總帳（凍結狀態：Accepted/Pending/Rejected） |
| 18 | [DECISIONS.md](./DECISIONS.md) | ADR 詳細論述 |

## 核心原則（所有文件共用）

1. **通用優先**：為 90%+ 合法業者設計標準流程，特殊需求走設定 / 權限 / 模組 / Plugin，不寫死單店流程。
2. **資料只輸入一次，全系統共用**（Single Source of Truth）。
3. **合法性優先**：官方登記只協助、不繞過驗證、不模擬登入、不儲存官方密碼。
4. **長期演進 > 短期完成**：可維護性、可擴充性、可測試性優先。
5. **多租戶是地基，不是附加功能**：Tenant / RBAC / Audit / Subscription 從第一天就存在。

## 現有文件

- [優化說明.md](./優化說明.md) — 既有靜態 PWA 的深色模式 / SW / PWA / 無障礙優化紀錄。
