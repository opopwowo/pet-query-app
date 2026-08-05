# AI — AI Center 設計

> 定位：**AI 不是聊天，是代勞。** 衡量標準：是否真正縮短業者工時。
> 引擎：**Claude API**（經 Cloudflare AI Gateway）+ Workers AI（嵌入/OCR）。預設採用最新 Claude 模型。
> 狀態：**Proposed**。

## 1. 設計原則

1. **Job-to-be-done，不是 chatbot**：每個 AI 功能對應一個具體工作成果（文件、提醒、結構化資料）。
2. **Human-in-the-loop**：AI 產出**草稿**，關鍵動作（送出官方、寄合約、刪資料）一律人工確認。
3. **Grounded on tenant data（RAG）**：答案有依據、可回溯來源；嚴格租戶隔離。
4. **Tool-use over free text**：AI 呼叫受控工具（建立提醒、產 PDF、查寵物），輸出結構化。
5. **Observable & bounded**：每次呼叫記錄 token/成本/延遲；有配額與快取；有離線 eval。

## 2. 六大能力 → 具體使用案例

| 能力 | 使用案例 | 產出 |
| --- | --- | --- |
| **自動整理** | 貼上 LINE 對話 / 官方 Excel / 手寫拍照 → 自動抽取為結構化寵物/飼主/健康資料 | 待確認的結構化草稿 |
| **自動提醒** | 依疫苗/驅蟲 `next_due_on`、配種週期、合約到期 → 主動生成提醒與話術 | 通知 + 建議訊息 |
| **自動搜尋** | 「找出所有未絕育且超過一歲的母貓」自然語言 → 查詢 | 結果清單（可存為 View） |
| **自動分析** | 體重趨勢異常、疫苗缺漏、繁殖成效、門市 KPI | 儀表板洞察 + 警示 |
| **自動生成文件** | 一鍵產生合約 / 健康證明 / 血統書 / 收據 / 交付履歷（PDF） | 帶資料的正式文件 |
| **自動完成流程** | 「幫這一窩準備官方登記包」→ 檢查缺漏、整備欄位、產 checklist | 官方同步整備包（見 OFFICIAL_SYNC） |

## 3. 架構

```
Client → API（/v1/ai/tasks, 202）→ Queue → AI Worker
   ├─ 取 context：RAG 檢索（該租戶向量索引，pgvector/Vectorize）
   ├─ 組 prompt（system + tenant policy + tools schema）
   ├─ 呼叫 Claude（AI Gateway：快取/限流/觀測/成本）
   ├─ Tool-use loop：create_reminder / query_pets / generate_pdf …（皆帶 tenant + 權限檢查）
   ├─ 產出草稿 → 存 ai_tasks.result（+ R2 檔案）
   └─ Webhook / 通知使用者確認
```

- **RAG 隔離**：向量索引以 `tenant_id` 分區；檢索一律加租戶過濾（等同 RLS 精神）。
- **工具即 API**：AI 的工具就是內部 use case，複用同一套權限/稽核 → AI 動作也進 `audit_logs`。
- **串流**：對話式輔助用 streaming 提升體感；批次任務走佇列。

## 4. 安全與治理

- **PII 最小化**：送模型前遮罩不必要的敏感欄位；身分證等預設不入 prompt。
- **Prompt injection 防護**：外部文字（LINE/官方匯出）視為不可信輸入，隔離於 system 指令；工具呼叫需權限校驗、關鍵動作需人工確認。
- **成本控制**：AI Gateway 快取、每租戶用量配額、模型分級（簡單任務用小模型）。
- **可評估**：建立 eval 集（抽取準確率、文件正確率、幻覺率），每次 prompt/模型變更跑回歸。
- **可解釋**：產出附「依據哪些紀錄」，供人工複核。

## 5. 反例（不要做）

- ❌ 純聊天機器人當主打功能。
- ❌ 讓 AI 未經確認就送官方 / 寄客戶 / 刪資料。
- ❌ client 端直呼 LLM（金鑰與資料外洩）。
- ❌ 跨租戶共用向量索引。

## 6. 里程碑

- **AI v1**：非結構化 → 結構化整理、到期提醒、自然語言搜尋。
- **AI v2**：文件自動生成（合約/證明/血統）、官方同步整備包。
- **AI v3**：Agentic 流程自動化、營運洞察、異常偵測。
