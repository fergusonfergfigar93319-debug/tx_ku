# Web 端對後端 API 需求說明

本文依 **目前 `web/` 前端實作**（`src/api/*.ts`、`src/types/*`）整理，供後端對齊實作與聯調。開發時預設 `VITE_API_BASE_URL=/api/v1`，Vite 開發伺服器會將 `/api` 代理到 `http://localhost:8000`（見 `web/vite.config.ts`）。

---

## 1. 通用約定

### 1.1 Base URL

- 前端 Axios **`baseURL`**：`${VITE_API_BASE_URL}`，預設 **`/api/v1`**（注意路徑前綴 **`/api/v1`**，不是裸域名）。

### 1.2 統一包裝格式 `ApiEnvelope<T>`

除 **SSE／原生 fetch 流式** 外，一般 JSON 介面建議統一為：

```json
{
  "code": 200,
  "message": "ok",
  "data": { }
}
```

- 前端在 `http.ts` 會把 **`code === 200` 或 `20000`** 視為成功，並將 **`data`** 當作業務結果回傳給呼叫端。
- 非成功時：`code` + `message`，前端會 `reject(Error)`，並依情況跳出 `ElMessage`。

### 1.3 HTTP 狀態與業務碼

| 情境 | 建議 |
|------|------|
| 未登入 / Token 失效 | HTTP **401**，或 body 內 `code: 40100`；前端會清 token 並觸發登出流程 |
| 智能體忙碌 | body `code: **50301**` → 前端提示「智能体正在沉思中…」 |
| 智能體輸出異常 | body `code: **50302**` → 前端提示「智能体输出异常…」 |

### 1.4 認證

- 除註冊／登入外，其餘需登入的介面請驗證標頭：**`Authorization: Bearer <accessToken>`**。
- Token 由前端自 `localStorage`（鍵名 `access_token`）讀取並附加。

### 1.5 靜默錯誤（可選）

- 若某請求**不應**自動全域 `ElMessage.error`，可帶自訂標頭 **`X-Silent-Error: 1`**（前端攔截器有判斷）。

### 1.6 分頁參數

多數列表介面使用 **`page`**（從 **1** 起算）、部分使用 **`size`**；具體見各節。回傳可附 **`hasMore`**、**`total`**（前端型別已預留，可選）。

### 1.7 Mock 模式（聯調時關閉）

- 環境變數 **`VITE_USE_MOCK=true`** 時，前端會改走本地 Mock，不發真實後端請求。
- **正式對接後端時請設 `VITE_USE_MOCK=false`**（或刪除該變數）。

---

## 2. 認證

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/auth/register` | 註冊 |
| POST | `/auth/login` | 登入 |
| POST | `/auth/logout` | 登出（可選，失敗前端忽略） |

**請求／回應（概要）**

- **RegisterRequest**：`email`, `password`, `nickname?`
- **LoginRequest**：`email`, `password`
- **LoginResponse**（前端會正規化）：  
  - 優先 **`accessToken`**，相容 **`access_token`**  
  - 可選 **`tokenType`**、**`account`**：`email`, `regNickname`, `avatarUrl`

---

## 3. 個人資料（Profile）

與 Android `Profile` 及建檔流程對齊意圖；JSON 欄位採 **camelCase**（見 `types/profile.ts`）。

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/profiles/me` | 取得當前使用者 profile + 搭子名片 |
| PUT | `/profiles/me` | 部分更新 profile |
| POST | `/profiles` | 無 profile 時建立（與 PUT 二選一流程由前端 store 決定） |

**`ProfileMeResponse`**

```ts
{
  profile: Profile | null,
  card: BuddyCard | null
}
```

**`Profile`** 核心欄位（節選，完整以前端型別為準）：

- 展示／建檔：`nickname`, `avatarUrl`, `bio`, `cityOrRegion`, `preferredGames`, `rank`, `activeTime`, `mainRoles`, `playStyle`, `target`, `voicePref`, `noGos`, …  
- 智能體相關：`agentTuning`, `agentPresetId`, `agentBuddyDisplayName`, `agentBuddyAvatarUrl`, `agentUseCustomChibi`, `agentBuddyQDesign`, `agentChatUnlocked`, `gameInterestCompleted`, `gameIds` 等。

**`BuddyCard`**

```ts
{ cardId: string; tags: string[]; declaration: string; rules: string[] }
```

---

## 4. 檔案上傳

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/uploads` | `multipart/form-data`，欄位名 **`file`** |

**成功回傳 `data`**

```json
{ "url": "https://..." }
```

前端**不**手寫 `Content-Type`，以便瀏覽器帶上 `boundary`。

---

## 5. 論壇／貼文

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/posts` | 列表；Query：`category?`, `page`, `size`, `q?`（搜尋） |
| GET | `/posts/:postId` | 單篇 |
| POST | `/posts` | 發文；body：`title`, `content`, `category`, `tags?`, `mediaAttachments?`（URL 陣列） |
| GET | `/users/me/posts` | **當前使用者**全部狀態貼文（含待審）；Query：`page` |
| GET | `/posts/:postId/comments` | 留言列表；Query：`page` |
| POST | `/posts/:postId/comments` | 留評；body：`{ "content": "..." }` |
| POST | `/posts/:postId/like` | 按讚 |
| DELETE | `/posts/:postId/like` | 取消按讚 |

**`Post` 型別重點**

- `category`: `'recruit' | 'guide' | 'social' | 'event'`
- 可選：`likeCount`, `commentCount`, `viewCount`, `createdAt`, `pinned`
- 審核：`visibleInPublicForum?`, `reviewStatus?: 'pending' | 'approved' | 'rejected'` — 廣場僅展示 **`visibleInPublicForum === true`** 的邏輯由後端或產品約定。

**`Comment`**：`commentId`, `postId`, `authorId`, `authorNickname?`, `content`, `createdAt?`

---

## 6. 動態／資訊流（Discover）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/feed/news` | 資訊列表；Query：`game?`, `page` |

**`NewsFeedResult`**：`{ list: NewsItem[], hasMore?, total? }`

**`NewsItem`**：`id`, `title`, `summary?`, `coverUrl?`, `publishedAt?`, `gameId?`, `publisherDisplayName?`

**備註**：非 Mock 且請求失敗時，前端 Discover 會**退回本地種子資料**（僅為體驗）；上線後仍建議後端提供穩定 `/feed/news`。

---

## 7. 推薦搭子

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/recommendations` | Query：`page`, `size`（預設前端傳 `size=10`） |

**`RecommendationListResult`**：`{ list: RecommendationItem[], hasMore: boolean }`

**`RecommendationItem`**：`userId`, `nickname`, `avatarUrl?`, `matchScore`, `matchReasons[]`, `conflict?`, `advice?`, `communicationStylePreview?`, `card?`（`BuddyCard`）

---

## 8. 搭子申請（Buddy Request）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/buddy-requests` | Query：`status?` |
| POST | `/buddy-requests` | body：`{ targetUserId, message? }` → 回傳 `data: { relationId }` |
| PATCH | `/buddy-requests/:relationId` | body：`{ action: 'ACCEPT' | 'REJECT' }` |

**`BuddyRequestItem`**：`relationId`, `fromUserId`, `fromNickname`, `toUserId`, `message?`, `status`, `createdAt?`  
`status`: `'pending' | 'accepted' | 'rejected'`

---

## 9. 使用者搜尋／摘要

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/users` | Query：`q` — 搜尋使用者 |
| GET | `/users/by-id` | Query：`id` — 依 id 取摘要 |

**`UserSummary`**：`userId`, `nickname`, `avatarUrl?`

---

## 10. 關注（Follow）

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/follows` | body：`{ targetUserId }` |
| DELETE | `/follows/:targetUserId` | 取消關注 |
| GET | `/users/me/following` | Query：`page?` → `data: { list: FollowUser[], hasMore? }` |

**`FollowUser`**：`userId`, `nickname`, `avatarUrl?`

---

## 11. 私訊（DM）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/dm/threads` | 會話列表 → `data: { list: DmThread[] }` |
| GET | `/dm/:peerUserId/messages` | 與某使用者的訊息；Query：`before?`（游標／時間戳協議由後端定義，前端原樣傳遞） |
| POST | `/dm/messages` | body：`{ peerUserId, content }` → 回傳 `DmMessage` |

**`DmThread`**：`peerUserId`, `peerNickname?`, `peerAvatarUrl?`, `lastMessagePreview?`, `updatedAt?`  
**`DmMessage`**：`messageId`, `senderId`, `content`, `createdAt?`

---

## 12. AI／智能體（含串流）

基底路徑仍為 **`/api/v1`**；串流使用 **原生 `fetch`**，URL 為 **`${API_BASE}/ai/...`**，與 Axios 同源設定一致。

### 12.1 REST（JSON）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/ai/agent/messages` | 會話歷史；Query：`sessionId?` → `data: { list: AgentChatMessageDTO[] }` |
| POST | `/ai/buddy-card` | body：`{ personaStyle? }` → `BuddyCard` |
| POST | `/ai/posts` | 帖文草稿；body：`{ expectedRole?, extraDemand? }` → `data: { title, content }` |
| POST | `/ai/agent/chat` | 非串流一鍵回覆；body：`{ message, sessionId? }` → `data: { reply, route?, query? }`，`route` 可為 `'forum' \| 'search'` |
| POST | `/ai/consensus-card` | body：`{ relationId }` → `data: { relationId, communicationRules[], commonGoal }` |

**`AgentChatMessageDTO`**：`id`, `role: 'user' | 'assistant'`, `text`, `createdAt?`

### 12.2 SSE 串流（強烈建議實作）

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/ai/agent/chat/stream` | **`Accept: text/event-stream`**，body 同 `postAgentChat`（JSON） |

**行為**

- 成功時 **`Content-Type`** 建議為 **`text/event-stream`**（或前端亦接受 **`application/x-ndjson`** 作退路）。
- 前端逐行解析 **`data:`** 後綴（見 `parseSseDataLine`）：  
  - JSON 可含 **`delta`** / **`text`**（增量）、**`reply`**（整段）、**`done`: true**、**`route`**、**`query`**。  
  - 純文字 payload 會當作 **`delta`**。  
  - `data: [DONE]` 視作結束。
- 若 **非 2xx**、無 body、或 `Content-Type` 不含 `event-stream` / `ndjson`，前端會 **改打** `POST /ai/agent/chat` 再以客戶端模擬逐字顯示（體驗降級）。

---

## 13. 目前不由後端承擔的功能（避免誤會）

- **論壇「我的收藏」**：帖子 id 僅存 **`localStorage`**，換裝置不同步；載入時用 **`GET /posts/:id`** 批量拉取，**無**單獨「收藏列表 API」。
- **部分 Discover 容錯**：見 §6。

---

## 14. 建議後端交付順序（僅供參考）

1. 統一 **`ApiEnvelope`** + 登入／**Bearer** + **`GET/PUT /profiles/me`**  
2. **論壇** CRUD、讚、留言、**`GET /users/me/posts`**  
3. **上傳** `POST /uploads`  
4. **DM**、**buddy-requests**、**follows**、**users** 搜尋  
5. **feed/news**、**recommendations**  
6. **AI** 非串流 → 最後 **SSE `/ai/agent/chat/stream`**

---

*文件產製自前端倉庫 `web/src/api` 與型別定義，若程式有更新請以程式碼為準並同步本文件。*
