# ADR — Architecture Decision Ledger（凍結版）

> 本檔為**決策總帳與狀態**（凍結用）。詳細論述見 [DECISIONS.md](./DECISIONS.md)。
> 每則決策以「如果今天重新開始」重新審視：**Holds（成立）/ Modify（修改）/ Defer（延後）/ Cancel（取消）**。
> 狀態圖例：✅ Accepted　🟡 Pending（需確認才凍結）　⛔ Rejected

## 決策總帳

| ADR | 決策 | 重審結論 | 狀態 |
| --- | --- | --- | --- |
| 0001 | Modular Monolith（非微服務起步） | Holds | ✅ |
| 0002 | 主 DB = Postgres(Neon)+Hyperdrive（非純 D1） | Holds（強化：加 pgvector） | ✅ |
| 0003 | 多租戶 = Shared DB + RLS，大租戶可升級隔離 | Holds | ✅ |
| 0004 | 認證 = Clerk(MVP)→WorkOS(SSO) | **Modify**：需先確認**資料落地/PDPA**與成本 | 🟡 |
| 0005 | ORM = Drizzle | Holds | ✅ |
| 0006 | 前端 = React SPA(Vite) on Pages | Holds（Portal 之 SSR 另議） | ✅ |
| 0007 | AI = Claude via AI Gateway，伺服器端 | Holds | ✅ |
| 0008 | 官方登記 = 合法協助、不自動化登入 | Holds（升級為 Connector Framework） | ✅ |
| 0009 | 主鍵 = UUID v7 | Holds | ✅ |
| 0010 | Soft delete + Audit log 全表 | Holds | ✅ |
| 0011 | Monorepo = pnpm + Turborepo | Holds | ✅ |
| 0012 | PII 欄位級加密（PDPA） | Holds（提高優先） | ✅ |
| 0013 | **Plugin System 第一天內建**（擴充點契約凍結） | New | ✅ |
| 0014 | **Government/External Connector Framework**（模組化連接器） | New | ✅ |
| 0015 | **AI 為 Queue 驅動的獨立 Worker + Tool Registry** | New | ✅ |
| 0016 | **RAG 用 Neon pgvector**（取代獨立 Vectorize） | New | ✅ |
| 0017 | **Design System = Radix + Tailwind + tokens（CVA）** | New | ✅ |
| 0018 | **Notification = 通道抽象服務**（email/SMS/push/in-app） | New | ✅ |
| 0019 | **Billing = Stripe** | New，但**台灣電子發票/稅務/在地金流待確認** | 🟡 |
| 0020 | **資料落地區域（Region / Data Residency）** | New，**必須先決定**（PDPA 跨境） | 🟡 |

## 新決策詳述（0013–0020）

**ADR-0013 Plugin System 第一天內建**　內部 Context 與第三方共用擴充點契約。理由：長尾需求不可寫死；日後開放生態若非現在定契約＝重寫。取捨：初期只做 first-party 契約，沙箱/市集延後。詳見 PLUGIN_SYSTEM.md。

**ADR-0014 Connector Framework**　官方/協會/第三方皆為 connector，能力用 Capability Flags 描述，反腐層隔離。pet.gov.tw 為第一實例（無 API → 協助/引導）。詳見 OFFICIAL_CONNECTOR.md。

**ADR-0015 AI Worker + Tool Registry**　AI 任務走 Queue 由獨立 Worker 處理；AI 的「工具」即內部 use case，複用權限/稽核。理由：可擴充、可控成本、動作可稽核。詳見 AI.md。

**ADR-0016 pgvector on Neon**　RAG 向量索引直接放 Postgres（pgvector），與主資料同租戶隔離，少一個系統。取捨：極大規模向量再評估專用向量庫。

**ADR-0017 Design System**　Radix primitives（無障礙）+ Tailwind + tokens（CVA）。沿用現有深/淺色與 a11y 資產。詳見 DESIGN_SYSTEM.md。

**ADR-0018 Notification 通道抽象**　email/SMS/push/in-app 以 provider 抽象；使用者可設偏好；失敗重試。理由：提醒是核心價值，需可換供應商。

**ADR-0019 Billing = Stripe（🟡 Pending）**　訂閱/席次/用量計費成熟。**待確認**：台灣**電子發票**合規、營業稅、在地金流（TapPay）是否需並行。凍結前需決定發票方案。

**ADR-0020 資料落地區域（🟡 Pending，最高優先）**　Neon/R2/IdP/AI 的資料存放區域與跨境傳輸須符合 PDPA 與客戶預期。**在儲存任何真實 PII 前必須拍板**，否則影響 DB region、IdP 選擇（連帶 ADR-0004）。

## Pending 清單（凍結前必須解決）

| # | 待確認 | 影響 | 需要的輸入 |
| --- | --- | --- | --- |
| P1 | **資料落地區域**（ADR-0020） | DB/R2/IdP/AI 選型與 region | 法遵/商務決策：資料是否須留台灣 |
| P2 | **認證供應商**（ADR-0004） | 成本、SSO、落地 | 依 P1 + MAU 成本模型：Clerk vs WorkOS vs 自建 |
| P3 | **發票/金流**（ADR-0019） | 商業化合規 | 電子發票方案、是否需在地金流 |
| P4 | **品牌名稱** | 網域、manifest、識別 | 「寵伴 / Pet Companion / 其他」定案 |
| P5 | **AI 資料使用同意** | AI 處理客戶資料的合規 | 條款/同意流程（連 SECURITY/PDPA） |

## ⛔ Rejected / 明確不採用

- **純 D1 為主資料庫**：單庫上限、無 RLS、SQLite 限制，不適合 10M+ 多租戶旗艦規模（D1 僅保留為邊緣快取/離線之可選）。
- **微服務起步**：分散式成本此刻是負債（見 0001）。
- **Client 端直呼 LLM**：金鑰/資料外洩（見 0007）。
- **官方登記自動化（繞驗證/模擬登入/存密碼）**：違法違規，永久拒絕（見 0008）。
- **繼續在 localStorage 靜態架構上加功能**：技術債，禁止。
