# VISION — 願景與產品定位

## Positioning（定位）

> **AI Powered Pet Management Platform** — 給合法寵物業者的營運中樞。
> 一隻寵物從出生到終身的所有資料，只輸入一次，全系統（ERP/CRM/健康/繁殖/合約/官方）共用，AI 代勞重複工作。

## Core Value（核心價值）

1. **Single Source of Truth** — 消除 Excel/LINE/紙本的重複輸入。
2. **Lifetime Record** — 一隻寵物的一生可追蹤、可稽核、可交付給飼主。
3. **AI that works** — AI 真正完成流程，不只是問答。
4. **Compliant by design** — 官方登記合法協助；個資（PDPA）內建保護。
5. **Multi-tenant SaaS** — 千店共用，一致演進。

## Target Users（目標客群）

| 角色 | 說明 | 主要價值 |
| --- | --- | --- |
| 貓舍 / 犬舍 / 繁殖業者 | 配種、血統、產仔、晶片、官方登記 | 繁殖生命週期 + 官方同步 |
| 寵物店 | 銷售、合約、售後、客戶關係 | CRM + 合約 + 收據 |
| 動物醫院 | 病歷、疫苗、驅蟲、體重、用藥 | 健康中心 + 提醒 |
| 寵物美容 / 旅館 | 預約、服務紀錄、客戶 | 排程 + CRM（後期模組） |
| 飼主 | 檢視自己毛孩的一生紀錄 | Client Portal（唯讀為主） |
| 平台營運方 | 管理租戶、計費、稽核 | SaaS 後台 |

## Business Model（商業模式）

- **SaaS 訂閱**（每月/年）：依 **門市數 / 員工席次 / 寵物筆數 / AI 用量** 分級（Starter / Pro / Business / Enterprise）。
- **用量計費（Metered）**：AI Center 任務、文件生成、簡訊/推播通知、儲存空間（R2）。
- **平台加值**：Plugin / Marketplace（第三方模組抽成，後期）、Enterprise SSO/稽核合約。
- **導入服務**：資料遷移、教育訓練（一次性）。

## Competitive Advantage（競爭優勢）

1. **在地化 + 合法官方同步**：針對台灣官方登記流程（無 API、驗證碼、20 分鐘登出）設計的合法同步中心，是國外通用寵物軟體做不到的護城河。
2. **繁殖生命週期完整度**：配種→懷孕→產仔→晶片→官方→交付，端到端，貓舍/犬舍剛需。
3. **AI 代勞**：把非結構化（LINE/Excel/手寫）自動轉為結構化資料並自動產文件。
4. **Edge-native 效能**：Cloudflare 全球邊緣，低延遲、低成本、易擴充。
5. **可交付的一生紀錄**：飼主拿到完整血統/健康履歷，提升業者信任與品牌。

## Product Map（模組地圖）

```
寵伴 Platform
├── 🐾 Pet Management        寵物主檔 / 血統 / 家族
├── 👨‍👩‍👧 Owner Management       飼主 / 客戶 CRM
├── 💉 Health Center          疫苗 / 驅蟲 / 體重 / 病歷 / 用藥
├── 🧬 Chip Center            晶片 / 多晶片 / 遺失狀態
├── 🏛 Official Sync Center   官方登記資料整備 / 差異比對 / 引導送出
├── 📄 Contract Center        合約 / 收據 / 電子簽署（後期）
├── 📷 Media Center           照片 / 影片 / 文件（R2）
├── 🤖 AI Center              整理 / 提醒 / 搜尋 / 生成 / 自動化
├── 📊 Dashboard              營運儀表板 / 報表
├── 💳 SaaS Billing           訂閱 / 用量 / 發票
├── 🔑 RBAC                   組織 / 門市 / 角色 / 權限
└── ⚙️ System Center          稽核 / 設定 / API Key / Webhook / Plugin
```

## North-Star Metric

**WAO（Weekly Active Organizations）× 每租戶每週實際節省工時。**
若業者每週省下數小時重複工作，留存與口碑自然成立。
