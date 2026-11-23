# Backend API Specification

Base path `/api/v1`. JSON bodies. UUID IDs. ISO 8601 UTC timestamps. All endpoints require auth (cookie session) unless marked public.

## 1. Conventions
- Validate requests and responses with Zod.
- Check ownership/project permission on every request.
- Collections use `limit` + `cursor`.
- Retryable commands take an `Idempotency-Key` header. Same key + same body returns the original response; same key + different body returns `409 IDEMPOTENCY_CONFLICT`.
- Errors:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "The request is invalid.", "request_id": "req_..." } }
```
Common codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VERSION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `QUOTA_EXCEEDED`, `RATE_LIMITED`, `INVALID_STATE`.

## 2. Tasks

| Endpoint | Purpose |
|---|---|
| `POST /tasks` | Create task (`202`) |
| `GET /tasks/:id` | Status, prompt, project, current step, plan summary, final summary, stop reason, timestamps |
| `GET /tasks?project_id&status&limit&cursor` | List own tasks |
| `POST /tasks/:id/cancel` | Request cancel (`202`) |
| `POST /tasks/:id/resume` | Resume a resumable task; re-checks permissions, budget, approvals |
| `POST /tasks/:id/input` | Answer a `WAITING_FOR_INPUT` question |

**Create task**
```json
{ "prompt": "Build a To-Do REST API using Fastify",
  "project_id": null,
  "mode": "autonomous",
  "budget": { "max_runtime_seconds": 900, "max_repair_attempts": 3 } }
```
- `project_id: null` → server creates a project automatically.
- `mode`: only `autonomous` in MVP; other values rejected.
- `budget` is a request; the server clamps it to plan/quota caps and returns the effective budget.
- `attachments` are not supported in MVP.
- Response `202`: `{ "task_id", "status": "QUEUED", "project_id", "created_at" }`.

**Cancel** → `202 { "task_id", "status": "CANCELLATION_REQUESTED" }`. Never claim the provider stopped until confirmed (`CANCELLED`).

**Input** body: `{ "answer": "..." }`. Valid only in `WAITING_FOR_INPUT`, else `409 INVALID_STATE`.

## 3. Events and logs
**`GET /tasks/:id/events`** — SSE. Auth by cookie. Supports `Last-Event-ID` replay from Postgres. Limit concurrent streams per user.
```
id: 42
event: agent.progress
data: {"task_id":"...","message":"Running API tests","step_id":"test-api"}
```
**`GET /tasks/:id/logs?cursor&limit=100`** — structured entries. Large stdout/stderr come back as authorized short-lived download URLs.

## 4. Projects and files

| Endpoint | Purpose |
|---|---|
| `POST /projects` | Create (`201`: `project_id`, `name`, `workspace_version`) |
| `GET /projects?limit&cursor` | List |
| `GET /projects/:id` | Metadata + current workspace version |
| `GET /projects/:id/files?path&version=latest` | Directory listing (path, type, size, hash). No storage keys. |
| `GET /projects/:id/files/content?path&version=latest` | Read text file. Size limit; path normalized. |
| `PUT /projects/:id/files/content` | Save file |
| `GET /projects/:id/versions` | Version metadata + task IDs |
| `POST /projects/:id/versions/:n/restore` | Rollback: creates a **new** version copying version `n` |
| `POST /projects/:id/exports` | Start ZIP export (`202`) |

**Save file** body: `{ "path", "content", "base_version" }` → `200 { "path", "workspace_version", "content_hash" }`. Stale base → `409 VERSION_CONFLICT`. Rejects writes while a task is applying a changeset to the same project (`409 INVALID_STATE`).

**Export** returns `202 { "artifact_id", "status": "pending" }`. Poll `GET /artifacts/:id` until `ready`.

## 5. Artifacts
- `GET /tasks/:id/artifacts` — list.
- `GET /artifacts/:id` — metadata and status.
- `GET /artifacts/:id/download` — stream or short-lived signed URL after authorization.

Never make artifacts public by default.

## 6. Approvals
- `GET /tasks/:id/approvals` — pending and historical.
- `POST /approvals/:id/resolve` — `{ "decision": "approve" | "reject", "comment": "..." }`.

Only the owner or an authorized member can resolve. Expired approvals return `409 INVALID_STATE`. An approval applies only to the exact action it was requested for.

## 7. Health and operations
- `GET /health/live` — public, process liveness.
- `GET /health/ready` — public or internal, checks Postgres, Redis, storage.
- Worker and queue metrics go to protected ops endpoints or the metrics system, never public task APIs.

## 8. Not in MVP
Attachment upload, live preview endpoints, org/member management, Git sync.

## 9. Safety rules
- Never accept host paths or raw Docker parameters from clients.
- API accepts intent; the orchestrator and policy layer pick tools and providers.
- Validate paths, MIME types, sizes, and archive extraction paths.
- Short-lived signed URLs.
- Rate limits, quotas, request-size limits, audit logging.
- Redact credentials and sensitive data in logs and events.
