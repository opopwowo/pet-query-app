# PLUGIN_SYSTEM — 插件架構

> **Plugin 不是後期功能，而是架構第一天的基礎。** 連內部模組也用同一套擴充點（dogfooding）。
> 目標：產業長尾需求（不同店型/協會/政府/第三方）用**模組與擴充點**吸收，**不寫死單店**。
> 狀態：**Proposed / 待凍結**。

## 1. 核心理念

- **一切皆模組**：Pet/Health/Breeding… 內部 Context 與第三方 plugin **實作相同的擴充點契約**。核心穩定、周邊可插拔。
- **Capability-based security**：plugin 宣告所需能力（scopes），租戶管理者授權；預設最小權限。
- **不碰資料庫**：plugin 只能透過 **Platform SDK / 內部 API** 操作，帶 tenant + 權限 + 稽核，**永不直接存取 DB**。
- **多租戶感知**：安裝/啟用/設定皆 per-organization。

## 2. Plugin Manifest（宣告式）

```jsonc
{
  "id": "com.vendor.pedigree-pro",
  "version": "1.2.0",
  "name": "血統書 Pro",
  "capabilities": ["pets:read", "media:write", "ai:tool", "report:widget"],
  "extensionPoints": {
    "customFields": [{ "entity": "pet", "fields": [/* 自訂欄位 schema */] }],
    "uiSlots": ["pet.detail.tab", "dashboard.widget"],
    "eventHooks": ["PetRegistered", "LitterBorn"],
    "jobs": [{ "cron": "0 2 * * *", "handler": "nightlyPedigreeSync" }],
    "connectors": ["kennelClubTW"],
    "aiTools": ["generate_pedigree_pdf"]
  },
  "settingsSchema": { /* Zod/JSON schema */ },
  "webhooks": ["pet.created"]
}
```

## 3. 擴充點（Extension Points）

| 擴充點 | 用途 | 範例 |
| --- | --- | --- |
| **Custom Fields** | 為實體加自訂欄位（不改 schema，存 `jsonb`/EAV 受控） | 貓舍加「毛色基因」 |
| **UI Slots** | 在既定插槽注入元件（宣告式，受 DS 約束） | 寵物詳情頁加分頁 |
| **Event Hooks** | 訂閱領域事件做反應 | `LitterBorn` → 自動建登記待辦 |
| **Scheduled Jobs** | 註冊 Cron 任務 | 每日對帳 |
| **Connectors** | 新增政府/協會/第三方連接器 | 見 OFFICIAL_CONNECTOR |
| **AI Tools** | 為 AI 註冊可呼叫工具 | 「產生血統書」 |
| **Report Widgets** | 儀表板/報表元件 | 繁殖成效圖 |
| **Workflows** | 多步驟自動化流程 | 交付 SOP |

## 4. 權限模型（Capabilities / Scopes）

- 格式 `resource:action`（`pets:read`、`media:write`、`ai:tool`、`billing:none`…）。
- Plugin 只能取得**宣告且被授權**的 scope；SDK 每次呼叫再校驗 tenant + scope + RBAC。
- 敏感 scope（`pii:reveal`、`billing:manage`）需租戶管理者明確授權並記稽核。

## 5. 隔離與信任等級

| 等級 | 執行方式 | 適用 |
| --- | --- | --- |
| **First-party（內部模組）** | 同進程，受擴充點契約約束 + lint 邊界 | 核心 Context |
| **Verified（審核第三方）** | 經 SDK/API，資源配額限制 | 官方市集上架 |
| **Sandboxed（未信任，後期）** | 獨立 Worker / 受限 API 面 / 逾時與配額 | 第三方任意程式 |

> MVP 只需 first-party 擴充點契約成立；第三方沙箱與市集為後期（見 ROADMAP）。**但契約現在就要凍結**，否則日後開放第三方等於重寫。

## 6. 生命週期（per tenant）

```
discover → install → grant capabilities → configure → enable
        → upgrade（相容性檢查）→ disable → uninstall（保留/清理資料策略）
```
- 版本相容：manifest 宣告相容的 Platform API 版本；破壞性升級需遷移腳本。
- 移除：預設保留資料（可匯出），硬刪除走保留期 + 稽核。

## 7. 對架構的影響（為何現在就要定）

- **Module Registry**：路由/權限/事件/Cron/Nav 統一註冊點（內外部共用）。
- **穩定的內部 SDK/API 契約**：plugin 與核心之間的邊界即 [API.md](./API.md) + 事件契約。
- **Feature Flags（KV）**：控制模組對方案/租戶的開關。
- 若這些不在 Phase 0 的骨架中，後期開放生態將付出重寫代價 → 列為凍結必辦。
