# TECH_STACK — 技術選型

> 原則：TypeScript 全棧、Edge-native、Repository 抽象（可換儲存）、型別安全端到端。
> 狀態：**Proposed**。每項選擇皆附替代方案與理由，詳見 [DECISIONS.md](./DECISIONS.md)。

## 總覽

| 層 | 選擇 | 替代方案 | 理由摘要 |
| --- | --- | --- | --- |
| 語言 | **TypeScript** | — | 前後端共用型別、生態成熟 |
| 邊緣運算 | **Cloudflare Workers** + **Hono** | Node/Fastify、Deno | 全球低延遲、與 CF 生態整合、成本低 |
| 主資料庫 | **Postgres（Neon serverless）** via **Hyperdrive** | D1、PlanetScale、Supabase | 關聯查詢 + RLS 多租戶 + 撐得住 10M+ 列（見 DATABASE） |
| ORM / Migration | **Drizzle ORM** + drizzle-kit | Prisma、Kysely | 輕量、Edge 友善、可同時支援 PG/D1 |
| 物件儲存 | **Cloudflare R2** | S3 | 照片/影片/文件/備份，零 egress 費 |
| 邊緣快取/設定 | **Cloudflare KV** | Redis | Feature flag、設定、熱資料快取 |
| 非同步任務 | **Cloudflare Queues** | SQS | 通知、AI、文件生成、官方比對 |
| 排程 | **Cloudflare Cron Triggers** | — | 疫苗/驅蟲提醒、訂閱檢查、報表 |
| 狀態協調/即時 | **Durable Objects** | Redis+WS | 官方同步 Session 視窗、即時協作、rate-limit |
| 圖片處理 | **Cloudflare Images** | imgproxy | 縮圖、格式轉換、CDN |
| AI | **Claude API**（via **CF AI Gateway**）+ Workers AI（嵌入/OCR） | OpenAI | 高階推理與 tool-use；Gateway 做快取/限流/觀測 |
| 前端（後台） | **React + TypeScript + Vite**（SPA）on **Cloudflare Pages** | Next.js、Remix | 內部後台以 SPA 為主；SSR 需求低 |
| 前端路由/資料 | **TanStack Router + TanStack Query** | React Router | 型別安全路由 + 伺服器狀態快取 |
| UI 基礎 | **Radix UI Primitives + Tailwind CSS** + 自建 Design System | shadcn/ui、MUI | 無障礙 primitives + 完全掌控視覺（Linear/Stripe 級） |
| 表單/驗證 | **React Hook Form + Zod**（前後端共用 schema） | Yup | 單一 schema 前後端共用 |
| 認證 | **Clerk**（MVP）→ **WorkOS**（Enterprise SSO/SAML） | Auth0、自建 Lucia | 內建 Organizations、快速；企業期換 SSO |
| 金流 | **Stripe**（Billing + Metered + Invoicing） | TapPay（在地信用卡） | 訂閱/用量計費成熟；在地金流後補 |
| 觀測 | **Sentry** + **CF Analytics/Logpush** + OpenTelemetry | Datadog | 錯誤追蹤 + 邊緣觀測 |
| 測試 | **Vitest**（unit）、**Playwright**（e2e）、**Schemathesis/Dredd**（API 契約） | Jest | Edge 友善、快速 |
| CI/CD | **GitHub Actions** + **Wrangler** | — | 自動測試/部署 |
| IaC | **Wrangler** + **Terraform**（CF provider） | Pulumi | 環境可重現 |
| Monorepo | **pnpm workspaces** + **Turborepo** | Nx | 前後端/共用套件同倉 |

## Monorepo 結構（提案）

```
/
├── apps/
│   ├── api/            Cloudflare Worker（Hono）— REST API + Queues consumer + Cron
│   ├── web/            React SPA（後台後台/Console）on Pages
│   └── portal/         飼主 Client Portal（後期，可與 web 共用 DS）
├── packages/
│   ├── domain/         純領域模型（entities/value objects/domain services）— 無框架相依
│   ├── contracts/      Zod schema + OpenAPI 型別（前後端共用）
│   ├── db/             Drizzle schema、migrations、repository 介面
│   ├── ui/             Design System（tokens + components）
│   ├── ai/             AI 使用案例、prompt、tool 定義、eval
│   └── config/         eslint/tsconfig/tailwind preset 共用
├── infra/              Terraform + wrangler.toml
└── docs/               本目錄
```

## 為何不是純 D1 / 純靜態

- 現況（GitHub Pages 靜態 + `localStorage`）**無法**承載多租戶、RBAC、稽核、訂閱 — 這些都需要伺服器與資料庫。
- **D1**（Cloudflare SQLite）單庫上限與單區特性，難以單庫承載 10M+ 列的多租戶關聯查詢；若堅持 CF-native，替代路徑是「**每租戶一個 D1**」分片（見 ADR-0003）。本文件主線採 **Postgres + Hyperdrive**（RLS 多租戶）為首選，D1 作為小型部署 / 邊緣快取的備選。
