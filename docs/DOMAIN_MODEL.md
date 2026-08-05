# DOMAIN_MODEL — 領域模型（DDD）

> 這是**領域**的模型（聚合/實體/值物件/事件/不變式），與 [DATABASE.md](./DATABASE.md)（實體儲存）分離。
> 狀態：**Proposed / 待凍結**。

## 1. Ubiquitous Language（共同語言）

| 詞彙 | 定義 |
| --- | --- |
| Organization（租戶/業者） | 一個合法業者帳號，計費與隔離的邊界 |
| Store（門市） | 業者下的實體/邏輯門市，資源可 scoped |
| Member（成員） | 使用者在某租戶的身分 + 角色 |
| Owner（飼主/客戶） | 寵物的擁有者；CRM 對象 |
| Pet（寵物） | 平台核心；擁有一生的紀錄 |
| Chip（晶片） | 寵物身分識別；對應官方登記 |
| Health Event（健康事件） | 疫苗/驅蟲/體重/病歷/用藥 的一次紀錄 |
| Breeding Cycle（配種週期） | 一次配種→懷孕→生產的過程 |
| Litter（一窩） | 一次生產產生的幼體集合 |
| Official Registration（官方登記） | 寵物在政府平台的登記狀態 |
| Connector（連接器） | 對外系統（政府/協會/第三方）的整合模組 |
| Sync Session（同步工作階段） | 一次官方登入視窗內的整備/送出協調 |
| Contract（合約） | 交易/售後文件 |
| AI Task（AI 任務） | 一次 AI 代勞的工作單 |

## 2. 聚合（Aggregates）與邊界

> 原則：聚合要小；跨聚合以 **id 參照** + **領域事件**，不直接持有對方物件。

| 聚合根 | 內含 | 不變式（Invariants） |
| --- | --- | --- |
| **Organization** | Stores, Members, Subscription（參照） | slug 唯一；至少一名 `owner` 角色；停用後不可新增資料 |
| **Owner** | 聯絡資訊、加密證號 | 同租戶內電話/證號雜湊唯一（軟性）；證號僅加密儲存 |
| **Pet** | 基本屬性、父母參照(dam/sire)、狀態 | 出生日不可為未來；`deceased/removed` 後不可再新增健康事件；父母須同物種 |
| **ChipRegistration** | 晶片號、主/副、遺失狀態 | `(tenant, chip_number)` 全域唯一；每寵物至多一個 primary |
| **HealthRecord** | type、日期、type 專屬資料、下次到期 | 日期不可未來；`weight>0`；疫苗劑次遞增；`next_due_on ≥ occurred_on` |
| **BreedingCycle** | 母/父、配種日、懷孕、Litter | 母須為 female 且成年；Litter 幼體數 ≥ 0；產仔日 ≥ 配種日 |
| **OfficialRegistration** | 官方編號、sync_state、last_diff | 狀態機（見下）；不含官方帳密 |
| **SyncSession** | connector、批次項目、視窗 | 視窗有效期內有效；逾時自動失效 |
| **Contract** | 模板、當事人、金額、狀態 | 金額 numeric ≥ 0；簽署後不可改內容（新版取代） |
| **Subscription** | 方案、席次、用量、狀態 | 用量不可超出方案硬上限；停用後功能降級 |
| **AiTask** | 輸入、狀態、產出參照 | 狀態機 queued→running→succeeded/failed；產出需人工確認才生效 |
| **Notification** | 對象、通道、狀態 | 依使用者偏好；失敗重試上限 |
| **AuditLog** | actor/action/before/after | Append-only，不可修改/刪除 |

## 3. 關鍵值物件（Value Objects）

- `ChipNumber`：正規化（去連字號、長度校驗）、相等以值判定。
- `TaiwanId`：加密封裝；對外只暴露遮罩；比對用雜湊。
- `Money`：`amount(numeric) + currency`；不可用浮點。
- `DateRange`、`Weight(kg)`、`VaccineDose(no, vaccine, next_due)`、`Address`。

## 4. 領域事件（Domain Events）

> 事件經 Queue 廣播，驅動跨 Context 反應（提醒、AI 索引、稽核、Webhook）。

`OrganizationCreated` · `MemberInvited/RoleChanged` · `PetRegistered` · `PetStatusChanged` · `ChipAssigned` · `HealthEventRecorded` · `VaccineDue`（由 Cron 依 `next_due_on` 產生）· `BreedingStarted` · `LitterBorn` · `OfficialDriftDetected` · `OfficialSubmittedByUser` · `ContractSigned` · `InvoicePaid` · `SubscriptionChanged` · `AiTaskSucceeded/Failed`

## 5. 狀態機（節選）

```
Pet.status:        active → (sold | transferred | deceased | removed)
OfficialReg:       draft → ready → submitted_by_user → confirmed
                                        └────────────→ drift → ready
AiTask:            queued → running → (succeeded | failed)
Subscription:      trialing → active → (past_due → canceled)
```

## 6. Context Map（Context 間關係）

- **Identity/Tenancy** 為所有 Context 的上游（提供 tenant/role context）。
- **Pet ↔ Health/Chip/Breeding/Media**：Customer–Supplier（Pet 為核心，其他參照 pet_id）。
- **Official Connector**：對外系統用 **Anti-Corruption Layer** 隔離 —— 外部（官方 Excel/協會格式）不可污染領域模型，一律經 mapping 轉譯。
- **AI**：作為「服務層消費者」，透過 use case（工具）操作各 Context，不直接碰資料表。
- **Platform（Audit/Plugin/Webhook）**：橫切關注點，訂閱所有領域事件。

## 7. 反腐層（Anti-Corruption Layer）

政府/協會/第三方的資料格式各異且會改版 → 每個 Connector 提供 `toDomain()/fromDomain()` 轉譯，領域模型永遠乾淨、穩定。詳見 [OFFICIAL_CONNECTOR.md](./OFFICIAL_CONNECTOR.md)。
