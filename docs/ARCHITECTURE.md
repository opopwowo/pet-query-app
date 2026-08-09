# ARCHITECTURE — 系統架構

> 狀態：**Proposed**。風格：**Modular Monolith + DDD Bounded Contexts + Clean Architecture**，跑在 Cloudflare Edge。

## 1. 高階架構

```
                         ┌──────────────────────────────────────────┐
   飼主/員工/業者 ─────▶  │  Cloudflare CDN / Pages（React SPA + PWA） │
                         └───────────────┬──────────────────────────┘
                                         │ HTTPS (REST /v1, JSON)
                         ┌───────────────▼──────────────────────────┐
                         │  API Worker（Hono）                        │
                         │  ├─ Interface：REST controllers / auth mw  │
                         │  ├─ Application：use cases（交易邊界）      │
                         │  ├─ Domain：entities / value objects       │
                         │  └─ Infrastructure：repositories / adapters│
                         └──┬─────┬─────┬─────┬─────┬─────┬───────────┘
        Hyperdrive │       │     │     │     │     │     │
      ┌────────────▼─┐ ┌───▼─┐ ┌─▼──┐ ┌▼───┐ ┌▼──────┐ ┌▼────────────┐
      │ Postgres(Neon)│ │ R2  │ │ KV │ │Queue│ │Durable│ │ AI Gateway  │
      │ 主資料 + RLS  │ │媒體 │ │設定│ │非同步│ │Objects│ │ → Claude    │
      └───────────────┘ └─────┘ └────┘ └──┬──┘ └───┬───┘ └─────────────┘
                                          │        │
                              ┌───────────▼──┐  ┌──▼─────────────┐
                              │ Cron Triggers │  │ Official Sync  │
                              │ 提醒/報表/計費 │  │ Session（DO）  │
                              └───────────────┘  └────────────────┘
```

## 2. Clean Architecture 分層

| 層 | 職責 | 相依方向 | 範例 |
| --- | --- | --- | --- |
| **Domain** | 純業務規則、實體、值物件、領域事件 | 不相依任何框架 | `Pet`, `ChipNumber`, `VaccineSchedule` |
| **Application** | Use case、交易邊界、DTO、Port 介面 | 只依賴 Domain | `RegisterPet`, `RecordVaccine` |
| **Infrastructure** | 實作 Port：DB、R2、AI、官方、金流 | 依賴 Application 介面 | `DrizzlePetRepository`, `R2MediaStore` |
| **Interface** | HTTP/Queue/Cron 進入點、序列化、驗證 | 依賴 Application | Hono routes、Zod 驗證 |

- **Dependency Inversion**：Application 定義 `PetRepository` 介面（Port），Infrastructure 提供 `DrizzlePetRepository`（Adapter）。切換 Postgres↔D1 不動 Domain/Application。
- **DI**：以輕量 container / factory 在 Worker 啟動時組裝，依 request 帶入 tenant context。

## 3. Bounded Contexts（DDD）

每個 context = 一個 `packages/domain` 子模組 + 對應資料表 + use case + API 前綴：

| Context | 職責 | 主要聚合根 |
| --- | --- | --- |
| **Identity & Tenancy** | 組織、門市、使用者、RBAC、訂閱 | Organization, User, Role |
| **Pet** | 寵物主檔、家族、血統 | Pet, Pedigree |
| **Owner (CRM)** | 飼主/客戶、關係 | Owner |
| **Health** | 疫苗、驅蟲、體重、病歷、用藥 | HealthRecord |
| **Chip & Registration** | 晶片、官方登記狀態 | ChipRegistration |
| **Breeding** | 配種、懷孕、產仔 | BreedingCycle, Litter |
| **Contract & Billing(業務)** | 合約、收據 | Contract |
| **Media** | 照片、影片、文件 | MediaAsset |
| **AI** | 任務編排、生成、自動化 | AiTask |
| **Notification** | 提醒、推播、Email/SMS | Notification |
| **Official Sync** | 資料整備、差異比對、引導送出 | SyncSession |
| **Platform** | Audit、API Key、Webhook、Plugin、Feature Flag | AuditLog |

Context 之間**不直接讀彼此的表**，透過 Application service 或 **Domain Events**（經 Queues）溝通 → 未來可獨立拆分為 Worker。

## 4. 多租戶模型（Multi-Tenancy）

```
Organization（租戶＝業者）
  └── Store（門市，1..N）
        └── Membership（員工 ↔ 角色，scoped to org 及/或 store）
Subscription 綁在 Organization 層。
```

- **隔離策略**：**Shared DB + Row-Level Security**。每張業務表都有 `tenant_id`（= organization_id）。Postgres RLS policy 依 `current_setting('app.tenant_id')` 強制隔離；即使應用層漏過濾，DB 也擋下（縱深防禦）。
- **Tenant Context**：每個 request 由 auth middleware 解出 `tenant_id` + `user_id` + roles，設進交易 session 變數。
- **噪音鄰居**：大租戶可升級為 **獨立 schema / 獨立 Neon 專案**（Repository 抽象讓遷移不動應用碼，見 ADR-0003）。
- **Store-level scoping**：資料可同時屬於 org，並選擇性 scoped 到 store；RBAC 決定跨店可見性。

## 5. Plugin / 模組化（第一天內建）

- 每個 Context 以 **Module Registry** 註冊：路由、權限、事件訂閱、Cron、Nav、擴充點。
- **內外部共用同一套擴充點契約**（dogfooding）：核心模組與第三方 plugin 走相同介面。
- **Feature Flags（KV）** 控制模組對租戶/方案的開關 → 特殊需求走設定/模組，**不寫死單店**。
- Plugin 不直接碰 DB，只透過 Platform SDK/內部 API（帶 tenant + capability + 稽核）。
- 對外延伸走 **Webhook + API Key + OAuth app**（第三方沙箱/Marketplace 為後期，但契約現在凍結）。
- 詳見 [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md)。

## 5b. Connector Framework（政府/外部整合）

- 官方（pet.gov.tw）、其他政府平台、協會、第三方服務皆為 **Connector**，以 **Capability Flags** 描述能力，**反腐層**隔離外部格式（見 DOMAIN_MODEL §7）。
- 新增 connector = 實作介面 + manifest，以 plugin 形式安裝，**不改核心**。
- 是否自動化取決於來源是否提供**合法 API/授權**；pet.gov.tw 一律「協助/引導、使用者本人送出」。
- 詳見 [OFFICIAL_CONNECTOR.md](./OFFICIAL_CONNECTOR.md)。

## 6. 請求生命週期（範例：新增疫苗紀錄）

```
POST /v1/pets/{id}/vaccines
  → Interface：驗證 JWT → 取 tenant/role → Zod 驗證 body
  → Application：RecordVaccineUseCase（開啟交易、設 RLS tenant）
      → Domain：Pet.addVaccine()（規則：日期不可未來、劑次遞增）
      → Port：HealthRepository.save()
      → 發 Domain Event：VaccineRecorded → Queue
  → Queue consumer：排下一劑提醒（Notification）、更新 AI 索引
  → 回傳 201 + 資源；Audit log 記錄 who/what/when
```

## 7. 環境與部署

- 環境：`dev` / `staging` / `prod`，各自獨立 CF 專案與 Neon 分支。
- 部署：GitHub Actions → 測試 → `wrangler deploy`；DB migration 走 CI（drizzle-kit，向前相容、可回滾）。
- 藍綠 / 漸進：Workers 版本化 + Gradual Deployments；migration 採 expand-and-contract。

## 8. 現況 → 目標的遷移策略

1. 保留既有靜態 PWA 為 **飼主/公開入口** 過渡使用（其隱私與官方合規精神保留）。
2. 新建 monorepo 與 API/Console，先做 Identity/Tenant/Pet/Health 垂直切片。
3. 提供從 `localStorage` / 官方 Excel 匯入的資料遷移工具，銜接舊使用者。
4. 逐 Context 上線，舊頁面逐步導流至新 Console。
