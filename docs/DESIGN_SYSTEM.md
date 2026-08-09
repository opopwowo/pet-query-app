# DESIGN_SYSTEM — 設計系統

> 目標質感：**Apple HIG · Linear · Stripe · Notion · Material 3 的克制與精緻**。
> 不要：卡通、玩具感、廉價 ERP。內容優先、密度與呼吸感並存、預設無障礙。
> 狀態：**Proposed / 待凍結**。可複用現有已驗證的深/淺色 tokens 與無障礙基礎。

## 1. 設計原則

1. **Clarity over decoration** — 資訊層級清楚，裝飾不搶戲。
2. **Content-first density** — 專業工具需高資訊密度，但留白節奏一致。
3. **Calm & premium** — 中性色為主，品牌色點綴；動效輕、有意義。
4. **Accessible by default** — WCAG 2.2 AA 是底線，不是加分。
5. **Consistent, tokenized, themeable** — 一切走 token；深/淺色與未來品牌換色零改元件。

## 2. Foundations（Design Tokens）

以 CSS 變數為單一來源（沿用現有 `--bg/--card/--ink/--muted/--line/--brand…` 語意 token，已通過 AA 對比驗證）。

| 類別 | 說明 |
| --- | --- |
| **Color（語意）** | `bg / surface / surface-2 / ink / muted / line / brand / brand-ink / success / warning / danger / focus`，各有 light + dark 值 |
| **Typography** | 字級尺標（12/14/16/18/20/24/30/36）、行高、字重；中文 `PingFang/Noto Sans TC`，數字 tabular |
| **Spacing** | 4pt 網格（4/8/12/16/20/24/32/40/48） |
| **Radius** | `sm 8 / md 12 / lg 16 / pill` |
| **Elevation** | 陰影階梯（token 化，深色改用邊框/微光） |
| **Motion** | duration（120/180/240ms）、easing（standard/decelerate）、**必附 `prefers-reduced-motion`** |
| **Z-index** | 統一層級尺標（dropdown/sticky/modal/toast） |

## 3. 主題（Theming）

- 跟隨系統 `prefers-color-scheme` + 手動切換（auto/light/dark），狀態存 localStorage（現有機制可直接沿用並升級）。
- 主題只換 token，不改元件邏輯；未來多品牌/白牌走 token set。
- `color-scheme` 與 `theme-color` 同步（現有實作已具備）。

## 4. 元件庫（技術：Radix Primitives + Tailwind + CVA）

> 用 Radix 拿到無障礙互動 primitives（焦點管理、鍵盤、ARIA），視覺由我方 tokens 完全掌控。

核心元件（Phase 0 起）：
- **Primitives**：Button、IconButton、Input、Textarea、Select、Combobox、Checkbox/Radio/Switch、Tooltip、Tabs、Dialog/Sheet、Popover、DropdownMenu、Toast、Badge/Tag、Avatar、Skeleton、EmptyState。
- **Data**：DataTable（排序/分頁/選取/虛擬滾動）、DescriptionList、Timeline（寵物一生）、StatCard、Chart（圖表 token 對齊）。
- **Patterns**：Form（RHF + Zod）、FilterBar、Pagination（游標）、PageHeader、SideNav、CommandPalette（⌘K）、ConfirmDialog、FileUpload（R2 簽章）。

## 5. 無障礙基線（WCAG 2.2 AA）

- 對比：正常文字 ≥ 4.5:1、大字/UI ≥ 3:1（沿用現有對比驗證方法，納入 CI）。
- **Focus visible**（2.4.7）、**Focus not obscured**（2.4.11，2.2 新增）。
- **Target size ≥ 24px**（2.5.8，2.2 新增）。
- 鍵盤全可操作、拖曳需替代方案（2.5.7）、`aria-*` 正確、表單有標籤。
- 動效尊重 reduced-motion。
- 自動化：axe 於 CI；元件於 Storybook 附 a11y 測試。

## 6. 治理與交付

- **Storybook** 為元件單一事實來源 + 視覺/無障礙回歸。
- 版本化（semver）、變更以 PR + 視覺 diff 審核。
- 設計 token 由設計與工程共管；Figma 變數 ↔ CSS 變數對齊（後期）。
- Icon：統一線性圖示集（取代目前 emoji 作為功能性圖示；emoji 僅裝飾且 `aria-hidden`）。

## 7. 從現況遷移

- 現有三頁的 token/深色/無障礙**經驗與數值可直接帶入** DS v0。
- 但逐頁手刻 CSS 需**收斂為元件**；新 Console 一律使用 DS，不再複製貼上。
