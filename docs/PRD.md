# Autonomous Agent Platform — PRD

## 1. What I'm building
A cloud-based autonomous agent platform: user describes work, the agent plans, executes in isolated sandboxes, tests, repairs, and delivers results. Users need no local install.

Coding is the first capability. Browser research, documents, data analysis, and workflow automation come later on the same core.

## 2. Scope by phase

| Phase | Includes |
|---|---|
| **MVP** | Node.js 22 projects. Task → plan → generate → run in sandbox → test → bounded repair → save to persistent workspace → browse/edit files → ZIP export. Logs and test evidence visible. |
| **Post-MVP 1** | Python 3.12 + FastAPI (via runtime registry), live app preview. |
| **Later** | Browser research, documents, data analysis, GitHub, deployment. |

Why Python and preview are not in the MVP: each needs its own image, test setup, and (for preview) a secure port-proxy. Adding them early delays proving the core loop.

## 3. Core functions
- Understand and clarify the request.
- Plan steps with measurable success criteria.
- Pick tools/providers and an approved runtime.
- Generate, run, test, debug, and repair code.
- Keep persistent, versioned project files.
- Stream status, logs, and results.
- Deliver a browser editor and ZIP export.

## 4. Why it could beat alternatives
These are hypotheses, not proven advantages. Existing tools cover parts of this. Differentiation depends on reliability, security, cost, and usability.

1. One platform for several capabilities.
2. Executes work, not just suggests code.
3. Persistent workspace outlives sandboxes.
4. Execution feedback drives automatic repair.
5. Users can inspect and edit everything.

## 5. Trade-offs

| Decision | Gain | Cost |
|---|---|---|
| Cloud only | No setup | Infra cost, network dependency |
| Docker sandboxes | Safer execution | Overhead, ops complexity |
| Persistent workspace | Projects survive | Storage, versioning, sync |
| Auto repair | Less manual debugging | More LLM cost, risk of wrong changes |
| Modular monolith | Fast to build | May need splitting at scale |
| ZIP export | Simple portability | No local sync |

Biggest trade-off: autonomy vs control (cost, security, unintended changes).

## 6. Success metrics (proposed — adjust)
- ≥ 70% of a fixed set of ~20 golden tasks complete with passing tests.
- Median task < 10 min; median cost < a limit you set (**decide**).
- 0 sandbox escapes or cross-tenant file access in security tests.
- Every failed task shows a clear reason and evidence.

## 7. Monitoring
Every task has a task ID and execution ID tying together events, logs, tool calls, and sandbox activity.

- **Agent:** state, step, tool calls, LLM latency, tokens/cost, repairs, duration, outcome.
- **Sandbox:** CPU, memory, disk, runtime, network attempts, limit violations.
- **App:** API latency/errors, worker health, queue depth, DB/Redis/storage health, active sandboxes.
- **Tooling:** structured logs, OpenTelemetry traces, dashboards, error tracking, audit logs.
- **Alerts:** worker crash, repeated failures, queue backlog, resource exhaustion, dependency outage, cost spikes, suspicious sandbox activity.

## 8. Sandbox security
The workspace stores the project; the sandbox only executes it and is disposable.

Flow: validate runtime → pick approved image → create sandbox → copy files in → run commands → collect changes → validate and sync → destroy.

Rules:
- Non-root user; CPU, memory, disk, PID, and time limits.
- No Docker socket, host secrets, or broad mounts.
- Network off by default; dependency install goes through an allowlisted package proxy only.
- The model may *suggest* a runtime; the backend picks the image and policy.
- Validate commands and paths; block traversal.
- Per-user isolation; audit logs of all execution.
- Before outside users: dedicated sandbox host plus gVisor or Firecracker.

## 9. Recovery
Assume workers crash, sandboxes hang, networks fail, and LLMs return junk.

- **Persisted state:** task state, step, plan, tool results, checkpoints, workspace version, retry count.
- **Checkpoints** after: plan, files generated, tests run, changeset validated, workspace synced. A new worker resumes from the last safe one.
- **Retries:** backoff for infrastructure errors; capped repairs for code errors; no retry for invalid input or permission errors; dead-letter queue for repeat failures; idempotency keys.
- **Workspace:** versioned snapshots, failed changesets kept, rollback to any version, never blind overwrite.
- **Sandbox failure:** mark failed, save logs, destroy, recreate from workspace if safe.
- **Human approval** for credentials, external services, destructive actions, significant cost.

## 10. Edge cases

| Case | Handling |
|---|---|
| Unclear request | Ask the user |
| Unsupported language/runtime | Explain, suggest supported one; reject before provisioning |
| Install/compile/test failure | Capture logs, bounded repair |
| Same error repeats | Stop loop, report evidence |
| Repair weakens or deletes tests | Flag; don't count as success |
| Out of memory / infinite loop | Kill, report limit hit |
| Worker crash | Resume from checkpoint |
| User cancels | Stop provider, clean up |
| Duplicate submission | Idempotency key |
| Two editors on one project | Version check; conflict shown, no silent overwrite |
| Agent deletes files | Snapshot + rollback |
| Malicious code or package | Sandbox, no-network run phase, install scripts off, allowlisted registry |
| Invalid LLM tool args | Schema validation, ask for correction |
| Storage/DB outage | Never ack unsynced data; pause and recover |
| Quota or budget exceeded | Stop, tell the user |
| Destructive action requested | Approval required |
| Unauthorized network use | Block and log |

## 11. Principles
1. One orchestrator.
2. Capability-based execution (only the providers a task needs).
3. Isolation for untrusted code.
4. Persistence of projects, state, events, versions.
5. Recoverability: retry, resume, roll back, or ask a human.

## 12. Example (MVP)
"Build a task-management API with Node.js and Fastify."
Plan → generate → sandbox → install → test → repair → save to workspace → user inspects files, logs, and downloads ZIP.

## 13. Open decisions
- Auth provider.
- LLM provider and model.
- Per-task cost cap and per-user quota.
- Target user (solo dev, team, non-technical).
