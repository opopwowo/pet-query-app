# SECURITY — 安全與合規

> 原則：**Secure by default、縱深防禦、最小權限、可稽核**。合規對象：台灣個資法（PDPA）。
> 狀態：**Proposed**。

## 1. Authentication（認證）

- 由 **Clerk/WorkOS** 簽發 JWT（短效 access + refresh；企業期支援 SAML/SCIM SSO）。
- Worker 端驗證 JWT 簽章與 `aud/iss/exp`；解出 `org_id`、`sub`、roles。
- MFA、裝置管理、Session 撤銷交由 IdP；平台側可強制企業租戶開啟 MFA。

## 2. Authorization（授權 / RBAC）

- 角色：`owner / admin / manager / vet / staff / viewer`（可擴充為自訂角色 + 權限集）。
- 權限模型：`resource:action`（如 `pet:read`, `health:write`, `billing:manage`, `official:sync`）。
- **雙層強制**：
  1. **應用層**：每個 use case 宣告所需權限，middleware 檢查。
  2. **資料層**：Postgres **RLS** 以 `tenant_id` 隔離（即使應用層漏擋也守得住）。
- **Store scoping**：資源可限定門市；跨店存取由角色決定。
- **越權防護**：tenant_id 一律來自 JWT，非 client 輸入；物件存取檢查 owner/tenant（防 IDOR/BOLA）。

## 3. Audit Log（稽核）

- Append-only `audit_logs`：who / action / entity / before / after / ip / time。
- 覆蓋：登入、資料 CRUD、權限變更、匯出、官方同步、AI 動作、計費。
- 不可竄改：僅新增；定期歸檔到 R2（WORM 精神）。

## 4. 資料保護（PDPA）

| 措施 | 說明 |
| --- | --- |
| **欄位級加密** | 身分證/證號 (`id_number_enc`)、必要 PII 以 KMS/信封加密儲存 |
| **傳輸加密** | 全站 TLS；HSTS |
| **最小揭露** | 預設遮罩（`A12***789`）；完整值需 `pii:reveal` 權限且寫稽核 |
| **資料可攜/刪除** | 租戶級匯出、可攜；到期硬刪除 + 稽核（被遺忘權） |
| **保留政策** | 依法定/合約保留期；逾期自動清理（Cron） |
| **資料落地** | 明確告知資料儲存區域；DPA/隱私權政策 |

## 5. 應用層風險（OWASP）與對策

| 風險 | 對策 |
| --- | --- |
| **Injection** | Drizzle 參數化查詢；禁字串拼接 SQL |
| **XSS** | 前端框架自動轉義；CSP；富文本淨化（DOMPurify）。（註：現有靜態頁 `registry.html` 已用 `esc()` 轉義，但 `innerHTML` 拼接仍是未來重寫點） |
| **CSRF** | Bearer token（非 cookie session）為主；若用 cookie 則 SameSite + CSRF token |
| **Broken Access Control / IDOR** | tenant_id 由 token；每次物件存取檢查歸屬；RLS 兜底 |
| **File Upload** | R2 簽章直傳 + 型別/大小限制 + 病毒掃描（Queue）+ 私有桶 + 簽章讀取 |
| **SSRF** | 官方同步不由伺服器代抓官網（見 OFFICIAL_SYNC）；外呼白名單 |
| **Secrets** | Workers Secrets / KMS；不進 repo；金鑰輪替 |
| **Rate abuse** | 每租戶/Key 限流（Durable Object）；AI/匯出配額 |
| **Dependency** | SCA（Dependabot/Snyk）；SBOM；鎖版本 |

## 6. Secrets 與金鑰

- 分環境（dev/staging/prod）；最小權限 API token；定期輪替。
- AI/金流/IdP 金鑰只存伺服器端；client 永不接觸。

## 7. 監控與應變

- Sentry（錯誤）+ CF Logpush/Analytics（流量/WAF）+ 告警（異常登入、權限變更、批次匯出）。
- Incident Runbook：偵測 → 隔離 → 通報（PDPA 通報義務）→ 復原 → 檢討。
- 例行：滲透測試、依賴掃描、備份還原演練。

## 8. 現有程式的安全註記（誠實）

- 靜態 PWA 無伺服器、無帳號，資料僅在 `localStorage` → **無多租戶、無授權、無稽核**，不能作為企業基礎。
- `registry.html` 以 `innerHTML` 組字串（雖有 `esc()`）→ 新平台應改為框架宣告式渲染，杜絕 XSS 面。
- 官方同步既有精神（不碰登入 Cookie、使用者本人登入）**正確**，於新平台延續強化。
