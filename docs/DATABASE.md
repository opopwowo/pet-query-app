# DATABASE — 資料模型與規模設計

> 引擎：**Postgres（Neon serverless）**，多租戶 **Row-Level Security**。ORM：**Drizzle**。
> 狀態：**Proposed**。以下 DDL 為設計草圖（示意，非最終 migration）。

## 0. 通用規範

- 主鍵：**UUID v7**（時間排序、避免熱點、不外洩序號）。
- 每張業務表必備：`tenant_id`（=organization_id）、`created_at`、`updated_at`、`created_by`、`deleted_at`（**Soft Delete**）。
- 時間一律 `timestamptz`（UTC）。金額用 `numeric`，不用 float。
- 命名：`snake_case`、表名複數（`pets`, `health_records`）。
- 列舉用 `text + CHECK` 或 Postgres `enum`（傾向 `text + CHECK`，migration 較彈性）。
- 所有外鍵帶 `tenant_id` 複合，避免跨租戶關聯。

## 1. 核心實體關係（概念）

```
organizations ─┬─ stores ─┬─ memberships ─ users
               │          └─ (資源可 scoped to store)
               ├─ subscriptions ─ invoices
               ├─ owners（飼主/客戶）
               ├─ pets ──┬─ chip_registrations
               │         ├─ health_records（疫苗/驅蟲/體重/病歷/用藥：type 區分）
               │         ├─ media_assets
               │         ├─ pedigree_links（父/母/子）
               │         └─ official_registrations
               ├─ breeding_cycles ─ litters ─ pets（新生）
               ├─ contracts ─ invoices
               ├─ ai_tasks
               ├─ notifications
               ├─ audit_logs
               ├─ api_keys / webhooks
               └─ feature_flags
```

## 2. Schema 草圖（節選）

```sql
-- 租戶
create table organizations (
  id            uuid primary key default uuid_generate_v7(),
  name          text not null,
  slug          text unique not null,
  plan          text not null default 'starter' check (plan in ('starter','pro','business','enterprise')),
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table stores (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references organizations(id),
  name          text not null,
  type          text not null check (type in ('cattery','kennel','petshop','clinic','grooming','hotel','other')),
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table users (               -- 由 Clerk/WorkOS 帶入，本表存 profile 與對應
  id            uuid primary key default uuid_generate_v7(),
  external_id   text unique not null,      -- IdP 的 user id
  email         citext unique not null,
  display_name  text,
  created_at    timestamptz not null default now()
);

create table memberships (          -- 員工 ↔ 組織/門市 ↔ 角色
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references organizations(id),
  user_id       uuid not null references users(id),
  store_id      uuid references stores(id),      -- null = 全組織
  role          text not null check (role in ('owner','admin','manager','vet','staff','viewer')),
  created_at    timestamptz not null default now(),
  unique (tenant_id, user_id, store_id, role)
);

-- 飼主（客戶）— 含高敏感個資
create table owners (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references organizations(id),
  store_id      uuid references stores(id),
  name          text not null,
  phone         text,
  email         citext,
  birthday      date,
  id_number_enc bytea,             -- 身分證/證號：欄位級加密（見 SECURITY）
  address       text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- 寵物主檔
create table pets (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references organizations(id),
  store_id      uuid references stores(id),
  owner_id      uuid references owners(id),
  name          text,
  species       text not null check (species in ('dog','cat','other')),
  breed         text,
  sex           text check (sex in ('male','female','unknown')),
  birth_date    date,
  neuter_status text check (neuter_status in ('intact','neutered','unknown')),
  status        text not null default 'active' check (status in ('active','sold','deceased','transferred','removed')),
  dam_id        uuid references pets(id),   -- 母
  sire_id       uuid references pets(id),   -- 父
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- 晶片登記
create table chip_registrations (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references organizations(id),
  pet_id        uuid not null references pets(id),
  chip_number   text not null,
  is_primary    boolean not null default true,
  lost_status   text,
  registered_at date,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (tenant_id, chip_number)
);

-- 健康紀錄（疫苗/驅蟲/體重/病歷/用藥，用 type 區分；大表）
create table health_records (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references organizations(id),
  pet_id        uuid not null references pets(id),
  type          text not null check (type in ('vaccine','deworming','weight','medical','medication','rabies')),
  occurred_on   date not null,
  data          jsonb not null default '{}',  -- type 專屬欄位（劑次/藥名/體重kg…）
  next_due_on   date,                          -- 疫苗/驅蟲下次到期 → 驅動提醒
  performed_by  text,
  created_at    timestamptz not null default now(),
  created_by    uuid,
  deleted_at    timestamptz
) partition by hash (tenant_id);                -- 依租戶 hash 分區

create table health_records_p0 partition of health_records for values with (modulus 8, remainder 0);
-- … p1..p7

-- 官方登記狀態（不存官方帳密！只存我方整備與比對結果）
create table official_registrations (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references organizations(id),
  pet_id        uuid not null references pets(id),
  official_ref  text,                 -- 官方編號（若有）
  sync_state    text not null default 'draft' check (sync_state in ('draft','ready','submitted_by_user','confirmed','drift')),
  last_diff     jsonb,                -- 與官方匯出的差異
  updated_at    timestamptz not null default now()
);

-- 稽核（append-only）
create table audit_logs (
  id            uuid primary key default uuid_generate_v7(),
  tenant_id     uuid not null references organizations(id),
  actor_id      uuid,
  action        text not null,        -- pet.update / vaccine.create …
  entity_type   text not null,
  entity_id     uuid,
  before        jsonb,
  after         jsonb,
  ip            inet,
  created_at    timestamptz not null default now()
);
```

## 3. Row-Level Security（多租戶核心）

```sql
alter table pets enable row level security;
create policy tenant_isolation on pets
  using (tenant_id = current_setting('app.tenant_id')::uuid);
-- 每個 request 交易開始時：set_config('app.tenant_id', $1, true)
```

> 每張業務表都套同樣 policy。即使應用層忘了加 `where tenant_id`，DB 仍強制隔離 → 縱深防禦。

## 4. 索引策略

| 表 | 索引 | 目的 |
| --- | --- | --- |
| pets | `(tenant_id, status)`、`(tenant_id, owner_id)`、`(tenant_id, updated_at desc)` | 列表/篩選/分頁 |
| pets | `gin (to_tsvector('simple', coalesce(name,'')||' '||coalesce(breed,'')))` | 全文搜尋 |
| chip_registrations | `unique(tenant_id, chip_number)`、`(tenant_id, pet_id)` | 查號/一對多 |
| health_records | `(tenant_id, pet_id, occurred_on desc)`、`(tenant_id, type, next_due_on)` | 時間軸 + 到期提醒 |
| owners | `(tenant_id, phone)`、全文 `(name)` | CRM 搜尋 |
| audit_logs | `(tenant_id, created_at desc)`、`(tenant_id, entity_type, entity_id)` | 稽核查詢 |

- **游標分頁**（keyset）：以 `(updated_at, id)` 為游標，避免 OFFSET 深分頁效能崩壞。
- 禁止 `SELECT *`；查詢一律帶 `tenant_id` 前綴索引。

## 5. 規模驗證（1000 店 / 100 萬寵物 / 5000 員工 / 1000 萬健康紀錄）

| 資料 | 量級 | 估算大小 | 撐得住？ |
| --- | --- | --- | --- |
| pets | 1,000,000 列 | ~0.5–1 GB | ✅ 有 `(tenant_id,…)` 索引，單租戶查詢僅命中該租戶分佈 |
| health_records | 10,000,000 列 | ~3–6 GB | ✅ hash 分區 + `(tenant_id,pet_id,occurred_on)` 索引；時間軸查詢走索引 |
| owners | ~數十萬 | 小 | ✅ |
| audit_logs | 成長最快（每動作一列） | 數十 GB/年 | ⚠️ 需 **時間分區 + 冷資料下放 R2**（見下） |

**結論：撐得住，但前提是做對三件事：**
1. **每查詢都帶 `tenant_id` 且命中複合索引**（RLS 不代替索引）。
2. **大表分區**：`health_records` 依 `tenant_id` hash 分區；`audit_logs` 依月份 range 分區，舊分區壓縮/歸檔到 R2（Parquet）。
3. **連線管理**：Workers 短連線 → 必經 **Hyperdrive**（連線池 + 邊緣快取），避免 Neon 連線耗盡。

**會出事的地方（誠實指出）：**
- N+1 查詢（列表載入每隻寵物再逐一查健康）→ 用 join / dataloader 批次。
- 深分頁 OFFSET → 改 keyset。
- 無界查詢（匯出全租戶）→ 走 Queue 背景任務 + 串流到 R2。
- RLS 在超大表的規劃器成本 → 對熱路徑加 policy 友善索引，必要時大租戶獨立 schema。
- `jsonb` 濫用（把該正規化的欄位塞 jsonb）→ 高頻查詢欄位需正規化並建索引。

## 6. 備份 / DR

- Neon PITR（Point-in-Time Recovery）+ 每日邏輯備份到 R2。
- 租戶級匯出（GDPR/PDPA「可攜」）：背景任務打包該租戶資料到 R2 簽章連結。
- 刪除採 Soft Delete；硬刪除走保留期後的排程清理（Cron）+ 稽核。

## 7. 附錄：平台/SaaS 相關表（草圖）

> 皆帶 `tenant_id` + RLS + soft delete（除註明 append-only 者）。

```sql
subscriptions(id, tenant_id, plan, seats, status, current_period_end, stripe_customer_id, stripe_sub_id)
invoices(id, tenant_id, amount numeric, currency, status, issued_at, paid_at, stripe_invoice_id)
usage_counters(id, tenant_id, metric, period, count)            -- AI/通知/儲存 計量
notifications(id, tenant_id, user_id, channel, template, payload jsonb, status, sent_at)
notification_prefs(id, tenant_id, user_id, channel, event_type, enabled)
connector_accounts(id, tenant_id, connector_id, auth_token_enc bytea, scopes, status)  -- 僅 token，永不存官方密碼
sync_sessions(id, tenant_id, connector_id, window_expires_at, batch jsonb, state)
plugin_installations(id, tenant_id, plugin_id, version, enabled, settings jsonb, granted_scopes text[])
custom_field_values(id, tenant_id, entity_type, entity_id, plugin_id, values jsonb)     -- 受控自訂欄位
webhooks(id, tenant_id, url, events text[], secret_enc bytea, status)
webhook_deliveries(id, tenant_id, webhook_id, event, status, attempts, last_at)         -- 投遞紀錄
api_keys(id, tenant_id, name, hash, scopes text[], last_used_at, revoked_at)            -- 只存雜湊
feature_flags(id, tenant_id, key, value jsonb)                                          -- 亦可存 KV
ai_tasks(id, tenant_id, type, input jsonb, status, result jsonb, result_r2_key, cost, created_by)
vectors(id, tenant_id, entity_type, entity_id, embedding vector(1536))                  -- pgvector，RAG（租戶隔離）
```

