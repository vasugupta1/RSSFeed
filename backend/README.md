## Backend

This project is BFF, used for the front-end to call web api endpoints to serve, BFF will be responsible for setting up calls to python project to scrape websites for data, storing it in database making it avaiable for the BFF to fetch and return back to the front-end

---

## Code Review — Things To Fix

### 🔴 1. Critical Bugs

#### 1.1 Missing `return` after `http.Error()` in `UpsertFeedUrl`
**File:** `internal/handler/upsertfeed.go:25-45`

The handler calls `http.Error()` but does **not** `return` after any of the three error checks. This means execution continues even after writing an error response, which causes nil pointer dereferences and writing multiple responses to the same `http.ResponseWriter`.

```go
// ❌ Current — continues executing after error
if err != nil {
    slog.Error("Failed to parse crawler request", "error", err)
    http.Error(w, err.Error(), http.StatusBadRequest)
}
rssXml, err := callRssFeedUrls(requestBody.URL) // requestBody is zero-value → panics or garbage

// ✅ Fix — add return after each http.Error
if err != nil {
    slog.Error("Failed to parse feed request", "error", err)
    http.Error(w, err.Error(), http.StatusBadRequest)
    return
}
```

This same bug exists on **lines 31-35** and **lines 36-40**.

#### 1.2 Missing `return` after `http.Error()` in `DeleteArticle`
**File:** `internal/handler/deleteArticle.go:24-28`

Same pattern — error is written but execution falls through to call `DeleteArticle` and `WriteJSON`.

#### 1.3 Wrong error variable logged in `HandleCrawl`
**File:** `internal/handler/crawler.go:35`

```go
// ❌ Logs `err` (from the previous ReadJSON call) instead of `error` (from GetArticle)
cachedModel, error := h.respository.GetArticle(r.Context(), requestBody.URL)
if error != nil {
    slog.Error("Errored when trying to check cached", "error", err)  // should be `error`
}
```

#### 1.4 Nil pointer dereference in crawler client
**File:** `internal/client/crawler.go:31`

If `c.httpClient.Get()` returns an error, `res` is nil, but you access `res.StatusCode` **before** checking `err`:

```go
// ❌ Panics when err != nil because res is nil
res, err := c.httpClient.Get(...)
if res.StatusCode != http.StatusOK || err != nil {

// ✅ Fix — check err first
if err != nil {
    return nil, fmt.Errorf("crawler API request failed: %w", err)
}
if res.StatusCode != http.StatusOK {
    defer res.Body.Close()
    return nil, fmt.Errorf("crawler API returned status code %d", res.StatusCode)
}
```

#### 1.5 Background worker exits permanently on a single failure
**File:** `internal/background/fetcharticlebackgroundservice.go:40-47`

When a crawl fails, the goroutine `return`s, killing the entire background worker forever. This means all subsequent articles in the channel are never processed.

```go
// ❌ One failure kills the entire worker
if crawlResponse == nil {
    slog.Error(...)
    return  // should be `continue`
}
```

#### 1.6 Slice bug — `make` with length then `append` produces leading nil elements
**File:** `internal/handler/getAllArticles.go:27-33`

```go
// ❌ Creates a slice of length `len(articles)` filled with zero values, then appends more
response := make([]models.CrawlUrlResponse, len(articles))
for _, article := range articles {
    response = append(response, ...)  // appends AFTER the zero-filled slots
}

// ✅ Fix — use length 0, capacity len(articles)
response := make([]models.CrawlUrlResponse, 0, len(articles))
```

---

### 🟠 2. Error Handling

#### 2.1 `SaveFeed` return value ignored
**File:** `internal/handler/upsertfeed.go:41`

```go
h.Respository.SaveFeed(r.Context(), *feed)  // error silently dropped
```

#### 2.2 `DeleteArticle` return value ignored
**File:** `internal/handler/deleteArticle.go:29`

```go
h.Respository.DeleteArticle(r.Context(), requestBody.URL)  // error silently dropped
```

#### 2.3 `ensureCollectionExists` return value ignored
**File:** `internal/repository/mongorepository.go:30`

```go
ensureCollectionExists(db, config.CollectionNames)  // error silently dropped
```

#### 2.4 `WriteJSON` encoder error ignored
**File:** `internal/httputil/response.go:18`

```go
json.NewEncoder(w).Encode(value)  // error silently dropped
```

#### 2.5 `w.Write` return value ignored
**File:** `internal/handler/healtcheck.go:13`

```go
w.Write([]byte("OK"))  // error silently dropped
```

#### 2.6 Identical error messages for different failures
**File:** `internal/handler/upsertfeed.go:28,33,38`

All three error paths log `"Failed to parse crawler request"` making it impossible to tell which step actually failed from the logs.

#### 2.7 `DeleteArticle` repo method conflates "not found" with actual errors
**File:** `internal/repository/mongorepository.go:139-149`

When `DeletedCount != 1` the function logs an error and returns `nil` (since `error` is nil), so callers have no way to know the delete didn't actually happen.

---

### 🟡 3. Security

#### 3.1 SSRF vulnerability — no URL validation on feed ingestion
**File:** `internal/handler/upsertfeed.go:48-68`

The `callRssFeedUrls` function blindly fetches any user-supplied URL via `http.Client.Get()`. A user can pass internal network addresses (`http://169.254.169.254/...`, `http://localhost:27017`, etc.) to probe internal services.

**Fix:** Validate that the URL scheme is `http`/`https`, and consider blocking private IP ranges.

#### 3.2 No HTTP client timeouts anywhere
**Files:** `internal/handler/upsertfeed.go:49`, `internal/client/crawler.go:21`

Both create `&http.Client{}` with **no timeout**, which means a malicious or slow server can hang the goroutine forever.

```go
// ✅ Fix
client := &http.Client{Timeout: 30 * time.Second}
```

#### 3.3 No request body size limit
**File:** `internal/httputil/response.go:24`

`json.NewDecoder(r.Body).Decode(&result)` reads an unbounded body. An attacker can send a multi-GB JSON payload to exhaust memory.

```go
// ✅ Fix
r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB limit
```

#### 3.4 Raw internal error messages exposed to clients
**Files:** All handlers using `http.Error(w, err.Error(), ...)`

Internal errors (database errors, XML parse errors, etc.) are sent directly to the client, leaking implementation details.

#### 3.5 No CORS middleware
**File:** `internal/server/routes.go`

The frontend fetches from this API but there is no CORS configuration. This only works because Vite proxies the requests in dev mode — it will break in production.

#### 3.6 URL passed as query parameter without encoding
**File:** `internal/client/crawler.go:30`

```go
// ❌ URL injection — user-supplied `url` is concatenated raw into the query string
c.httpClient.Get(fmt.Sprintf("%s/api/crawl?url=%s", c.baseUrl, url))

// ✅ Fix
import "net/url"
c.httpClient.Get(fmt.Sprintf("%s/api/crawl?url=%s", c.baseUrl, url.QueryEscape(url)))
```

---

### 🔵 4. Go Idioms & Code Quality

#### 4.1 Typo: `Respository` → `Repository`
**Files:** Everywhere — `handler/upsertfeed.go:17`, `handler/crawler.go:15`, `handler/getAllArticles.go:12`, `handler/deleteArticle.go:13`, `background/fetcharticlebackgroundservice.go:17`, `main.go:30`

The field and variable name `Respository` is misspelled (missing an 'i'). This appears in struct definitions, constructors, and variable names across the entire codebase.

#### 4.2 Naming: `error` used as a variable name shadows the builtin
**Files:** `internal/service/crawler.go:28,36`, `internal/repository/mongorepository.go:142`, `internal/handler/crawler.go:33`

```go
// ❌ Shadows the builtin `error` type
result, error := s.polly.Process(...)

// ✅ Fix
result, err := s.polly.Process(...)
```

#### 4.3 Naming: snake_case variable `xml_error`
**File:** `internal/handler/upsertfeed.go:63`

Go convention is `camelCase`. Should be `xmlErr` or `xmlError`.

#### 4.4 Naming: `databaseCgf` typo
**File:** `cmd/server/main.go:25`

Should be `databaseCfg`.

#### 4.5 Naming: type `Articles` is plural but represents a single article
**File:** `internal/repository/models/feed.go:14`

Should be `Article` (singular).

#### 4.6 Exported field that should be unexported
**File:** `internal/handler/upsertfeed.go:17`

`Respository` is exported (uppercase) in `FeedHandler` but is an internal dependency — it should be unexported (`repository`).

Same issue in `GetAllArticlesHandler` and `DeleteArticleHandler`.

#### 4.7 Duplicate import alias
**File:** `internal/background/fetcharticlebackgroundservice.go:9-10`

```go
"github.com/.../repository/models"
repomodels "github.com/.../repository/models"   // imported twice
```

#### 4.8 Inconsistent JSON tag casing
**File:** `internal/models/crawler.go:7-11`

```go
type CrawlUrlResponse struct {
    Url      string `json:"Url"`       // PascalCase
    Response string `json:"Response"`  // PascalCase
    Title    string `json:"Title"`     // PascalCase
}
```

All other models use `camelCase` or `lowercase` JSON tags. These should be consistent (typically `camelCase` for JSON APIs).

#### 4.9 Unused `Format` field
**File:** `internal/models/feed.go:5`

The `Format` field in `UpsertFeedRequest` is accepted from the frontend but never read anywhere in the backend.

#### 4.10 `mapToFeed` returns an error but never produces one
**File:** `internal/handler/upsertfeed.go:71-86`

The function signature returns `(*repomodels.Feed, error)` but the function body always returns `nil` error. Either use it to validate data, or simplify the signature.

---

### 🟣 5. Architecture & Design

#### 5.1 Business logic in handlers (no service layer for feeds)
**File:** `internal/handler/upsertfeed.go`

The `UpsertFeedUrl` handler directly fetches URLs, parses XML, maps data, saves to the database, and pushes to a channel. This should be in a service layer. The existing `internal/service/feed.go` is an empty stub.

#### 5.2 `callRssFeedUrls` is a package-level function in the handler package
**File:** `internal/handler/upsertfeed.go:48`

This function makes HTTP calls and should be in the `client` package, not the handler.

#### 5.3 Hardcoded collection names
**Files:** `internal/repository/mongorepository.go:60,70,93,103,114,140`

Collection names `"feedurl"` and `"feedarticle"` are hardcoded as string literals in every method instead of being stored in the repository struct from configuration.

#### 5.4 No graceful shutdown
**File:** `internal/server/server.go:25`

`http.ListenAndServe` doesn't support graceful shutdown. When the process receives SIGTERM, in-flight requests are dropped and the background worker may lose items from the channel.

```go
// ✅ Fix — use http.Server with Shutdown()
srv := &http.Server{Addr: ":" + port, Handler: r}
go srv.ListenAndServe()
// wait for signal, then srv.Shutdown(ctx)
```

#### 5.5 Tight coupling — handlers depend on concrete types
**File:** `internal/service/crawler.go:15`

`crawlerService` depends on the concrete `*client.CrawlerApiClient` rather than an interface, making it impossible to unit test.

#### 5.6 `Polly` is a semaphore, not a retry policy
**File:** `internal/service/polly.go`

The name "Polly" (inspired by .NET's Polly library) implies retry/circuit-breaker functionality, but this implementation is just a concurrency limiter (semaphore). The name is misleading.

---

### ⚪ 6. Concurrency

#### 6.1 No graceful drain of the article channel
**File:** `cmd/server/main.go:52`

The channel is never closed. When the context is cancelled, items may be left in the buffered channel unprocessed.

#### 6.2 Channel send can block the HTTP handler
**File:** `internal/handler/upsertfeed.go:42-44`

If the background worker is slow or stuck, the `for range` loop sending articles to the channel blocks the HTTP response to the client indefinitely (the channel buffer is 100, but a large feed could exceed it).

---

### 🧪 7. Testing

#### 7.1 Zero test files in the entire project

There are no `_test.go` files anywhere. At minimum, the following should be tested:
- Handler logic (with mocked repository)
- XML parsing / mapping
- Repository interface compliance
- Client error handling
- Background worker behavior

---

### 📡 8. HTTP API Design

#### 8.1 DELETE endpoint reads a JSON body instead of using URL path/query
**File:** `internal/handler/deleteArticle.go:24`, `internal/server/routes.go:20`

```
DELETE /api/article  (body: {"url": "..."})
```

RESTful convention is `DELETE /api/articles/{id}` or `DELETE /api/articles?url=...`. Many HTTP clients and proxies strip the body from DELETE requests.

#### 8.2 No pagination on `GET /api/articles`
**File:** `internal/handler/getAllArticles.go:22`

Returns **all** articles at once with no limit, skip, or cursor-based pagination. This will cause performance issues as the dataset grows.

#### 8.3 No Content-Type validation on incoming requests
**File:** `internal/httputil/response.go:24`

`ReadJSON` doesn't verify that `Content-Type` is `application/json` before attempting to decode.

#### 8.4 Health check doesn't verify dependencies
**File:** `internal/handler/healtcheck.go`

The health check returns 200 OK without checking if MongoDB is actually reachable. A proper liveness/readiness check should ping the database.

Also: filename `healtcheck.go` is a typo (missing 'h') — should be `healthcheck.go`.

---

### 🗄️ 9. Database / Repository

#### 9.1 `context.TODO()` used instead of proper context
**Files:** `internal/repository/mongorepository.go:25,36,37`, `cmd/server/main.go:37`

`context.TODO()` is a placeholder that should be replaced with a real context (e.g., one with a timeout, or the request context).

#### 9.2 Missing cursor `Close()` calls
**Files:** `internal/repository/mongorepository.go:71-89,118-136`

MongoDB cursors should be closed with `defer cursor.Close(ctx)` to release server-side resources.

#### 9.3 `GetArticle` doesn't distinguish "not found" from real errors
**File:** `internal/repository/mongorepository.go:102-111`

When `FindOne` returns `mongo.ErrNoDocuments`, it's treated the same as a genuine database error. Callers can't tell the difference.

```go
// ✅ Fix
if err == mongo.ErrNoDocuments {
    return nil, nil
}
```

#### 9.4 No database indexes
The repository creates collections but doesn't create indexes. The `url` field in `feedarticle` is queried by exact match — it needs a unique index for performance and data integrity.

---

### ⚙️ 10. Configuration

#### 10.1 Hardcoded database name and collection names
**File:** `internal/config/config.go:18-19`

```go
DatabaseName:    "rssfeedurl",
CollectionNames: []string{"feedurl", "feedarticle"},
```

These should be configurable via environment variables.

#### 10.2 Empty connection string fails silently
**File:** `internal/config/config.go:17`

If `ConnectionStrings__rssfeedurl` is not set, the default is `""`, which will cause a confusing MongoDB connection error later. The config loader should validate required values at startup.

#### 10.3 No server read/write timeouts configured
**File:** `internal/server/server.go:25`

`http.ListenAndServe` uses the default `http.Server` which has zero timeouts — a slow client can hold a connection open forever.

---

### 📋 Summary

| Category | Count |
|---|---|
| 🔴 Critical Bugs | 6 |
| 🟠 Error Handling | 7 |
| 🟡 Security | 6 |
| 🔵 Go Idioms & Code Quality | 10 |
| 🟣 Architecture & Design | 6 |
| ⚪ Concurrency | 2 |
| 🧪 Testing | 1 |
| 📡 HTTP API Design | 4 |
| 🗄️ Database / Repository | 4 |
| ⚙️ Configuration | 3 |
| **Total** | **49** |
