# Implementation Roadmap

## Direction
One general autonomous agent with capability-dependent providers. MVP = Node.js project generation and repair. Python/FastAPI, live preview, and other capabilities come after.

## Rules
- Ship a thin end-to-end slice first.
- Modular monolith: API, worker, and modules separate in code.
- No Docker for tasks that don't need it.
- Workspace files live outside sandboxes.
- Security is built in each milestone, not saved for M6.
- **No outside users before M6 is done.**

## M0 decisions (write down before coding)
Auth provider · LLM provider/model · where sandboxes run · per-task cost cap · editor component (Monaco or simpler).

## Milestones

### M0 — Foundation
- pnpm TS monorepo (React + Vite web, Express API), lint, format, Zod, Vitest, env validation.
- Express base: Zod validation middleware, central error handler, Pino request logging, helmet, rate limits.
- Docker Compose: Postgres, Redis, MinIO.
- Structured logs, request IDs, auth integration.
- CI: lint + tests.

**Done when:** API and web start locally, migrations run, CI green, login works.

### M1 — Projects and workspace
- Schema: users, projects, tasks, workspace_versions/files, audit_logs.
- Object-storage adapter, content-addressed blobs.
- File list/read/save with path normalization, authorization, compare-and-swap versioning.
- Version list, restore, ZIP export.

**Done when (via API, no UI yet):** create project, add/edit/list files, export ZIP, restore a version; data survives restarts; path-traversal and cross-tenant tests pass.

### M2 — Sandbox provider *(can run in parallel with M3)*
- Node.js 22 image, runtime registry (`node22`).
- Container manager: non-root, CPU/mem/PID/disk/time limits, read-only root FS where practical.
- Copy-in/copy-out of files (no host mounts).
- **Package proxy with allowlist; install phase with scripts off; run phase offline.**
- stdout/stderr capture, cleanup, cancellation.

**Done when:** a hand-written project installs, tests, and runs; timeout and memory limits trigger; no Docker socket, secrets, or host mounts present; offline run phase can't reach the network.

### M3 — LLM and agent core *(can run in parallel with M2)*
- LLM adapter, structured plan/file-operation/evaluation schemas.
- Planner, context manager, tool registry with server-side policy.
- Prompt versions, `tool_invocations`, `usage_records`.
- **Eval harness with ~20 golden tasks and a pass-rate/cost/time report.**

**Done when:** valid plans and file ops for sample tasks; invalid tool calls rejected; eval harness runs.

### M4 — Coding agent loop
- BullMQ worker, state machine, checkpoints, leases, reconciler, dead-letter queue.
- Generate → run → observe → evaluate → bounded repair.
- Loop detection and test-tampering flags.
- Changesets, sync with conflict handling, cancellation, failure reports.
- Events in Postgres + SSE; OpenTelemetry traces and basic cost/duration dashboards.

**Done when:** "Build a Fastify To-Do API" succeeds, including recovery from a real injected failure; worker-kill test resumes from checkpoint; cancel works; project downloadable after sandbox cleanup; golden-task pass rate recorded as a baseline.

### M5 — User workspace UI
- Task dashboard, live timeline, log panel.
- File explorer and editor, approvals and input prompts.
- Artifact list, ZIP download, version history and restore.

**Done when:** a user can submit a task, follow it, inspect and edit files, resolve a conflict, and download the project.

### M6 — Security and operations
- Threat model and abuse cases.
- Dedicated sandbox host; gVisor or Firecracker decision.
- Quotas, rate limits, audit review, secrets isolation.
- Backups/restore, retention, alerts (worker crash, backlog, cost spike, suspicious sandbox activity).

**Done when:** tests cover path traversal, tenant isolation, archive extraction, resource exhaustion, unauthorized artifact access, malicious dependencies, and egress blocking; restart and cancel integration tests pass.

### M7 — More capabilities (one at a time)
1. Python 3.12 + FastAPI provider.
2. Live app preview (secure port proxy).
3. Documents.
4. Browser research (domain policy).
5. Data analysis.
6. GitHub sync.
7. Deployment with approval gates.

**Each needs:** typed I/O, permission scopes, tests, audit events, documented limits.

### M8 — Production scale
Separate API/workers/execution hosts, autoscaling, backpressure, org quotas, cost dashboards, DR drills, load tests, SLOs.

## Repository layout
Full file-by-file layout: see `PROJECT_STRUCTURE.md` (it replaces the summary below).

```
apps/      web (React+Vite), api (Express), worker
packages/  agent-core, capabilities, providers, tool-system,
           workspace, database, llm, shared
docker/    node-sandbox
infrastructure/
evals/, tests/, scripts/
```

## Build order
Storage/file APIs → sandbox by hand → LLM planning → worker + sandbox → evaluate/repair/sync → UI → harden → add capabilities.

## MVP is done when a user can
- Create a project and submit a coding task.
- Watch progress and logs.
- Get a generated Node.js project.
- View and edit files.
- Download a ZIP and run it locally.
- See test evidence or a clear failure reason.

## Progress

| Milestone | Status | Notes |
|---|---|---|
| M0 Foundation | Not started | |
| M1 Workspace | Not started | |
| M2 Sandbox | Not started | |
| M3 Agent core | Not started | |
| M4 Coding loop | Not started | |
| M5 UI | Not started | |
| M6 Security/ops | Not started | |
| M7 Capabilities | Not started | |
| M8 Scale | Not started | |
