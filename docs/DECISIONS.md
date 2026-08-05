# DECISIONS — Architecture Decision Records（ADR）

> 格式：每則 ADR 記錄 **背景 / 決定 / 理由 / 取捨 / 狀態**。
> 全部狀態目前為 **Proposed**，待批准後轉 **Accepted**。

---

## ADR-0001：Modular Monolith（而非一開始微服務）
- **決定**：以單一 API Worker + 模組化 Bounded Contexts 起步，Context 間以事件解耦。
- **理由**：團隊小、需求未定型；微服務的分散式成本（一致性、部署、觀測）此刻是負債。模組邊界清楚即可日後拆分。
- **取捨**：單體有耦合風險 → 用 DDD 邊界 + lint 規則（禁跨 context import）約束。

## ADR-0002：Postgres（Neon）為主資料庫，而非純 D1
- **決定**：主 OLTP 用 Postgres + RLS，經 Hyperdrive 連線；R2/KV 為輔。
- **理由**：目標規模 10M+ 列、複雜關聯、RLS 多租戶、成熟索引/分區；D1 單庫上限與單區特性不適合旗艦規模。
- **取捨**：放棄「全 CF-native」的純粹性；換得可擴充與生態成熟。小型/邊緣場景仍可用 D1（見 ADR-0003）。

## ADR-0003：多租戶隔離 = Shared DB + RLS，大租戶可升級隔離
- **決定**：預設共享庫 + `tenant_id` + RLS；超大或企業租戶可升級為獨立 schema / 獨立 Neon 專案。
- **理由**：共享庫營運成本低、上手快；RLS 提供 DB 級縱深防禦。Repository 抽象讓升級隔離不動應用碼。
- **取捨**：共享庫有噪音鄰居風險 → 索引/配額/監控 + 升級路徑緩解。

## ADR-0004：認證用 Clerk（MVP）→ WorkOS（Enterprise SSO）
- **決定**：MVP 用 Clerk（內建 Organizations）；企業期導入 WorkOS SAML/SCIM。
- **理由**：自建認證是高風險時間黑洞；托管方案安全且快。RBAC 授權仍在我方應用層。
- **取捨**：供應商相依 → 以標準 JWT + 抽象 auth port 降低鎖定。

## ADR-0005：ORM 用 Drizzle
- **決定**：Drizzle ORM + drizzle-kit migration。
- **理由**：輕量、型別安全、Edge 友善、可同時支援 PG 與 D1（利於 ADR-0003 的儲存抽象）。
- **取捨**：生態較 Prisma 年輕 → 但更貼近 SQL、可控。

## ADR-0006：前端後台用 React SPA（Vite）on Pages，而非 Next SSR
- **決定**：內部 Console 為 SPA；公開/行銷/飼主 Portal 視 SEO 需求再評估 SSR。
- **理由**：後台重互動、低 SEO 需求；SPA 部署與心智簡單。
- **取捨**：首屏與 SEO 較弱 → 後台不需要；Portal 另議。

## ADR-0007：AI 走 Claude API + CF AI Gateway，伺服器端編排
- **決定**：AI 一律伺服器端呼叫，經 AI Gateway（快取/限流/觀測/成本）。預設採用最新 Claude 模型。
- **理由**：金鑰安全、租戶資料隔離、可稽核、可控成本；client 端呼叫 LLM 會外洩金鑰與資料。
- **取捨**：多一層延遲 → 以快取與串流緩解。

## ADR-0008：官方登記 = 合法「協助 + 引導」，永不自動化登入
- **決定**：Official Sync Center 只做資料整備、差異比對、引導；**不繞驗證碼、不模擬登入、不存官方密碼**。最終由使用者本人送出。
- **理由**：合法與信任是護城河；自動化違規會摧毀整個平台。
- **取捨**：無法做到「一鍵全自動」→ 以最佳整備體驗（批次、diff、瀏覽器擴充輔助填寫）補足。詳見 OFFICIAL_SYNC。

## ADR-0009：主鍵用 UUID v7
- **決定**：所有主鍵 UUID v7。
- **理由**：時間排序（索引友善）、無序號外洩、分散式產生無碰撞。
- **取捨**：比 bigint 大 → 可接受；避免熱點與枚舉攻擊。

## ADR-0010：Soft Delete + Audit Log 全表預設
- **決定**：業務表一律 `deleted_at` 軟刪除；所有寫入寫 `audit_logs`。
- **理由**：可回溯、可稽核、誤刪可救、企業合規。
- **取捨**：查詢需過濾 `deleted_at is null`（用 view / 預設 scope 處理）。

## ADR-0011：Monorepo（pnpm + Turborepo）
- **決定**：前後端與共用套件同倉。
- **理由**：型別/契約/DS 共用，一次 PR 端到端一致。
- **取捨**：倉庫較大 → Turborepo 快取與工作區隔緩解。

## ADR-0012：個資（PDPA）— 欄位級加密 + 最小揭露
- **決定**：身分證/證號等高敏欄位欄位級加密；預設遮罩；存取寫稽核。
- **理由**：台灣個資法與業者信任；資料外洩風險極高的欄位需額外保護。
- **取捨**：加密欄位不可直接查詢 → 以雜湊索引處理必要查詢。詳見 SECURITY。
