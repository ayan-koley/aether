# Project Structure

**Project:** Aether --- Autonomous Agent Platform\
**Status:** MVP architecture\
**MVP runtime:** Node.js 22 only\
**LLM provider:** Google Gemini API\
**Agent implementation:** Custom agent engine (no prebuilt agent SDK)

------------------------------------------------------------------------

## 1. Purpose

This document defines Aether's monorepo structure, package
responsibilities, and dependency boundaries.

The MVP focuses on one complete workflow:

> A user submits a coding task → Aether plans the work → the agent calls
> tools → tools operate on an isolated Node.js sandbox → the agent
> observes results, evaluates them, and repairs failures → the finished
> project is saved to the persistent workspace.

Research, Python/FastAPI, browser automation, deployment, and other
capabilities are outside the MVP.

## 2. Technology Stack

  Area               MVP technology
  ------------------ -----------------------------------------------
  Monorepo           npm workspaces
  Language           TypeScript
  Frontend           React + Vite
  Platform API       Node.js + Express
  Background jobs    Redis + BullMQ
  Database           PostgreSQL + Drizzle ORM
  LLM                Gemini API through a provider adapter
  Agent engine       Custom implementation
  Code execution     Docker
  Sandbox runtime    Node.js 22
  Project storage    Persistent workspace backed by object storage
  Realtime updates   Server-Sent Events (SSE)

**Stack clarification:** The platform API uses Express and the web
application uses React + Vite, following the existing project structure.
Fastify may be used in projects generated for users; it is not the
platform API framework.

## 3. Monorepo Layout

``` text
aether/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── server.ts
│   │       ├── app.ts
│   │       ├── config/
│   │       ├── middleware/
│   │       └── modules/
│   │           ├── auth/
│   │           ├── tasks/
│   │           ├── projects/
│   │           ├── files/
│   │           ├── artifacts/
│   │           ├── approvals/
│   │           ├── events/
│   │           └── health/
│   │
│   ├── worker/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── queues/
│   │       ├── processors/
│   │       ├── task-runner/
│   │       ├── leases/
│   │       ├── reconciler/
│   │       └── shutdown/
│   │
│   └── web/
│       └── src/
│           ├── app/
│           ├── components/
│           ├── features/
│           │   ├── chat/
│           │   ├── tasks/
│           │   ├── projects/
│           │   ├── editor/
│           │   ├── logs/
│           │   └── approvals/
│           ├── hooks/
│           ├── lib/
│           └── styles/
│
├── packages/
│   ├── shared/
│   │   └── src/
│   │       ├── contracts/
│   │       ├── events/
│   │       ├── errors/
│   │       └── constants/
│   │
│   ├── database/
│   │   └── src/
│   │       ├── schema/
│   │       ├── migrations/
│   │       ├── queries/
│   │       └── client.ts
│   │
│   ├── workspace/
│   │   └── src/
│   │       ├── workspace-manager.ts
│   │       ├── snapshots/
│   │       ├── changesets/
│   │       ├── versioning/
│   │       └── storage-adapter.ts
│   │
│   ├── llm/
│   │   └── src/
│   │       ├── provider.ts
│   │       ├── gemini/
│   │       ├── prompts/
│   │       ├── response-parser.ts
│   │       └── schemas/
│   │
│   ├── agent-core/
│   │   └── src/
│   │       ├── agent-loop.ts
│   │       ├── agent-orchestrator.ts
│   │       ├── planning/
│   │       ├── context/
│   │       ├── checkpoints/
│   │       ├── evaluation/
│   │       ├── repair/
│   │       ├── budgets/
│   │       └── stopping-conditions.ts
│   │
│   ├── tool-system/
│   │   └── src/
│   │       ├── registry/
│   │       ├── definitions/
│   │       ├── executor/
│   │       ├── validation/
│   │       ├── permissions/
│   │       └── tools/
│   │           ├── filesystem/
│   │           ├── terminal/
│   │           ├── dependencies/
│   │           └── testing/
│   │
│   ├── providers/
│   │   └── src/
│   │       ├── provider-contract.ts
│   │       └── docker/
│   │           ├── docker-provider.ts
│   │           ├── sandbox-manager.ts
│   │           ├── runtime-adapter.ts
│   │           └── runtime-registry.ts
│   │
│   ├── capabilities/
│   │   └── src/
│   │       ├── capability.ts
│   │       └── coding/
│   │           ├── classifier.ts
│   │           ├── instructions.ts
│   │           ├── project-templates/
│   │           └── task-validation.ts
│   │
│   └── observability/
│       └── src/
│           ├── logger.ts
│           ├── metrics.ts
│           ├── tracing.ts
│           └── audit.ts
│
├── docker/
│   ├── node-sandbox/
│   │   ├── Dockerfile
│   │   └── entrypoint.sh
│   └── package-proxy/
│       └── config/
│
├── scripts/
├── docs/
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
├── .env.example
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.base.json
└── README.md
```

This is the target structure. Create directories as their milestone
begins; do not build every package before the first end-to-end workflow
works.

## 4. Package Responsibilities

### `apps/api` --- Application layer

-   Exposes authenticated HTTP APIs.
-   Creates tasks and projects.
-   Validates requests and enforces user/tenant access.
-   Publishes task jobs to BullMQ.
-   Streams persisted task events to the web client.
-   Does not call Gemini directly or execute sandbox commands.

### `apps/worker` --- Background execution

-   Consumes task jobs from BullMQ.
-   Acquires and renews task leases.
-   Starts the agent workflow.
-   Persists checkpoints and task events.
-   Handles cancellation, retries, and recovery.
-   Reconciles stale jobs and orphaned sandboxes.

### `apps/web` --- User interface

-   Task chat and submission.
-   Task progress and execution timeline.
-   Logs and tool activity.
-   Project file browser and editor.
-   Project versions and ZIP export.
-   Approval prompts where required.

### `packages/agent-core` --- The custom autonomous agent

This is Aether's main intelligence/control loop. It is implemented by
us, not delegated to an agent SDK.

Responsibilities:

1.  Build the model context from the task and available state.
2.  Request the next decision from the LLM provider.
3.  Parse and validate the model response.
4.  Decide whether to continue, call a tool, ask for input, or finish.
5.  Send approved tool calls to the tool system.
6.  Add tool results to context.
7.  Evaluate task progress and completion.
8.  Trigger bounded repair when execution fails.
9.  Stop when the task is complete or a limit is reached.

The agent loop must enforce maximum iterations, time limits, token/cost
budgets, and cancellation.

### `packages/llm` --- Model provider adapter

-   Defines a provider-neutral interface for model requests.
-   Implements the Gemini adapter.
-   Owns Gemini request formatting, response normalization, and provider
    errors.
-   Holds prompts and structured response schemas.
-   Does not own task lifecycle, tool execution, Docker, or workspace
    writes.

Only this package should depend directly on the Gemini SDK/API. This
keeps a future provider change isolated.

### `packages/tool-system` --- Tools and tool execution

The registry describes tools available to the agent. The executor runs
them.

MVP tools:

-   `list_files`
-   `read_file`
-   `write_file`
-   `edit_file`
-   `delete_file`
-   `run_command`
-   `install_dependencies`
-   `run_tests`

Every tool must have a typed input schema, validated arguments,
permission checks, execution limits, and a normalized result.

The model may request a tool call, but it never receives direct host
access. The backend validates the request and executes it through this
package.

### `packages/providers` --- Execution providers

-   Defines the contract between Aether and execution providers.
-   Implements Docker sandbox provisioning and lifecycle.
-   Selects only server-approved runtime configurations.
-   Applies resource limits, mounts, network policy, and cleanup.

MVP runtime registry contains **Node.js 22 only**. Do not accept
arbitrary Docker images, commands, mounts, or runtime settings from
model output.

### `packages/workspace` --- Persistent project files

-   Stores user project files independently of sandbox lifetime.
-   Creates task working snapshots.
-   Tracks file versions and hashes.
-   Builds changesets containing create/update/delete operations.
-   Applies changesets with base-version checks.
-   Supports rollback and ZIP export.

The sandbox is disposable. The persistent workspace is the source of
truth. Do not blindly copy the entire sandbox filesystem back into the
workspace.

### `packages/capabilities` --- Task-specific behavior

The MVP includes one capability: `coding`.

It defines coding task classification, instructions, templates, and
task-specific validation. The architecture can support more capabilities
later, but research and browser tools are not implemented in this MVP.

### `packages/database`, `packages/shared`, `packages/observability`

-   `database`: PostgreSQL schema, migrations, and data access.
-   `shared`: contracts and types shared across apps/packages; avoid
    putting business logic here.
-   `observability`: structured logs, metrics, traces, and security
    audit events.

## 5. Main Agent Execution Flow

``` text
User submits coding task
        |
        v
API validates and stores task
        |
        v
BullMQ queues task
        |
        v
Worker starts task workflow
        |
        v
Agent Orchestrator loads task context
        |
        v
Planning Engine asks Gemini for next decision
        |
        v
Agent Loop parses the response
        |
        +---- Final answer? ------> Evaluate and complete
        |
        +---- Ask user? ----------> WAITING_FOR_INPUT
        |
        +---- Tool call? ---------> Validate tool and permissions
                                      |
                                      v
                                Tool Executor
                                      |
                                      v
                                Docker Sandbox
                                      |
                                      v
                                Tool result
                                      |
                                      v
                                Save result/checkpoint
                                      |
                                      v
                                Add result to context
                                      |
                                      +----> Agent Loop repeats
```

After the coding task passes evaluation, Aether creates a changeset and
applies it to the persistent workspace. The UI receives task events and
displays the updated project.

## 6. Dependency Rules

Keep these boundaries:

1.  `apps/api` may call application services and enqueue jobs; it must
    not import Docker or Gemini implementations.
2.  `apps/worker` coordinates packages but should not contain agent
    reasoning or tool implementations.
3.  `agent-core` depends on interfaces for LLM, tools, persistence, and
    execution---not concrete Gemini or Docker SDKs.
4.  `llm` does not execute tools. It only communicates with the model.
5.  `tool-system` validates and dispatches tools; it does not decide the
    overall task plan.
6.  `providers` owns sandbox lifecycle and runtime enforcement.
7.  `workspace` owns persistent files and versioning; sandbox files are
    temporary working copies.
8.  Model output is untrusted input. Validate every tool name, argument,
    path, permission, and requested action on the server.
9.  Packages must not import from `apps/*`. Apps are composition roots.
10. Keep interfaces small; do not create abstractions for capabilities
    that are not yet implemented.

## 7. Sandbox Security Boundary

The Docker sandbox is for executing generated or otherwise untrusted
project code.

MVP baseline:

-   Run as a non-root user.
-   Apply CPU, memory, process, disk, and execution-time limits.
-   Never mount the Docker socket.
-   Never expose host secrets or unrestricted host paths.
-   Use a dedicated workspace working copy.
-   Disable network access during code execution and tests.
-   Route dependency installation through an allowlisted npm package
    proxy.
-   Disable package lifecycle scripts during installation where
    feasible.
-   Destroy the sandbox after the task, including on cancellation or
    failure.
-   Persist logs and required artifacts outside the sandbox.

A production deployment should evaluate stronger isolation such as
gVisor or microVMs before allowing untrusted external users.

## 8. MVP Runtime Policy

The MVP supports:

``` text
runtime: node22
language: JavaScript / TypeScript
package manager: npm
```

Python 3.12 and FastAPI are post-MVP roadmap items. Their future
addition should require a new approved runtime adapter and sandbox
image; it must not change the agent core or allow the model to select
arbitrary images.

## 9. Build Order

Build a thin, working vertical slice before expanding the architecture.

  Order   Deliverable
  ------- ---------------------------------------------------------
  1       Monorepo, shared types, config, database connection
  2       Basic Gemini provider adapter
  3       Custom agent loop with one safe tool
  4       Tool registry, schemas, validation, and executor
  5       Workspace file operations and snapshots
  6       Docker Node.js 22 sandbox and command execution
  7       Test execution, evaluator, and bounded repair
  8       BullMQ worker, checkpoints, cancellation, and recovery
  9       API, React UI, realtime events, and ZIP export
  10      Security hardening, observability, and end-to-end tests

Do not implement research, Python, browser automation, or deployment
before the Node.js coding workflow is reliable.

## 10. Definition of Done for the First Vertical Slice

Aether's first end-to-end milestone is complete when a user can submit a
simple Node.js project request and the system can:

-   Create a task and queue it.
-   Ask Gemini for a structured next action.
-   Call a registered tool through the custom agent loop.
-   Create and modify files in a task workspace.
-   Run the project in an isolated Node.js 22 sandbox.
-   Capture command output and test results.
-   Retry a bounded number of times when a repair is justified.
-   Save the final changeset to persistent storage.
-   Show task status and logs in the UI.

The first milestone does not need multiple agents, multi-capability
routing, Python, or a research workflow.
