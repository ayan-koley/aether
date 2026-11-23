# Agent and Execution Flow

## 1. Task states

```
QUEUED → CLASSIFYING → PLANNING → [WAITING_FOR_APPROVAL] → RUNNING → EVALUATING → SYNCING → COMPLETED
```

| State | Meaning |
|---|---|
| `WAITING_FOR_INPUT` | Agent needs a user answer (via `POST /tasks/:id/input`) |
| `WAITING_FOR_APPROVAL` | Needs an approval decision |
| `REPAIRING` | Bounded repair after a failed evaluation (loops back to `RUNNING`) |
| `CANCELLATION_REQUESTED` | User cancelled; waiting for providers to stop |
| `CANCELLED`, `FAILED`, `TIMED_OUT`, `COMPLETED` | Terminal |

- Cleanup is **not a state**. It runs after any terminal status and sets `cleanup_done_at`.
- Resumable: `WAITING_*`, and `RUNNING`/`REPAIRING` after a worker crash or lease expiry. Terminal states are not resumable except `TIMED_OUT`/`FAILED` by explicit `resume` (re-checks budget, permissions, approvals).
- Every transition writes the state, a reason, and an event in one transaction. Transitions are idempotent.

## 2. Flow

1. **Submit** — prompt, optional project, mode.
2. **Authorize** — user, quota, project ownership.
3. **Persist** — task + initial event in Postgres; enqueue with `jobId = taskId`. A reconciler re-enqueues stuck `QUEUED` tasks.
4. **Classify** — intent, risk, needed capabilities, whether execution is needed.
5. **Plan** — structured steps, assumptions, measurable success criteria.
6. **Policy check** — permissions, network, budget, approvals.
7. **Select provider** — Docker only if code must run.
8. **Prepare context** — relevant files, workspace version, task working copy.
9. **Execute** — tools via the policy registry; stream events.
10. **Observe** — exit codes, test output, files, errors.
11. **Evaluate** — evidence vs. success criteria.
12. **Repair or ask** — bounded repair, or pause for input/approval.
13. **Sync** — validate changeset, apply with version check.
14. **Deliver** — artifacts, summary, downloads.
15. **Clean up** — destroy sandbox, revoke credentials, keep logs/artifacts.

## 3. Capability examples

| Request | Capability | Provider |
|---|---|---|
| Explain this error | Reasoning | Direct LLM |
| Build a Fastify API | Coding | Docker |
| Research competitors (later) | Browser | Managed browser |
| Create a PDF report (later) | Documents | Document provider |
| Analyze a CSV (later) | Data | Data provider |

One task may chain capabilities; only needed outputs pass between steps.

## 4. Example: To-Do API (Node.js)
1. Select or create project; record workspace version.
2. Copy snapshot into a restricted Node.js sandbox.
3. Generate `package.json`, server, routes, tests, README, `.env.example`.
4. **Install** via package proxy (scripts off).
5. **Lint/test/health check with network off.**
6. Capture stdout, stderr, exit code.
7. On failure, send concise evidence to repairer; retry within limits.
8. Diff working copy → changeset; validate paths, sizes, types, base version.
9. Apply as new workspace version.
10. Show files, offer ZIP, destroy sandbox.

## 5. Repair rules
- Max repair attempts from budget (server-capped).
- Stop if the same error signature appears twice.
- Repairer must not delete, skip, or weaken tests; such edits are flagged and don't count as success.
- Evaluator requires the tests to have actually run.

## 6. Workspace sync
- Docker volumes are never permanent storage.
- Agent records `base_version`. At sync, if the head moved: apply when changed paths don't overlap; otherwise mark changeset `conflicted`, keep it, ask the user.
- Failed changesets are kept for inspection. Rollback = new version restoring an old one.

## 7. Provider interface
```ts
interface ExecutionResult<T = unknown> {
  status: "succeeded" | "failed" | "timed_out";
  output?: T;
  error?: { code: string; message: string };
  startedAt: string;
  finishedAt: string;
}

interface CodeExecutionProvider {
  createSession(i: { taskId: string; workspaceSnapshotId: string; runtime: string }): Promise<{ sessionId: string }>;
  execute(i: { sessionId: string; command: string; timeoutMs: number; network: "none" | "package-proxy" }): Promise<ExecutionResult>;
  terminate(i: { sessionId: string }): Promise<void>;
}
```
Other providers get their own interfaces.

## 8. Retry, budget, recovery
- Budgets: repairs, wall time, tokens/cost, tool calls, sandbox resources.
- Retry only transient failures, with backoff; repeated failures go to a dead-letter queue.
- Never repeat irreversible external actions without idempotency or approval.
- Checkpoint before and after side effects (append-only).
- Worker holds a lease with heartbeat; expired leases are reclaimed and resumed from the last checkpoint.
- Cancellation: set `cancel_requested_at`, signal worker, worker kills sandbox, then `CANCELLED`.
- Always record the stop reason: success, cancelled, budget, approval needed, or error.

## 9. Events
Persisted in Postgres, delivered over SSE (SSE is not the record).

Names: `task.status`, `agent.plan.created`, `agent.step.started`, `agent.progress`, `tool.started`, `tool.completed`, `sandbox.stdout`, `sandbox.stderr`, `workspace.changeset.created`, `workspace.synced`, `workspace.conflict`, `input.requested`, `approval.requested`, `artifact.created`, `task.completed`, `task.failed`.

Each event has task ID, sequence number, timestamp, typed payload. Redact secrets before persisting.
