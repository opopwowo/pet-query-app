# API — REST 設計規範

> 風格：資源導向 REST、`/v1` 版本、JSON、型別由 **Zod → OpenAPI** 單一來源產生。
> 狀態：**Proposed**。所有端點皆為多租戶且經 RBAC。

## 1. 通則

- Base：`https://api.petcompanion.tw/v1`
- 版本：URL 前綴 `/v1`（破壞性變更才進 `/v2`；非破壞走欄位新增）。
- 認證：`Authorization: Bearer <JWT>`（由 Clerk/WorkOS 簽發，含 `org_id`、`sub`、roles）。
- 租戶：由 JWT 的 `org_id` 決定，**不接受** client 傳 tenant_id（防越權）。
- 內容：`application/json`；時間 ISO-8601 UTC；金額字串 `numeric`。
- **Idempotency**：所有 `POST` 接受 `Idempotency-Key` header（去重）。
- **Request ID**：回應帶 `X-Request-Id`，貫穿日誌/稽核。

## 2. 資源與端點（節選）

```
GET    /v1/pets?cursor=&limit=&status=&owner_id=&q=&sort=-updated_at
POST   /v1/pets
GET    /v1/pets/{id}
PATCH  /v1/pets/{id}
DELETE /v1/pets/{id}                 # soft delete
GET    /v1/pets/{id}/timeline        # 聚合：健康/晶片/官方/媒體/合約
POST   /v1/pets/{id}/vaccines
GET    /v1/pets/{id}/health?type=vaccine&cursor=
POST   /v1/owners        GET /v1/owners/{id}   ...
POST   /v1/breeding-cycles ...
POST   /v1/official-sync/sessions        # 建立官方同步工作階段（見 OFFICIAL_SYNC）
POST   /v1/ai/tasks                       # 觸發 AI 任務（非同步）
GET    /v1/ai/tasks/{id}
POST   /v1/media:presign                  # 取得 R2 上傳簽章
GET    /v1/audit-logs?entity_type=&entity_id=
```

## 3. 分頁 / 排序 / 篩選

- **游標分頁（keyset）**：`?limit=50&cursor=<opaque>`；回應：
  ```json
  { "data": [ … ], "page": { "next_cursor": "…", "has_more": true } }
  ```
- 排序：`?sort=-updated_at,name`（`-` 為降冪，白名單欄位）。
- 篩選：白名單查詢參數；複雜查詢用 `?filter[status]=active&filter[species]=cat`。
- 搜尋：`?q=` 走 Postgres 全文索引（見 DATABASE）。

## 4. 標準回應與錯誤

```json
// 成功
{ "data": { "id": "…", "type": "pet", … } }

// 錯誤（RFC 9457 problem+json 精神）
{
  "error": {
    "type": "https://api.petcompanion.tw/errors/validation",
    "code": "validation_failed",
    "message": "birth_date 不可為未來",
    "request_id": "req_…",
    "details": [ { "field": "birth_date", "issue": "must_be_past" } ]
  }
}
```

- HTTP 狀態語意化：`400/401/403/404/409/422/429/5xx`。
- `409 conflict` 用於 idempotency/樂觀鎖（`If-Match` + `ETag`）。

## 5. Rate Limiting

- 每租戶 + 每 API Key 額度（**Durable Object** 計數器 / 滑動視窗）。
- 回應 header：`RateLimit-Limit / RateLimit-Remaining / RateLimit-Reset`；超限 `429`。
- 分級：一般讀 > 寫 > AI/匯出（AI/匯出走佇列，回 `202 Accepted` + 任務資源）。

## 6. 非同步任務（AI / 匯出 / 官方比對）

```
POST /v1/ai/tasks → 202 { "data": { "id":"task_…","status":"queued" } }
GET  /v1/ai/tasks/{id} → { status: queued|running|succeeded|failed, result_url? }
Webhook：task.succeeded / task.failed（見 §8）
```

## 7. OpenAPI / SDK

- **單一來源**：Zod schema（`packages/contracts`）→ 產生 OpenAPI 3.1 + TS client + 文件。
- 契約測試（Schemathesis/Dredd）在 CI 驗證實作符合規格。
- 對外提供型別化 SDK（TS 優先）。

## 8. Webhooks（對外整合）

- 事件：`pet.created`、`vaccine.due`、`official.drift_detected`、`task.succeeded`、`invoice.paid`…
- 安全：HMAC 簽章（`X-Signature`）、時間戳防重放、失敗指數退避重送、可於後台查看投遞紀錄。

## 9. 相容與治理

- 破壞性變更政策 + 淘汰（Deprecation header + sunset 日期）。
- 每個端點標註所需權限（RBAC scope），文件自動列出。
- 稽核：所有寫入端點寫 `audit_logs`。
