# OFFICIAL_CONNECTOR — 政府/外部連接器框架（Government Connector Framework）

> 從「pet.gov.tw 官方登記助手」升級為**可插拔的連接器框架**：
> 未來可接 **官方寵物登記系統 / 其他政府平台 / 協會平台 / 第三方服務**。
> **紅線不變**：無官方 API 者，不繞驗證、不模擬登入、不存密碼，使用者本人送出。
> 狀態：**Proposed / 待凍結**。（[OFFICIAL_SYNC.md](./OFFICIAL_SYNC.md) 為本框架下 pet.gov.tw 的第一個 connector 實例）

## 1. 設計目標

- **一套抽象、多個實作**：pet.gov.tw 只是第一個 connector。
- **能力分級**：不同來源能力不同（有無 API、能否寫入、是否需人工）→ 用 **Capability Flags** 描述，而非寫死流程。
- **反腐層**：外部格式不污染領域模型（見 DOMAIN_MODEL §7）。
- **合規優先**：每個 connector 明確標示合法邊界；預設「協助/引導」，僅在來源提供**官方 API/授權**時才允許自動化。
- **以 Plugin 交付**：新增 connector = 實作介面 + manifest，作為 plugin 安裝（見 PLUGIN_SYSTEM）。

## 2. Connector 介面（概念）

```ts
interface Connector {
  meta: { id: string; name: string; kind: 'government'|'association'|'third_party'; region: 'TW'|... };
  capabilities: {
    hasOfficialApi: boolean;      // 有無合法 API
    canImportExport: boolean;     // 匯入官方匯出檔
    canDiff: boolean;             // 差異比對
    canGuidedSubmit: boolean;     // 引導使用者本人送出
    canDeepLink: boolean;         // 深連結到對應官方頁
    canAutoSync: boolean;         // 僅當 hasOfficialApi && 已授權 才為 true
  };
  // 反腐層：外部 ↔ 領域
  toDomain(external: unknown): DomainRecords;
  fromDomain(records: DomainRecords): ExternalPayload;
  // 動作（依 capability 提供）
  prepare(session): PreparedBatch;         // 整備
  reconcile(officialExport): DiffResult;   // 比對
  guide(session): GuidedSteps;             // 引導（含可複製欄位/deep link）
  // 有 API 時才實作：
  authorize?(oauth): ConnectorAccount;     // 加密儲存 token（非密碼）
  push?(records): SyncResult;              // 合法寫入
  pull?(query): DomainRecords;             // 合法讀取
}
```

## 3. Capability 驅動的流程

| 來源型態 | 典型能力 | 流程 |
| --- | --- | --- |
| pet.gov.tw（無 API、驗證碼、20 分登出） | import/export、diff、guided、deeplink；`canAutoSync=false` | **整備 → 比對 → 引導本人送出** |
| 假設某政府平台有 OAuth API | 全能力；`canAutoSync=true` | 授權後可**合法**自動 push/pull（token 加密儲存） |
| 協會平台（會員/血統） | import/export、diff | 匯入比對、單向同步 |
| 第三方服務（金流/簡訊/雲端） | API + webhook | 標準 OAuth/API Key 整合 |

> **關鍵**：是否自動化取決於**來源是否提供合法 API 與授權**，不是我們想不想；pet.gov.tw 一律人工送出。

## 4. Sync Engine（同步引擎）

```
狀態：draft → ready → submitted_by_user → confirmed
                         └───────────→ drift → ready
```
- **Sync Session（Durable Object）**：協調登入視窗（如 20 分鐘），把該批次要做的事一次列出。
- **Diff 引擎**：官方匯出 vs 平台 → 三態（僅官方有/僅平台有/不一致=drift）。
- **事件**：`OfficialDriftDetected`、`OfficialSubmittedByUser` → 通知/稽核。

## 5. 資料與安全

- `connector_accounts`：僅存**授權 token（加密）**，**永不存官方密碼**；無 API 者不存任何憑證。
- 官方匯出的原始個資檔：解析比對後即棄，最小保存。
- 所有連接器動作寫 `audit_logs`。
- 每個 connector 宣告其**合法邊界文件**（條款、可否自動化），平台強制執行。

## 6. 註冊與設定

- Connector Registry（隨 plugin 安裝註冊）：提供 UI 卡片、設定 schema、能力宣告、Cron（若需定期比對）。
- 每租戶可啟用/設定各自的 connectors（Feature Flag + 設定）。

## 7. 擴充範例（未來新增一個 connector）

1. 實作 `Connector` 介面 + `toDomain/fromDomain`。
2. 撰寫 manifest（能力、權限、UI、合法邊界）。
3. 以 plugin 形式安裝 → 出現在 Sync Center。
   —— **不需改核心程式**。
